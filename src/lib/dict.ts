/**
 * Словарь и разговорник: ленивая загрузка открытых данных и быстрый поиск.
 *
 * Данные (public/data, см. data/README.md):
 *   dict.json    — [udm, ru, pos, freqRank(0 = нет данных), flags('r' = рус. заимствование)]  · MIT
 *   phrases.json — [tatoebaId, udm, [ru…], author]                                        · CC BY 2.0 FR
 *   wikt.json    — { lemma: { g: [значения], x: [[udm, ru]], ipa? } }                       · CC BY-SA 4.0
 *
 * Поиск не учитывает регистр, ё/е и удмуртские диакритики (ӧ=о, ӥ=и, ӝ=ж, ӟ=з, ӵ=ч),
 * поэтому «озвучить» с обычной раскладки тоже работает.
 */
import { normalize, stripUdm } from './answer';

export type Entry = { udm: string; ru: string; pos: string; rank: number; loan: boolean; key: string; ruKey: string };
export type Phrase = { id: number; udm: string; ru: string[]; author: string; key: string; ruKey: string };
export type Wikt = { g: string[]; x: [string, string][]; ipa?: string };
export type Meta = { source: string; license: string; url: string };

/** Ключ поиска: без регистра, ё, диакритик и пунктуации. */
export const searchKey = (s: string) => stripUdm(normalize(s, { fixLatin: true })).replace(/-/g, ' ');

const url = (f: string) => `${import.meta.env.BASE_URL}data/${f}`;

let dictP: Promise<{ meta: Meta; entries: Entry[] }> | undefined;
let phrasesP: Promise<{ meta: Meta; entries: Phrase[] }> | undefined;
let wiktP: Promise<{ meta: Meta; entries: Record<string, Wikt> }> | undefined;

export function buildEntries(raw: [string, string, string, number, string][]): Entry[] {
  return raw.map(([udm, ru, pos, rank, flags]) => ({
    udm,
    ru,
    pos,
    rank,
    loan: flags.includes('r'),
    key: searchKey(udm),
    ruKey: ' ' + searchKey(ru).replace(/[;,()/]/g, ' ').replace(/\s+/g, ' ') + ' ',
  }));
}

export function buildPhrases(raw: [number, string, string[], string][]): Phrase[] {
  return raw.map(([id, udm, ru, author]) => ({
    id,
    udm,
    ru,
    author,
    key: ' ' + searchKey(udm) + ' ',
    ruKey: ' ' + searchKey(ru.join(' ')) + ' ',
  }));
}

export function loadDict() {
  dictP ??= fetch(url('dict.json'))
    .then((r) => r.json())
    .then((j) => ({ meta: j.meta, entries: buildEntries(j.entries) }));
  return dictP;
}
export function loadPhrases() {
  phrasesP ??= fetch(url('phrases.json'))
    .then((r) => r.json())
    .then((j) => ({ meta: j.meta, entries: buildPhrases(j.entries) }));
  return phrasesP;
}
export function loadWikt() {
  wiktP ??= fetch(url('wikt.json')).then((r) => r.json());
  return wiktP;
}

const byRank = (a: Entry, b: Entry) => (a.rank || 1e9) - (b.rank || 1e9) || a.udm.length - b.udm.length;

/**
 * Поиск слов в обе стороны. Ранжирование: точное совпадение → начало слова → вхождение;
 * внутри группы — по частоте (чаще — выше).
 */
export function searchEntries(entries: Entry[], query: string, limit = 50): { items: Entry[]; total: number } {
  const q = searchKey(query);
  if (!q) return { items: [], total: 0 };
  const exact: Entry[] = [];
  const prefix: Entry[] = [];
  const inner: Entry[] = [];
  const ruExact: Entry[] = [];
  const ruWord: Entry[] = [];
  const ruInner: Entry[] = [];
  const qw = ' ' + q + ' ';
  const qs = ' ' + q;
  for (const e of entries) {
    if (e.key === q) exact.push(e);
    else if (e.key.startsWith(q)) prefix.push(e);
    else if (q.length >= 3 && e.key.includes(q)) inner.push(e);
    else if (e.ruKey.includes(qw)) {
      // перевод — ровно это слово (с учётом «; » между значениями)
      if (e.ruKey.trim() === q) ruExact.push(e);
      else ruWord.push(e);
    } else if (q.length >= 3 && e.ruKey.includes(qs)) ruInner.push(e);
  }
  const all = [exact, ruExact, prefix, ruWord, inner, ruInner].flatMap((g) => g.sort(byRank));
  return { items: all.slice(0, limit), total: all.length };
}

/** Фразы, где встречается запрос (по словам удмуртского или русского текста). */
export function searchPhrases(phrases: Phrase[], query: string, limit = 30): { items: Phrase[]; total: number } {
  const q = searchKey(query);
  if (!q) return { items: [], total: 0 };
  const word: Phrase[] = [];
  const part: Phrase[] = [];
  const qs = ' ' + q;
  for (const p of phrases) {
    if (p.key.includes(qs) || p.ruKey.includes(qs)) word.push(p);
    else if (q.length >= 4 && (p.key.includes(q) || p.ruKey.includes(q))) part.push(p);
  }
  const all = [...word.sort((a, b) => a.udm.length - b.udm.length), ...part.sort((a, b) => a.udm.length - b.udm.length)];
  return { items: all.slice(0, limit), total: all.length };
}

/** Примеры для слова: фразы, где встречается само слово (с типичными окончаниями) или основа глагола. */
const NOUN_ENDINGS = '(ы|ыз|ыд|ын|ысь|ысен|ыя|эз|ез|э|е|ен|эн|ын|лэн|лы|лэсь|тэк|лань|озь|ед|эд|ъёс|ёс|ос|ъёсыз|ъёсын|ам|ад|аз|эныз|меос|еныд)?'
export function examplesFor(phrases: Phrase[], lemma: string, limit = 5): Phrase[] {
  const k = searchKey(lemma);
  if (k.length < 2) return [];
  const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const verb = /(ыны|аны|яны|ны)$/.test(k) && k.length > 4;
  const re = verb
    ? new RegExp(`(^|\\s)${esc(k.replace(/(ыны|аны|яны|ны)$/, ''))}`)
    : new RegExp(`(^|\\s)${esc(k)}${NOUN_ENDINGS}(\\s|$)`);
  return phrases
    .filter((p) => re.test(p.key.trim()))
    .sort((a, b) => a.udm.length - b.udm.length)
    .slice(0, limit);
}

/** Подсветка совпадения: разбить строку на куски [текст, совпало?] без учёта диакритик. */
export function highlight(text: string, query: string): [string, boolean][] {
  const q = searchKey(query);
  if (!q) return [[text, false]];
  const key = [...text].map((ch) => searchKey(ch) || ch).join('');
  const i = key.indexOf(q);
  if (i < 0 || key.length !== text.length) return [[text, false]];
  return [
    [text.slice(0, i), false],
    [text.slice(i, i + q.length), true],
    [text.slice(i + q.length), false],
  ].filter(([t]) => t) as [string, boolean][];
}
