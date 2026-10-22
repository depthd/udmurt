/**
 * Логика очереди урока — чистые функции без Svelte (их проверяет tests/lesson.test.ts).
 *
 * Правила (PLAN.md, отчёт 03 — successive relearning):
 *  - задания идут по порядку; неверно решённое (кроме teach) один раз добавляется в конец очереди,
 *    чтобы до конца урока ученик хотя бы раз ответил правильно;
 *  - прогресс-бар считает уникальные исходные задания: ошибка его не двигает
 *    (задание «закрывается», когда решено или когда повторов больше не осталось);
 *  - «верно» для итогов — с первой попытки («почти» тоже засчитывается);
 *  - оценки для интервального повторения берутся из первой попытки каждого задания,
 *    ограничиваются исходом (ошибка → 1, почти → ≤2, верно → как дал компонент: 3 или 4),
 *    а если слово встретилось несколько раз — берётся минимальная.
 */
import type { Exercise } from './content/schema';
import type { Grade } from './srs';
import type { AnswerResult } from '../exercises/types';
import type { LessonResult } from './progress.svelte';

export type Outcome = 'correct' | 'almost' | 'wrong';

/** Сколько раз одно задание может вернуться в конец очереди. */
export const MAX_REQUEUE = 1;

export type Entry = {
  ex: Exercise;
  /** Индекс исходного задания в уроке. */
  origin: number;
  /** 0 — первая попытка, 1 — повтор ошибки… */
  attempt: number;
};

export type Run = {
  readonly queue: readonly Entry[];
  /** Текущая позиция в очереди. */
  readonly pos: number;
  /** Позиция, на которую уже получен ответ (защита от двойной проверки). */
  readonly answered: number;
  /** Число исходных заданий (для прогресс-бара). */
  readonly total: number;
  /** Исходные задания, к которым больше не вернёмся. */
  readonly resolved: readonly number[];
  /** Исход первой попытки для каждого оцениваемого (не teach) задания. */
  readonly first: Readonly<Record<number, Outcome>>;
  readonly requeues: Readonly<Record<number, number>>;
  readonly grades: Readonly<Record<string, Grade>>;
  /** Верных ответов подряд (сейчас) и лучшая серия за урок. */
  readonly streak: number;
  readonly bestStreak: number;
  /** Последний исход (для плашки и звука). */
  readonly last?: Outcome;
};

export const isTeach = (ex: Exercise) => ex.type === 'teach';

export function createRun(exercises: readonly Exercise[]): Run {
  return {
    queue: exercises.map((ex, origin) => ({ ex, origin, attempt: 0 })),
    pos: 0,
    answered: -1,
    total: exercises.length,
    resolved: [],
    first: {},
    requeues: {},
    grades: {},
    streak: 0,
    bestStreak: 0,
  };
}

export function currentEntry(run: Run): Entry | undefined {
  return run.queue[run.pos];
}

export function isFinished(run: Run): boolean {
  return run.pos >= run.queue.length;
}

export function outcomeOf(r: Pick<AnswerResult, 'correct' | 'almost'>): Outcome {
  if (r.almost) return 'almost';
  return r.correct ? 'correct' : 'wrong';
}

/** Ограничить оценку компонента исходом ответа. */
export function capGrade(g: Grade, outcome: Outcome): Grade {
  const cap = outcome === 'wrong' ? 1 : outcome === 'almost' ? 2 : 4;
  return Math.max(1, Math.min(g, cap)) as Grade;
}

/** Слить оценки: для повторяющихся слов остаётся минимальная. */
export function mergeGrades(
  acc: Readonly<Record<string, Grade>>,
  grades: Readonly<Record<string, Grade>> | undefined,
  outcome: Outcome,
): Record<string, Grade> {
  const out: Record<string, Grade> = { ...acc };
  for (const [id, g] of Object.entries(grades ?? {})) {
    if (!g) continue;
    const v = capGrade(g, outcome);
    out[id] = id in out ? (Math.min(out[id], v) as Grade) : v;
  }
  return out;
}

/** Записать ответ на текущее задание (без перехода дальше). */
export function recordAnswer(run: Run, result: AnswerResult, maxRequeue = MAX_REQUEUE): Run {
  const entry = currentEntry(run);
  if (!entry || run.answered === run.pos) return run;
  const outcome = isTeach(entry.ex) ? 'correct' : outcomeOf(result);
  const firstTry = !(entry.origin in run.first) && entry.attempt === 0;

  let { queue, resolved, first, requeues, grades, streak, bestStreak } = run;

  if (firstTry) grades = mergeGrades(grades, result.grades, outcome);

  if (isTeach(entry.ex)) {
    resolved = addOnce(resolved, entry.origin);
  } else {
    if (firstTry) first = { ...first, [entry.origin]: outcome };
    streak = outcome === 'wrong' ? 0 : streak + 1;
    bestStreak = Math.max(bestStreak, streak);
    const used = requeues[entry.origin] ?? 0;
    if (outcome === 'wrong' && used < maxRequeue) {
      queue = [...queue, { ex: entry.ex, origin: entry.origin, attempt: entry.attempt + 1 }];
      requeues = { ...requeues, [entry.origin]: used + 1 };
    } else {
      resolved = addOnce(resolved, entry.origin);
    }
  }

  return { ...run, queue, resolved, first, requeues, grades, streak, bestStreak, answered: run.pos, last: outcome };
}

/** Перейти к следующему заданию (только после ответа на текущее). */
export function advance(run: Run): Run {
  if (run.answered !== run.pos || isFinished(run)) return run;
  return { ...run, pos: run.pos + 1 };
}

export function progressOf(run: Run): { done: number; total: number } {
  return { done: run.resolved.length, total: run.total };
}

/** Сколько оцениваемых (не teach) заданий в уроке. */
export function scoredTotal(exercises: readonly Exercise[]): number {
  return exercises.filter((ex) => !isTeach(ex)).length;
}

/** Итог урока для progress.completeLesson. */
export function summarize(run: Run, lessonId: string, ms: number): LessonResult {
  const scored = run.queue.filter((e) => e.attempt === 0 && !isTeach(e.ex));
  const correct = scored.filter((e) => run.first[e.origin] && run.first[e.origin] !== 'wrong').length;
  return { lessonId, correct, total: scored.length, grades: { ...run.grades }, ms: Math.max(0, Math.round(ms)) };
}

/** Есть ли в строке удмуртские буквы (для lang="udm", когда язык заранее неизвестен). */
export const hasUdmLetters = (s: string) => /[ӝӟӥӧӵ]/i.test(s);

/** Время мм:сс. */
export function formatTime(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Русское склонение по числу: plural(5, ['день', 'дня', 'дней']). */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b === 1) return one;
  if (b >= 2 && b <= 4) return few;
  return many;
}

function addOnce(list: readonly number[], v: number): readonly number[] {
  return list.includes(v) ? list : [...list, v];
}
