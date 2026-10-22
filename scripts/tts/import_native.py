#!/usr/bin/env python3
"""
Импорт записей носителя из архива страницы «Помочь проекту» (#/help).

  python3 -I scripts/tts/import_native.py udmurt-proverka-Имя-2026-10-22.zip [--dry-run]

Что делает:
  • каждую запись audio/<id>.<webm|m4a|ogg|wav> переводит в public/audio/<id>.mp3
    (обрезка тишины по краям, нормализация громкости, моно 22 кГц, 64 кбит/с — нужен ffmpeg);
  • пишет в public/audio/manifest.json запись {text, native: true, speaker, sha} —
    сборка подключит её вместо синтеза (vite/load-content.ts), mms_generate.py её не тронет;
  • пропускает записи, чей текст уже не совпадает с текущей фразой словника (фразу успели исправить);
  • печатает замечания носителя (review.md) — их нужно разобрать вручную в content/lexicon.
Согласие на публикацию (CC BY 4.0) обязательно: без него записи не импортируются.
"""
import hashlib, json, os, subprocess, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIO = os.path.join(ROOT, "public", "audio")


def lexicon_texts():
    """id → udm из content/lexicon/*.yaml (через node, чтобы не тянуть PyYAML)."""
    js = (
        "const Y=require('yaml'),fs=require('fs');const o={};"
        "for(const f of fs.readdirSync('content/lexicon'))for(const i of Y.parse(fs.readFileSync('content/lexicon/'+f,'utf8')).items)o[i.id]=i.udm;"
        "process.stdout.write(JSON.stringify(o))"
    )
    return json.loads(subprocess.run(["node", "-e", js], cwd=ROOT, check=True, capture_output=True, text=True).stdout)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if not args:
        print(__doc__)
        sys.exit(1)
    z = zipfile.ZipFile(args[0])
    meta = json.loads(z.read("review.json").decode("utf-8"))
    speaker = meta.get("speaker", {})
    print(z.read("review.md").decode("utf-8"))
    if not speaker.get("consent"):
        print("\n⚠ Нет согласия на публикацию (CC BY 4.0) — записи не импортированы. Замечания выше можно разобрать.")
        return
    texts = lexicon_texts()
    man_path = os.path.join(AUDIO, "manifest.json")
    man = json.load(open(man_path, encoding="utf-8"))
    done = skipped = 0
    for r in meta.get("recordings", []):
        id_, text = r["id"], r["text"]
        if texts.get(id_) != text:
            print(f"пропуск {id_}: фраза в словнике изменилась ({texts.get(id_)!r} ≠ {text!r})")
            skipped += 1
            continue
        data = z.read(r["file"])
        if dry:
            print(f"[dry-run] {id_}: {len(data)} байт")
            continue
        with tempfile.NamedTemporaryFile(suffix=os.path.splitext(r["file"])[1], delete=False) as tmp:
            tmp.write(data)
        out = os.path.join(AUDIO, f"{id_}.mp3")
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-af",
             "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_threshold=-45dB:stop_duration=0.4,"
             "adelay=120,loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "22050", "-codec:a", "libmp3lame", "-b:a", "64k", out],
            check=True,
        )
        os.unlink(tmp.name)
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out],
                                   check=True, capture_output=True, text=True).stdout.strip() or 0)
        man["items"][id_] = {
            "text": text,
            "sha": hashlib.sha1(text.encode()).hexdigest()[:10],
            "seconds": round(dur, 2),
            "native": True,
            "speaker": speaker.get("name", ""),
            "place": speaker.get("place", ""),
        }
        done += 1
        print(f"✓ {id_}: {text} ({dur:.1f} с)")
    if not dry:
        json.dump(man, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"\nготово: импортировано {done}, пропущено {skipped}. Добавьте носителя в content/sources.yaml и на страницу «Источники».")


if __name__ == "__main__":
    main()
