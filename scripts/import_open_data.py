#!/usr/bin/env python3
"""
Импорт открытых данных по удмуртскому языку в public/data/ (для словаря и разговорника).

Источники (скачать заранее в одну папку SRC):
  SRC/tatoeba/udm_sentences_detailed.tsv   https://downloads.tatoeba.org/exports/per_language/udm/
  SRC/tatoeba/udm-rus_links.tsv            (там же, links udm→rus)
  SRC/tatoeba/rus_sentences.tsv            https://downloads.tatoeba.org/exports/per_language/rus/
  SRC/git/uniparser-grammar-udm/           https://github.com/timarkh/uniparser-grammar-udm (MIT)
  SRC/kaikki/udm_ru.jsonl                  https://kaikki.org/ruwiktionary/ (CC BY-SA 4.0)

Запуск:  python3 -I scripts/import_open_data.py SRC
Результат: public/data/dict.json, public/data/phrases.json, public/data/wikt.json
и файлы лицензий в data/licenses/. Скрипт детерминирован: одинаковый вход → одинаковый выход.
"""
import csv
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "data"


def nfc(s: str) -> str:
    return unicodedata.normalize("NFC", s.strip())


def parse_lexemes(path: Path):
    lex = None
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("-lexeme"):
            if lex:
                yield lex
            lex = {}
        elif lex is not None and line.startswith(" ") and ":" in line:
            k, v = line.strip().split(":", 1)
            lex.setdefault(k.strip(), []).append(v.strip())
    if lex:
        yield lex


POS_RU = {
    "N": "сущ.", "V": "гл.", "ADJ": "прил.", "ADV": "нареч.", "PRO": "мест.", "NUM": "числ.",
    "POST": "послелог", "CNJ": "союз", "PART": "частица", "INTJ": "межд.", "INTRJ": "межд.", "PREDIC": "предикатив", "PARENTH": "вводн. сл.", "PREP": "предлог", "CONJ": "союз", "IMIT": "звукоподр.",
    "NRel": "служ. имя", "ADJPRO": "мест.", "ADVPRO": "нареч.", "Q": "вопр.",
}


def build_dictionary(src: Path):
    up = src / "git" / "uniparser-grammar-udm"
    # Частоты лемм: wordlist.csv (форма → частота) + wordlist_analyzed.txt (форма → леммы)
    form_freq = {}
    with open(up / "wordlists" / "wordlist.csv", encoding="utf-8-sig") as f:
        for row in csv.reader(f, delimiter="\t"):
            if len(row) >= 2 and row[1].isdigit():
                form_freq[row[0].lower()] = int(row[1])
    lemma_freq = defaultdict(int)
    w_re = re.compile(r"<w>(.*?)</w>")
    a_re = re.compile(r'<ana l="([^"]*)" gr="([^"]*)"')
    for line in (up / "wordlists" / "wordlist_analyzed.txt").read_text(encoding="utf-8").splitlines():
        m = w_re.search(line)
        if not m:
            continue
        form = m.group(1).rsplit(">", 1)[-1].lower()
        fr = form_freq.get(form, 0)
        lemmas = {(nfc(l).lower(), gr.split(",")[0]) for l, gr in a_re.findall(line)}
        for key in lemmas:
            lemma_freq[key] += fr // max(1, len(lemmas))

    entries = {}
    for f in sorted(up.glob("udm_lexemes_*.txt")):
        if f.name == "udm_lexemes_N_persn.txt":
            continue  # личные имена — не для словаря
        for lx in parse_lexemes(f):
            lemma = nfc((lx.get("lex") or [""])[0])
            gramm = (lx.get("gramm") or [""])[0].split(",")
            ru = nfc((lx.get("trans_ru") or [""])[0])
            if not lemma or not ru or lemma.startswith("PLACEHOLDER"):
                continue
            tags = set(gramm[1:])
            if tags & {"PN", "abbr", "missp", "famn", "persn", "patrn", "topn"}:
                continue
            if re.search(r"[A-Za-z0-9]", lemma):
                continue
            pos = gramm[0]
            key = (lemma.lower(), pos)
            freq = lemma_freq.get(key, 0)
            rus_loan = "rus" in tags
            if key in entries:
                have = entries[key]["ru"].split("; ")
                entries[key]["ru"] = "; ".join(have + [x for x in ru.split("; ") if x not in have])
                continue
            ru = "; ".join(dict.fromkeys(ru.split("; ")))
            entries[key] = {"udm": lemma, "ru": ru, "pos": POS_RU.get(pos, pos), "f": freq, "loan": rus_loan}

    items = sorted(entries.values(), key=lambda e: (-e["f"], e["udm"]))
    rank = 0
    out = []
    for e in items:
        rank += 1
        # [udm, ru, pos, rank (по частоте; 0 — нет данных), флаги]
        flags = "r" if e["loan"] else ""
        out.append([e["udm"], e["ru"][:200], e["pos"], rank if e["f"] > 0 else 0, flags])
    return out


