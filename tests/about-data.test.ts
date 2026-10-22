/**
 * Данные раздела «О языке» (src/data/lang/*): языковая гигиена и источники.
 *  • каждая удмуртская строка — в NFC (ӧ — один символ U+04E7, а не о + ¨);
 *  • только кириллица: никаких латинских двойников (ö, ä, i вместо ӧ, ӓ, і);
 *  • у каждой записи есть непустой source.
 */
import { describe, expect, it } from 'vitest';
import * as alphabet from '../src/data/lang/alphabet';
import * as grammar from '../src/data/lang/grammar';
import * as cognates from '../src/data/lang/cognates';
import * as compare from '../src/data/lang/compare';
import { cyrTokens, latTokens, similarPrefix, splitSimilar } from '../src/data/lang/similar';
import { parseRich, udmParts } from '../src/data/lang/rich';

const modules = { alphabet, grammar, cognates, compare } as Record<string, Record<string, unknown>>;

/** Ключи, в которых лежит удмуртский текст. */
const UDM_KEYS = new Set(['udm', 'upper', 'lower', 'base', 'inf', 'pronoun', 'neg', 'verb', 'root', 'suffix', 'add']);
/** Ключи с другими кириллическими языками (коми, марийский) в таблице родственных слов. */
const CYR_LANG_KEYS = new Set(['kpv', 'mhr']);

