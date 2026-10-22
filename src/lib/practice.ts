/**
 * Генератор сессии повторения из словника.
 * Чередует форматы (выбор → плитки → ввод), чтобы слово вспоминалось по-разному
 * (docs/research/03-learning-science.md: лестница формата, interleaving).
 */
import type { Exercise, LexItem } from './content/schema';
import { tokenize } from './answer';
import { seededShuffle } from '../exercises/types';

export type PracticeMode = 'due' | 'mistakes' | 'warmup';

/** Выбрать слова для сессии. */
export function pickItems(opts: {
  mode: PracticeMode;
  due: string[];
  mistakes: Record<string, number>;
  known: string[];
  strength: (id: string) => number;
  lexicon: Map<string, LexItem>;
  size?: number;
  seed: string;
}): string[] {
  const size = opts.size ?? 10;
  const ok = (id: string) => {
    const it = opts.lexicon.get(id);
    return !!it && it.status !== 'draft';
  };
  const known = opts.known.filter(ok);
  let ids: string[];
  if (opts.mode === 'mistakes') {
    ids = Object.entries(opts.mistakes)
      .filter(([id, n]) => n > 0 && ok(id))
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  } else if (opts.mode === 'warmup') {
    ids = seededShuffle(known, opts.seed);
  } else {
    const due = opts.due.filter(ok);
    const weak = known.filter((id) => !due.includes(id)).sort((a, b) => opts.strength(a) - opts.strength(b));
    ids = [...due, ...weak];
  }
  return [...new Set(ids)].slice(0, opts.mode === 'warmup' ? Math.min(5, size) : size);
}

/** Дистракторы того же вида (слово/фраза), с другим переводом. */
function distractorsFor(it: LexItem, pool: LexItem[], seed: string, n = 2): string[] {
  const same = pool.filter((p) => p.id !== it.id && p.kind === it.kind && p.ru !== it.ru && p.udm !== it.udm);
  const other = pool.filter((p) => p.id !== it.id && p.kind !== it.kind && p.ru !== it.ru);
  return [...seededShuffle(same, seed), ...seededShuffle(other, seed + 'o')].slice(0, n).map((p) => p.id);
}

/** Построить задания: по 1 на слово, форматы чередуются; короткие сессии дополняются вторым проходом. */
export function buildPractice(ids: string[], lexicon: Map<string, LexItem>, seed: string): Exercise[] {
  const items = ids.map((id) => lexicon.get(id)).filter((x): x is LexItem => !!x);
  const pool = [...lexicon.values()].filter((p) => p.status !== 'draft');
  const out: Exercise[] = [];
  const round = (list: LexItem[], offset: number) => {
    list.forEach((it, i) => {
      const k = (i + offset) % 4;
      const words = tokenize(it.udm).length;
      const s = `${seed}-${it.id}-${offset}`;
      if (k === 0) out.push({ type: 'choice', dir: 'udm-ru', item: it.id, distractors: distractorsFor(it, pool, s), pictures: false, id: s });
      else if (k === 1 && words >= 2)
        out.push({ type: 'tiles', dir: 'ru-udm', item: it.id, extra: extraWords(it, pool, s), id: s });
      else if (k === 2 && words <= 3) out.push({ type: 'type', dir: 'ru-udm', item: it.id, id: s });
      else if (k === 3 && words >= 2) out.push({ type: 'tiles', dir: 'udm-ru', item: it.id, extra: extraRu(it, pool, s), id: s });
      else out.push({ type: 'choice', dir: 'ru-udm', item: it.id, distractors: distractorsFor(it, pool, s), pictures: false, id: s });
    });
  };
  round(items, 0);
  if (items.length && items.length < 6) round(seededShuffle(items, seed + 'r2'), 1);
  // пары в конце — короткая «разрядка», если хватает слов
  const words = items.filter((i) => tokenize(i.udm).length <= 2);
  if (words.length >= 3) out.push({ type: 'match', items: words.slice(0, 5).map((i) => i.id), id: `${seed}-match` });
  return out;
}

function extraWords(it: LexItem, pool: LexItem[], seed: string): string[] {
  const mine = new Set(tokenize(it.udm).map((w) => w.toLowerCase()));
  const cands = pool.flatMap((p) => tokenize(p.udm)).filter((w) => !mine.has(w.toLowerCase()) && !w.includes('{'));
  return seededShuffle([...new Set(cands)], seed).slice(0, 2);
}

function extraRu(it: LexItem, pool: LexItem[], seed: string): string[] {
  const mine = new Set(tokenize(it.ru).map((w) => w.toLowerCase()));
  const cands = pool.flatMap((p) => tokenize(p.ru)).filter((w) => !mine.has(w.toLowerCase()) && !w.includes('{'));
  return seededShuffle([...new Set(cands)], seed).slice(0, 2);
}
