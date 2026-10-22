/**
 * Игра «5 букв» (удмуртский вордл). Оценка букв как в Wordle, плюс «похожая буква»:
 * если на месте стоит о вместо ӧ, и вместо ӥ, ж/ӝ, з/ӟ, ч/ӵ — клетка синяя (идея башкирского «Һүҙле»).
 */
import { dayKey, diffDays } from './dates';

export type Mark = 'correct' | 'similar' | 'present' | 'absent';

const PAIRS: Record<string, string> = { о: 'ӧ', ӧ: 'о', и: 'ӥ', ӥ: 'и', ж: 'ӝ', ӝ: 'ж', з: 'ӟ', ӟ: 'з', ч: 'ӵ', ӵ: 'ч', е: 'ё', ё: 'е' };

export function score(guess: string, answer: string): Mark[] {
  const g = [...guess.toLowerCase()];
  const a = [...answer.toLowerCase()];
  const marks: Mark[] = Array(g.length).fill('absent');
  const left: Record<string, number> = {};
  g.forEach((ch, i) => {
    if (ch === a[i]) marks[i] = 'correct';
    else if (PAIRS[ch] === a[i]) marks[i] = 'similar';
    else left[a[i]] = (left[a[i]] ?? 0) + 1;
  });
  g.forEach((ch, i) => {
    if (marks[i] !== 'absent') return;
    if (left[ch]) {
      marks[i] = 'present';
      left[ch] -= 1;
    }
  });
  return marks;
}

/** Номер дня игры (с 1 сентября 2026). */
export function dayIndex(now = new Date()): number {
  return diffDays('2026-09-01', dayKey(now));
}

/** Слово дня: детерминированная перестановка списка (чтобы слова шли не по алфавиту и не по частоте). */
export function answerFor(answers: readonly [string, string][], index: number): [string, string] {
  const n = answers.length;
  const i = (((index * 7919 + 104729) % n) + n) % n;
  return answers[i];
}

const RANK: Record<Mark, number> = { absent: 0, present: 1, similar: 2, correct: 3 };
/** Цвета клавиш: лучшая оценка буквы по всем попыткам. */
export function keyMarks(rows: { guess: string; marks: Mark[] }[]): Record<string, Mark> {
  const out: Record<string, Mark> = {};
  for (const r of rows)
    [...r.guess].forEach((ch, i) => {
      const m = r.marks[i];
      if (!out[ch] || RANK[m] > RANK[out[ch]]) out[ch] = m;
    });
  return out;
}

export const EMOJI: Record<Mark, string> = { correct: '🟩', similar: '🟦', present: '🟨', absent: '⬜' };