/** Кириллица + пробелы и пунктуация. Любая латинская буква (включая ö, ä, ï) — ошибка. */
const CYRILLIC_ONLY = /^[\p{Script=Cyrillic}\s\-–—.,!?()«»'’…:;/]*$/u;
const LATIN = /\p{Script=Latin}/u;

type Hit = { path: string; value: string };

function collect(node: unknown, path: string, keys: Set<string>, out: Hit[], key = ''): void {
  if (typeof node === 'string') {
    if (keys.has(key)) out.push({ path, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => collect(v, `${path}[${i}]`, keys, out, key));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) collect(v, `${path}.${k}`, keys, out, k);
  }
}

const udmStrings: Hit[] = [];
/** Все строки вообще — чтобы достать удмуртские фрагменты *…* из пояснений. */
const allStrings: Hit[] = [];
const ANY = { has: () => true } as unknown as Set<string>;
for (const [name, mod] of Object.entries(modules)) {
  for (const [exp, value] of Object.entries(mod)) {
    if (typeof value === 'function') continue;
    collect(value, `${name}.${exp}`, UDM_KEYS, udmStrings);
    collect(value, `${name}.${exp}`, ANY, allStrings);
  }
}
// удмуртские фрагменты из пояснений тоже проверяем
for (const h of allStrings) for (const part of udmParts(h.value)) udmStrings.push({ path: `${h.path} *${part}*`, value: part });

/** Слова других языков в ячейках родственных слов: [путь, язык, слово]. */
const cognateCells = cognates.COGNATES.flatMap((r) =>
  Object.entries(r.forms).map(([lang, c]) => ({ path: `${r.id}.${lang}`, lang, w: c!.w })),
);

describe('данные «О языке»: удмуртские строки', () => {
  it('найдено достаточно строк для проверки', () => {
    expect(udmStrings.length).toBeGreaterThan(300);
  });

  it('все удмуртские строки в NFC', () => {
    for (const h of udmStrings) expect(h.value, h.path).toBe(h.value.normalize('NFC'));
  });

  it('удмуртские строки — только кириллица, без латинских двойников', () => {
    for (const h of udmStrings) {
      expect(LATIN.test(h.value), `${h.path}: «${h.value}»`).toBe(false);
      expect(CYRILLIC_ONLY.test(h.value), `${h.path}: «${h.value}»`).toBe(true);
    }
  });

  it('разметка *…* и _…_ закрыта (чётное число знаков)', () => {
    for (const h of allStrings) {
      expect((h.value.match(/\*/g) ?? []).length % 2, h.path).toBe(0);
      expect(parseRich(h.value).map((p) => p.text).join('').includes('*'), h.path).toBe(false);
    }
  });

  it('нет разложенных диакритик (U+0308 и др.)', () => {
    for (const h of udmStrings) expect(/\p{M}/u.test(h.value), `${h.path}: «${h.value}»`).toBe(false);
  });

  it('коми и марийские формы — кириллица в NFC; финские, эстонские, венгерские — латиница', () => {
    for (const c of cognateCells) {
      expect(c.w, c.path).toBe(c.w.normalize('NFC'));
      if (CYR_LANG_KEYS.has(c.lang)) expect(CYRILLIC_ONLY.test(c.w), `${c.path}: «${c.w}»`).toBe(true);
      else expect(/\p{Script=Cyrillic}/u.test(c.w), `${c.path}: «${c.w}»`).toBe(false);
    }
  });
});

describe('данные «О языке»: источники', () => {
  const isSourceList = (s: unknown) =>
    Array.isArray(s) &&
    s.length > 0 &&
    s.every((x) => x && typeof x === 'object' && typeof (x as { title: unknown }).title === 'string' && (x as { title: string }).title.length > 2);

  it('у каждой записи каждого экспортируемого списка есть source', () => {
    let checked = 0;
    for (const [name, mod] of Object.entries(modules)) {
      for (const [exp, value] of Object.entries(mod)) {
        if (!Array.isArray(value)) continue;
        for (const [i, rec] of value.entries()) {
          if (!rec || typeof rec !== 'object' || !('udm' in rec || 'title' in rec || 'id' in rec || 'upper' in rec)) continue;
          // справочники-перечни (лица, времена, языки, группы) — не записи о языке
          if (['PERSONS', 'TENSES', 'LANGS', 'GROUPS', 'COMPARE_LANGS'].includes(exp)) continue;
          expect(isSourceList((rec as { source?: unknown }).source), `${name}.${exp}[${i}]`).toBe(true);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(80);
  });

  it('у каждого объекта-раздела с удмуртским текстом есть source (свой или у родителя)', () => {
    const missing: string[] = [];
    const walk = (node: unknown, path: string, has: boolean) => {
      if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`, has));
      if (!node || typeof node !== 'object') return;
      const own = 'source' in node && isSourceList((node as { source: unknown }).source);
      const ok = has || own;
      if ('udm' in node && !ok) missing.push(path);
      for (const [k, v] of Object.entries(node)) if (k !== 'source') walk(v, `${path}.${k}`, ok);
    };
    for (const [name, mod] of Object.entries(modules))
      for (const [exp, value] of Object.entries(mod)) if (typeof value !== 'function') walk(value, `${name}.${exp}`, false);
    expect(missing).toEqual([]);
  });
});

describe('данные «О языке»: содержание', () => {
  it('алфавит: 38 букв, 5 особых в порядке Ӝ Ӟ Ӥ Ӧ Ӵ', () => {
    const L = alphabet.ALPHABET.letters;
    expect(L).toHaveLength(38);
    expect(L.filter((l) => l.special).map((l) => l.upper)).toEqual(['Ӝ', 'Ӟ', 'Ӥ', 'Ӧ', 'Ӵ']);
    expect(alphabet.SPECIAL_LETTERS.map((l) => l.upper)).toEqual(['Ӝ', 'Ӟ', 'Ӥ', 'Ӧ', 'Ӵ']);
    for (const l of L) expect(l.lower, l.upper).toBe(l.upper.toLowerCase());
  });

  it('коды Unicode особых букв', () => {
    expect(alphabet.SPECIAL_LETTERS.map((l) => alphabet.codePoint(l.lower))).toEqual(['U+04DD', 'U+04DF', 'U+04E5', 'U+04E7', 'U+04F5']);
    expect(alphabet.codePoint('Ӧ')).toBe('U+04E6');
  });

  it('пример у особой буквы содержит эту букву', () => {
    for (const l of alphabet.SPECIAL_LETTERS) for (const e of l.examples) expect(e.udm.toLowerCase(), l.upper).toContain(l.lower);
  });

  it('ударение: слоги складываются в слово', () => {
    const words = [...alphabet.STRESS.words, ...alphabet.STRESS.exceptions.flatMap((e) => e.pair ?? [])];
    for (const w of words) {
      expect(w.syll.join(''), w.udm).toBe(w.udm);
      expect(w.stress).toBeLessThan(w.syll.length);
    }
  });

  it('агглютинация: каждый шаг = предыдущее слово + суффикс', () => {
    for (const ch of grammar.MORPH_CHAINS) {
      expect(ch.steps[0].add).toBe('');
      for (let i = 1; i < ch.steps.length; i++) expect(ch.steps[i].udm, `${ch.id}[${i}]`).toBe(ch.steps[i - 1].udm + ch.steps[i].add);
    }
  });

  it('15 падежей: 8 грамматических и 7 местных; у одушевлённых нет местных', () => {
    expect(grammar.CASES).toHaveLength(15);
    expect(grammar.CASES.filter((c) => c.group === 'grammar')).toHaveLength(8);
    expect(grammar.CASES.filter((c) => c.group === 'place')).toHaveLength(7);
    for (const c of grammar.CASES) {
      expect(c.udm.startsWith('шур'), c.name).toBe(true);
      if (c.group === 'place') expect(c.animate, c.name).toBeNull();
      else expect(c.animate?.startsWith('вал'), c.name).toBe(true);
    }
  });

  it('притяжательные формы = основа + суффикс', () => {
    for (const w of grammar.POSSESSIVE)
      for (const [p, f] of Object.entries(w.forms)) if (f) expect(f.udm, `${w.id}.${p}`).toBe(w.base + f.suffix);
  });

  it('отрицание: 6 лиц в каждом времени, вспомогательный глагол по Алатыреву', () => {
    for (const v of grammar.VERBS)
      for (const t of grammar.TENSES) {
        expect(v.aff[t.id], `${v.id}.${t.id}`).toHaveLength(6);
        expect(v.neg[t.id].map((c) => c.neg)).toEqual(grammar.NEG_AUX[t.id]);
        expect(v.gloss[t.id]).toHaveLength(6);
      }
    expect(grammar.NEG_AUX.past).toEqual(['ӧй', 'ӧд', 'ӧз', 'ӧм', 'ӧд', 'ӧз']);
  });

  it('родственные слова: удмуртская форма есть, у каждой строки хотя бы одна пара', () => {
    const ids = new Set<string>();
    for (const r of cognates.COGNATES) {
      expect(ids.has(r.id), r.id).toBe(false);
      ids.add(r.id);
      expect(Object.values(r.forms).some((c) => c?.cognate), r.id).toBe(true);
    }
  });

  it('сравнение грамматики: у каждого признака есть все 6 языков', () => {
    for (const row of compare.GRAMMAR_COMPARE) for (const l of compare.COMPARE_LANGS) expect(row.cells[l.id], `${row.id}.${l.id}`).toBeTruthy();
  });
});

describe('подсветка похожих частей', () => {
  it('кириллица: гласные и мягкий знак', () => {
    expect(cyrTokens('ньыль').map((t) => t.t)).toEqual(['n', 'V', 'l']);
    expect(cyrTokens('юыны').map((t) => t.t)).toEqual(['j', 'V', 'n', 'V']);
  });
  it('венгерские диграфы', () => {
    expect(latTokens('száz', true).map((t) => t.t)).toEqual(['s', 'V', 'z']);
    expect(latTokens('nyíl', true).map((t) => t.t)).toEqual(['n', 'V', 'l']);
  });
  it('общее начало', () => {
    expect(similarPrefix('кык', 'kaksi', 'lat')).toEqual([3, 3]);
    expect(similarPrefix('вить', 'viisi', 'lat')).toEqual([2, 3]);
    expect(similarPrefix('одӥг', 'yksi', 'lat')).toEqual([0, 0]);
    expect(splitSimilar('кыл', 'kieli', 'lat').other).toEqual(['kiel', 'i']);
  });
});