def build_phrases(src: Path):
    t = src / "tatoeba"
    udm = {}
    with open(t / "udm_sentences_detailed.tsv", encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
            if len(row) >= 4:
                udm[row[0]] = (nfc(row[2]), row[3])
    links = defaultdict(list)
    with open(t / "udm-rus_links.tsv", encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t"):
            if len(row) >= 2 and row[0] in udm:
                links[row[0]].append(row[1])
    need = {r for rs in links.values() for r in rs}
    rus = {}
    with open(t / "rus_sentences.tsv", encoding="utf-8") as f:
        for row in csv.reader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
            if len(row) >= 3 and row[0] in need:
                rus[row[0]] = nfc(row[2])
    out = []
    for uid in sorted(links, key=int):
        text, user = udm[uid]
        rts = [rus[r] for r in sorted(links[uid], key=int) if r in rus]
        if not rts:
            continue
        # [id Tatoeba, удмуртский, [переводы], автор]
        out.append([int(uid), text, rts[:3], user])
    return out


def build_wikt(src: Path):
    out = {}
    with open(src / "kaikki" / "udm_ru.jsonl", encoding="utf-8") as f:
        for line in f:
            d = json.loads(line)
            w = nfc(d.get("word", ""))
            if not w:
                continue
            glosses, examples = [], []
            for s in d.get("senses", []):
                for g in s.get("glosses", []):
                    if g and g not in glosses:
                        glosses.append(g)
                for ex in s.get("examples", []):
                    txt = nfc(ex.get("text", "") or "")
                    tr = nfc(ex.get("translation", "") or ex.get("english", "") or "")
                    if txt and tr:
                        examples.append([txt, tr])
            ipa = next((s.get("ipa") for s in d.get("sounds", []) if s.get("ipa")), None)
            if not glosses:
                continue
            e = out.setdefault(w, {"g": [], "x": []})
            e["g"] += [g for g in glosses if g not in e["g"]]
            e["x"] += examples[:3]
            if ipa:
                e["ipa"] = ipa
    return dict(sorted(out.items()))


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    OUT.mkdir(parents=True, exist_ok=True)
    meta = lambda name, lic, url, extra=None: {"source": name, "license": lic, "url": url, **(extra or {})}

    d = build_dictionary(src)
    (OUT / "dict.json").write_text(json.dumps({
        "meta": meta("uniparser-grammar-udm (Т. Архангельский, М. Медведева, УдмФИЦ УрО РАН, Е. Кашкин)", "MIT",
                     "https://github.com/timarkh/uniparser-grammar-udm",
                     {"fields": ["udm", "ru", "pos", "freqRank", "flags(r=рус. заимств.)"]}),
        "entries": d}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    p = build_phrases(src)
    (OUT / "phrases.json").write_text(json.dumps({
        "meta": meta("Tatoeba", "CC BY 2.0 FR", "https://tatoeba.org/", {"fields": ["id", "udm", "ru[]", "author"]}),
        "entries": p}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    w = build_wikt(src)
    (OUT / "wikt.json").write_text(json.dumps({
        "meta": meta("Викисловарь (ru.wiktionary) через kaikki.org", "CC BY-SA 4.0",
                     "https://ru.wiktionary.org/wiki/Категория:Удмуртский_язык", {"fields": {"g": "значения", "x": "примеры", "ipa": "МФА"}}),
        "entries": w}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"dict: {len(d)} статей, phrases: {len(p)} пар, wikt: {len(w)} статей")


if __name__ == "__main__":
    main()
