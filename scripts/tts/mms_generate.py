#!/usr/bin/env python3
"""
Синтез озвучки фраз моделью Meta MMS-TTS для удмуртского (facebook/mms-tts-udm, CC BY-NC 4.0).

  python -I scripts/tts/mms_generate.py items.json public/audio

items.json — [{id, text}] (см. list-items.mjs). Пишет public/audio/<id>.mp3 и public/audio/manifest.json.
Повторный запуск пересинтезирует только изменившиеся тексты. Нужны: torch, transformers, scipy, ffmpeg.
"""
import hashlib, json, os, subprocess, sys, tempfile
import torch
import scipy.io.wavfile as wavfile
from transformers import VitsModel, AutoTokenizer

MODEL = "facebook/mms-tts-udm"

def main():
    items_path, out_dir = sys.argv[1], sys.argv[2]
    items = json.load(open(items_path, encoding="utf-8"))
    os.makedirs(out_dir, exist_ok=True)
    man_path = os.path.join(out_dir, "manifest.json")
    manifest = json.load(open(man_path, encoding="utf-8")) if os.path.exists(man_path) else {"meta": {}, "items": {}}
    manifest["meta"] = {
        "model": MODEL,
        "license": "CC BY-NC 4.0",
        "note": "Синтез речи (Meta MMS-TTS). Может ошибаться в произношении; при появлении записей носителей — заменить.",
    }
    model = VitsModel.from_pretrained(MODEL)
    tok = AutoTokenizer.from_pretrained(MODEL)
    model.eval()
    done = 0
    for it in items:
        text = it["text"]
        sha = hashlib.sha1(text.encode()).hexdigest()[:10]
        prev = manifest["items"].get(it["id"])
        mp3 = os.path.join(out_dir, f"{it['id']}.mp3")
        if prev and prev.get("native"):
            continue  # запись носителя синтезом не перезаписываем
        if prev and prev.get("sha") == sha and os.path.exists(mp3):
            continue
        inp = tok(text, return_tensors="pt")
        if inp["input_ids"].shape[1] == 0:
            continue
        torch.manual_seed(0)
        with torch.no_grad():
            wav = model(**inp).waveform[0].numpy()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            wavfile.write(tmp.name, model.config.sampling_rate, wav)
            # тишина 0.15 с в начале, нормализация громкости, mp3 моно 48 кбит/с
            subprocess.run(
                ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name,
                 "-af", "adelay=150,loudnorm=I=-18:TP=-2", "-ac", "1", "-ar", "22050",
                 "-codec:a", "libmp3lame", "-b:a", "48k", mp3],
                check=True,
            )
            os.unlink(tmp.name)
        manifest["items"][it["id"]] = {"text": text, "sha": sha, "seconds": round(len(wav) / model.config.sampling_rate, 2)}
        done += 1
        print(f"{it['id']}: {text}", flush=True)
    json.dump(manifest, open(man_path, "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    print(f"готово: {done} новых, всего {len(manifest['items'])}")

if __name__ == "__main__":
    main()
