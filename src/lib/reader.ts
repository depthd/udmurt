/**
 * «Читалка»: разбивка фразы на слова и подсказка значения слова по нажатию.
 *
 * Где ищем значение (по порядку):
 *   1. разбор этой же фразы по морфемам (точнее всего — значение в контексте);
 *   2. однословные слова курса и разборы других фраз курса;
 *   3. большой словарь (dict.json): сначала точная форма, потом форма без окончаний
 *      («улӥсько» → «улыны», «карын» → «кар») — с пометкой «≈ форма слова».
 */
import type { LexItem, Morpheme } from './content/schema';
import { normalize } from './answer';
import { searchKey, type Entry } from './dict';

export type Token = { text: string; word: boolean };

/** Слова — буквы (вместе с дефисом внутри: «вань-а»), всё остальное — разделители. */
export function tokenizeLine(s: string): Token[] {
  const out: Token[] = [];
  const re = /\p{L}+(?:[-‑]\p{L}+)*/gu;
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index), word: false });
    out.push({ text: m[0], word: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), word: false });
  return out;
}

export type Gloss = {
  word: string;
  gloss: string;
  /** Из каких морфем слово (если знаем). */
  parts?: Morpheme[];
  /** Словарная форма, если слово найдено без окончания. */
  lemma?: string;
  from: 'phrase' | 'course' | 'dict';
};

/** Группы морфем, которые пишутся слитно: [ним, ы] → «нимы»; отдельное слово — своя группа. */
export function morphemeWords(ms: readonly Morpheme[]): { text: string; parts: Morpheme[] }[] {
  const groups: { text: string; parts: Morpheme[] }[] = [];
  for (const m of ms) {
    const prev = groups.at(-1);
    const last = prev?.parts.at(-1)!.kind;
    // слитно пишутся части одного слова; корень после суффикса начинает новое слово
    const glued = !!prev && last !== 'word' && m.kind !== 'word' && !(m.kind === 'root' && last === 'suffix');
    if (glued) {
      prev!.parts.push(m);
      prev!.text += m.form.replace(/^[-‑]+/, '');
    } else groups.push({ text: m.form.replace(/^[-‑]+/, ''), parts: [m] });
  }
  return groups;
}

const key = (s: string) => normalize(s, { fixLatin: false });

function meaningOf(parts: Morpheme[]): string {
  if (parts.length === 1) return parts[0].meaning;
  return parts.map((p) => p.meaning).join(' + ');
}

/** Искать слово в разборе одной фразы. */
export function glossInMorphemes(word: string, ms: readonly Morpheme[] | undefined): Omit<Gloss, 'from'> | undefined {
  if (!ms?.length) return;
  const w = key(word);
  for (const g of morphemeWords(ms)) {
    const t = key(g.text);
    // «нокытчы но» — слово-группа из двух слов: подходит любое из них
    if (t === w || (g.parts.length === 1 && t.split(' ').includes(w)))
      return { word, gloss: meaningOf(g.parts), parts: g.parts.length > 1 ? g.parts : undefined };
  }
}

/** Указатель по всему курсу: однословные слова и разборы фраз. */
export function buildCourseIndex(lexicon: readonly LexItem[]): Map<string, Omit<Gloss, 'from' | 'word'>> {
  const idx = new Map<string, Omit<Gloss, 'from' | 'word'>>();
  for (const it of lexicon) {
    if (it.status === 'draft') continue;
    const u = key(it.udm);
    if (it.kind !== 'phrase' && !u.includes(' ') && !idx.has(u)) idx.set(u, { gloss: it.ru, parts: it.morphemes.length > 1 ? it.morphemes : undefined });
  }
  for (const it of lexicon) {
    if (it.status === 'draft') continue;
    for (const g of morphemeWords(it.morphemes)) {
      const t = key(g.text);
      if (!t || t.includes('{') || idx.has(t)) continue;
      idx.set(t, { gloss: meaningOf(g.parts), parts: g.parts.length > 1 ? g.parts : undefined });
    }
  }
  return idx;
}

