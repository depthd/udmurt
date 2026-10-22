/**
 * Чистые помощники для упражнений с вариантами (choice, listen, match).
 * Без зависимостей от Svelte и курса — их легко тестировать (tests/ex1.test.ts).
 */
import type { LexItem } from '$lib/content/schema';
import { seededShuffle } from '../../exercises/types';

export type Lang = 'udm' | 'ru';

/** Вариант ответа, готовый к показу. */
export type Option = {
  /** id слова словника. */
  id: string;
  /** Текст на языке варианта (уже с подставленным именем). */
  text: string;
  lang: Lang;
  emoji?: string;
};

/** Режим E2E-тестов: правильные варианты помечаются data-correct="true". */
export const E2E = import.meta.env.VITE_E2E === '1';

const same = (a: string, b: string) => a.trim().toLocaleLowerCase('ru') === b.trim().toLocaleLowerCase('ru');

/**
 * Варианты ответа: правильный + обманки, перемешанные детерминированно.
 * Обманки с тем же текстом, что и правильный ответ (или друг с другом), отбрасываются —
 * иначе два одинаковых варианта, один из которых «неверный».
 */
export function buildOptions(
  target: LexItem,
  distractors: readonly LexItem[],
  lang: Lang,
  seed: string,
  fmt: (s: string) => string = (s) => s,
): Option[] {
  const toOpt = (it: LexItem): Option => ({ id: it.id, text: fmt(lang === 'udm' ? it.udm : it.ru), lang, emoji: it.emoji });
  const list: Option[] = [toOpt(target)];
  for (const d of distractors) {
    if (d.id === target.id) continue;
    const o = toOpt(d);
    if (list.some((x) => same(x.text, o.text))) continue;
    list.push(o);
  }
  return seededShuffle(list, seed);
}

/**
 * Если обманок мало (у listen они необязательны), добираем из словника:
 * сначала слова того же вида (word/phrase), детерминированно по зерну.
 */
export function fillDistractors(
  target: LexItem,
  given: readonly LexItem[],
  pool: readonly LexItem[],
  seed: string,
  want = 2,
): LexItem[] {
  const out = given.filter((d) => d.id !== target.id);
  if (out.length >= want) return out;
  const taken = new Set([target.id, ...out.map((d) => d.id)]);
  const candidates = pool.filter((p) => !taken.has(p.id) && p.status !== 'draft' && !same(p.ru, target.ru) && !same(p.udm, target.udm));
  const sameKind = seededShuffle(
    candidates.filter((p) => p.kind === target.kind),
    seed,
  );
  const other = seededShuffle(
    candidates.filter((p) => p.kind !== target.kind),
    seed,
  );
  for (const c of [...sameKind, ...other]) {
    if (out.length >= want) break;
    out.push(c);
  }
  return out;
}

/**
 * Порядок правого столбца в «парах»: перемешан и не совпадает с левым построчно
 * (иначе ответ читается по строкам).
 */
export function matchColumns(ids: readonly string[], seed: string): { left: string[]; right: string[] } {
  const left = seededShuffle(ids, seed + ':udm');
  let right = seededShuffle(ids, seed + ':ru');
  if (ids.length > 1 && right.every((id, i) => id === left[i])) right = [...right.slice(1), right[0]];
  return { left, right };
}

/** Подсказка «почти»: пропущены удмуртские буквы. */
export function lettersNote(letters: readonly string[] | undefined): string {
  if (!letters?.length) return 'Обратите внимание на удмуртские буквы: ӧ ӥ ӟ ӝ ӵ.';
  if (letters.length === 1) return `Обратите внимание на букву «${letters[0]}».`;
  return `Обратите внимание на буквы ${letters.map((l) => `«${l}»`).join(', ')}.`;
}

/** Номер клавиши для варианта: 1–9, затем 0 (десятый). Дальше клавиш нет. */
export function keyLabel(i: number): string | undefined {
  if (i < 9) return String(i + 1);
  if (i === 9) return '0';
  return undefined;
}

/** Индекс варианта по нажатой клавише (обратное к keyLabel). */
export function keyIndex(key: string): number {
  if (key === '0') return 9;
  if (/^[1-9]$/.test(key)) return Number(key) - 1;
  return -1;
}

/** Нажатие клавиши можно трактовать как выбор варианта (не в поле ввода, без модификаторов). */
export function isChoiceKey(e: KeyboardEvent): boolean {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return false;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return false;
  return keyIndex(e.key) >= 0;
}
