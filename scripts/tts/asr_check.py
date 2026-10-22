#!/usr/bin/env python3
"""
Обратная проверка синтеза: распознаём каждую запись моделью MMS ASR (facebook/mms-1b-all, адаптер udm)
и сравниваем с исходным текстом. Высокая доля ошибок (CER) — повод переслушать запись.

  python -I scripts/tts/asr_check.py public/audio docs/audio-qa.md
"""
import json, os, re, subprocess, sys
import numpy as np
import torch
from transformers import Wav2Vec2ForCTC, AutoProcessor

def norm(s):
    s = s.lower().replace("ё", "е")
    s = re.sub(r"[^\w\s-]", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def cer(a, b):
    a, b = norm(a), norm(b)
    if not b:
        return 1.0
    prev = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        cur = [i]
        for j in range(1, len(b) + 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] != b[j - 1])))
        prev = cur
    return prev[-1] / len(b)

def load16k(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0

def main():
    audio_dir, report = sys.argv[1], sys.argv[2]
    man = json.load(open(os.path.join(audio_dir, "manifest.json"), encoding="utf-8"))
    proc = AutoProcessor.from_pretrained("facebook/mms-1b-all")
    model = Wav2Vec2ForCTC.from_pretrained("facebook/mms-1b-all")
    proc.tokenizer.set_target_lang("udm")
    model.load_adapter("udm")
    model.eval()
    rows = []
    for id_, it in sorted(man["items"].items()):
        if it.get("native"):
            continue  # записи носителей не проверяем распознаванием
        if it.get("asr_sha") == it.get("sha") and "cer" in it:
            rows.append((it["cer"], id_, it["text"], it.get("asr", "")))
            continue
        x = load16k(os.path.join(audio_dir, f"{id_}.mp3"))
        inp = proc(x, sampling_rate=16000, return_tensors="pt")
        with torch.no_grad():
            ids = torch.argmax(model(**inp).logits, dim=-1)[0]
        hyp = proc.decode(ids)
        c = cer(hyp, it["text"])
        it["asr"] = hyp
        it["cer"] = round(c, 3)
        it["asr_sha"] = it.get("sha")
        rows.append((c, id_, it["text"], hyp))
        print(f"{c:.2f}  {it['text']}  →  {hyp}", flush=True)
    json.dump(man, open(os.path.join(audio_dir, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, sort_keys=True)
    rows.sort(reverse=True)
    good = sum(1 for r in rows if r[0] <= 0.15)
    with open(report, "w", encoding="utf-8") as f:
        f.write("# Проверка синтезированной озвучки\n\n")
        f.write("Каждая запись (Meta MMS-TTS) распознана обратно моделью MMS ASR (`facebook/mms-1b-all`, адаптер `udm`).\n")
        f.write("CER — доля символов, распознанных не так. Это косвенная проверка: она ловит грубые сбои синтеза,\n")
        f.write("но не заменяет носителя. Записи с CER > 0,35 на сайте не используются.\n\n")
        f.write(f"Всего записей: {len(rows)}; CER ≤ 0,15: {good}; медиана: {sorted(r[0] for r in rows)[len(rows)//2]:.2f}.\n\n")
        f.write("| CER | id | Текст | Распознано |\n|---|---|---|---|\n")
        for c, id_, t, h in rows:
            f.write(f"| {c:.2f} | `{id_}` | {t} | {h} |\n")
    print("отчёт:", report)

if __name__ == "__main__":
    main()
