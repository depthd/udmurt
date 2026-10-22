#!/usr/bin/env python3
"""Данные для игры «5 букв»: python3 -I scripts/build_wordle.py → public/data/wordle.json
Загадки — частые исконные 5-буквенные слова (не глаголы, без русских заимствований); допустимые ответы — все
5-буквенные леммы словаря uniparser (MIT)."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
d = json.loads((ROOT / "public/data/dict.json").read_text(encoding="utf-8"))["entries"]
ok = lambda w: len(w) == 5 and re.fullmatch(r"[а-яӝӟӥӧӵ]+", w)
valid = sorted({e[0] for e in d if ok(e[0])})
answers, seen = [], set()
for udm, ru, pos, rank, flags in sorted(d, key=lambda e: e[3] or 10**9):
    if ok(udm) and 0 < rank <= 8000 and "r" not in flags and pos in ("сущ.", "прил.", "нареч.", "числ.") and udm not in seen:
        seen.add(udm)
        answers.append([udm, ru.split(";")[0].strip()])
out = {"meta": {"source": "uniparser-grammar-udm", "license": "MIT"}, "answers": answers, "valid": valid}
(ROOT / "public/data/wordle.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(len(answers), "загадок,", len(valid), "допустимых слов")
