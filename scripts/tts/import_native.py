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
import hashlib, json, os, re, subprocess, sys, tempfile, zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIO = os.path.join(ROOT, "public", "audio")

# Архив присылает посторонний человек — это недоверенные данные:
ID_RE = re.compile(r"^[a-z0-9-]{1,80}$")          # id фразы: только так, никаких путей
EXTS = {".webm", ".ogg", ".m4a", ".mp4", ".wav"}   # только звук из браузера
MAX_FILE = 5 * 1024 * 1024                        # одна запись — до 5 МБ (12 с в браузере — это ~200 КБ)
MAX_TOTAL = 300 * 1024 * 1024                     # весь архив в распакованном виде
MAX_JSON = 2 * 1024 * 1024


def clean(text, limit=4000):
    """Текст от автора архива без управляющих символов (иначе можно испортить терминал)."""
    return re.sub(r"[\x00-\x08\x0b-\x1f\x7f\x1b]", "", str(text))[:limit]


def read_limited(z, name, limit):
    info = z.getinfo(name)
    if info.file_size > limit:
        raise ValueError(f"{name}: слишком большой файл ({info.file_size} байт)")
    return z.read(info)


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
    total = sum(i.file_size for i in z.infolist())
    if total > MAX_TOTAL or len(z.infolist()) > 3000:
        sys.exit(f"Архив слишком большой ({total} байт, {len(z.infolist())} файлов) — не импортирую.")
    meta = json.loads(read_limited(z, "review.json", MAX_JSON).decode("utf-8"))
    if not isinstance(meta, dict):
        sys.exit("review.json: неверный формат")
    speaker = meta.get("speaker") if isinstance(meta.get("speaker"), dict) else {}
    print(clean(read_limited(z, "review.md", MAX_JSON).decode("utf-8", "replace"), 200_000))
    if not speaker.get("consent"):
        print("\n⚠ Нет согласия на публикацию (CC BY 4.0) — записи не импортированы. Замечания выше можно разобрать.")
        return
    texts = lexicon_texts()
    man_path = os.path.join(AUDIO, "manifest.json")
    man = json.load(open(man_path, encoding="utf-8"))
    done = skipped = 0
    for r in meta.get("recordings", []) if isinstance(meta.get("recordings"), list) else []:
        if not isinstance(r, dict):
            continue
        id_, text, fname = str(r.get("id", "")), str(r.get("text", "")), str(r.get("file", ""))
        ext = os.path.splitext(fname)[1].lower()
        if not ID_RE.match(id_) or ext not in EXTS or fname != f"audio/{id_}{ext}":
            print(f"пропуск: странная запись {clean(id_, 80)!r} / {clean(fname, 120)!r}")
            skipped += 1
            continue
        if texts.get(id_) != text:
            print(f"пропуск {id_}: фраза в словнике изменилась ({texts.get(id_)!r} ≠ {text!r})")
            skipped += 1
            continue
        data = read_limited(z, fname, MAX_FILE)
        if dry:
            print(f"[dry-run] {id_}: {len(data)} байт")
            continue
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(data)
        out = os.path.join(AUDIO, f"{id_}.mp3")
        subprocess.run(
            # -t 20: даже «бесконечный» файл даст не больше 20 с звука
            ["ffmpeg", "-nostdin", "-y", "-loglevel", "error", "-t", "20", "-i", tmp.name, "-t", "20", "-af",
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
            "speaker": clean(speaker.get("name", ""), 80),
            "place": clean(speaker.get("place", ""), 120),
        }
        done += 1
        print(f"✓ {id_}: {text} ({dur:.1f} с)")
    if not dry:
        json.dump(man, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"\nготово: импортировано {done}, пропущено {skipped}. Добавьте носителя в content/sources.yaml и на страницу «Источники».")


if __name__ == "__main__":
    main()