// Окончания, которые снимаем, чтобы найти словарную форму (ё уже заменена на е). Длинные — раньше коротких.
const VERB_ENDINGS = [
  'иськоды', 'ӥськоды', 'иськом', 'ӥськом', 'иськод', 'ӥськод', 'исько', 'ӥсько', 'иськы', 'ӥськы',
  'ськоды', 'ськом', 'ськод', 'сько', 'ськы', 'ском', 'скод', 'ско',
  'иды', 'ӥды', 'ид', 'ӥд', 'из', 'ӥз', 'ыны', 'ны', 'оды', 'омы', 'озы', 'од', 'ом', 'оз', 'о', 'е', 'э', 'и', 'ӥ', 'й', 'з', 'д',
];
const NOUN_ENDINGS = [
  'ъесты', 'ъесы', 'ъес', 'есты', 'есы', 'ес', 'осты', 'осы', 'ос', 'лэсь', 'лэн', 'лы', 'ысь', 'ысен', 'озь',
  'ын', 'эн', 'ен', 'ез', 'ыз', 'эз', 'ед', 'ыд', 'ам', 'ым', 'мы', 'ды', 'ты', 'ме', 'де', 'э', 'е', 'ы',
];
// Возвратные глаголы (-ськыны) в словаре часто нет — пробуем основу без -ськ-: вераськисько → вераны.
const REFLEXIVE = ['иськ', 'ӥськ', 'ськ', 'ск'];

/** Возможные словарные формы для слова (без гарантии — проверяем по словарю). */
export function lemmaCandidates(word: string): string[] {
  const w = key(word).replace(/-а$/, '');
  const out = new Set<string>([w]);
  const verb = (st: string) => {
    for (const inf of ['ыны', 'ьыны', 'аны', 'яны', 'ны']) out.add(st + inf);
  };
  for (const e of VERB_ENDINGS) {
    if (w.length - e.length < 2 || !w.endsWith(e)) continue;
    const st = w.slice(0, -e.length);
    verb(st);
    for (const r of REFLEXIVE) if (st.endsWith(r) && st.length - r.length >= 2) verb(st.slice(0, -r.length));
  }
  for (const e of NOUN_ENDINGS) {
    if (w.length - e.length < 2 || !w.endsWith(e)) continue;
    const st = w.slice(0, -e.length);
    out.add(st);
    // музее → музей (й перед окончанием выпадает)
    if (/[эе]$/.test(e) && /[аеиоуыэя]$/.test(st)) out.add(st + 'й');
  }
  return [...out];
}

export type DictIndex = Map<string, Entry>;

export function buildDictIndex(entries: readonly Entry[]): DictIndex {
  const idx: DictIndex = new Map();
  // entries отсортированы по частотности? Берём самое частотное значение для ключа.
  for (const e of entries) {
    const prev = idx.get(e.key);
    if (!prev || (e.rank && (!prev.rank || e.rank < prev.rank))) idx.set(e.key, e);
  }
  return idx;
}

/** Найти слово в словаре: сначала точная форма, потом кандидаты без окончаний. */
export function glossInDict(word: string, idx: DictIndex): Gloss | undefined {
  const exact = idx.get(searchKey(word.replace(/-а$/, '')));
  if (exact) return { word, gloss: exact.ru, lemma: key(exact.udm) === key(word) ? undefined : exact.udm, from: 'dict' };
  for (const c of lemmaCandidates(word).slice(1)) {
    const e = idx.get(searchKey(c));
    if (e) return { word, gloss: e.ru, lemma: e.udm, from: 'dict' };
  }
}

/** Значение слова без большого словаря (синхронно). */
export function glossLocal(word: string, item: LexItem | undefined, courseIdx: Map<string, Omit<Gloss, 'from' | 'word'>>): Gloss | undefined {
  const inPhrase = glossInMorphemes(word, item?.morphemes);
  if (inPhrase) return { ...inPhrase, from: 'phrase' };
  const w = key(word);
  const c = courseIdx.get(w) ?? courseIdx.get(w.replace(/-а$/, ''));
  if (c) return { word, ...c, from: 'course' };
}
