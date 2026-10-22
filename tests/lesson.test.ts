import { describe, expect, it } from 'vitest';
import type { Exercise } from '../src/lib/content/schema.ts';
import type { AnswerResult } from '../src/exercises/types.ts';
import {
  advance,
  capGrade,
  createRun,
  currentEntry,
  formatTime,
  isFinished,
  mergeGrades,
  outcomeOf,
  plural,
  progressOf,
  recordAnswer,
  summarize,
  type Run,
} from '../src/lib/lesson.ts';

const teach = (item: string): Exercise => ({ type: 'teach', item });
const choice = (item: string): Exercise => ({ type: 'choice', item, dir: 'udm-ru', distractors: ['x'], pictures: false });

const ok = (grades: AnswerResult['grades'] = {}): AnswerResult => ({ correct: true, expected: '', grades });
const almost = (grades: AnswerResult['grades'] = {}): AnswerResult => ({ correct: true, almost: true, expected: '', grades });
const bad = (grades: AnswerResult['grades'] = {}): AnswerResult => ({ correct: false, expected: '', grades });

/** Ответить и перейти дальше. */
const step = (run: Run, r: AnswerResult) => advance(recordAnswer(run, r));

describe('очередь урока', () => {
  const lesson = [teach('a'), choice('a'), choice('b'), choice('c')];

  it('без ошибок — проходим по порядку, всё засчитано', () => {
    let run = createRun(lesson);
    expect(progressOf(run)).toEqual({ done: 0, total: 4 });
    run = step(run, ok());
    run = step(run, ok({ a: 3 }));
    run = step(run, ok({ b: 3 }));
    expect(isFinished(run)).toBe(false);
    run = step(run, ok({ c: 4 }));
    expect(isFinished(run)).toBe(true);
    expect(progressOf(run)).toEqual({ done: 4, total: 4 });
    const s = summarize(run, 'u1-l1', 61_000);
    expect(s).toEqual({ lessonId: 'u1-l1', correct: 3, total: 3, grades: { a: 3, b: 3, c: 4 }, ms: 61_000 });
  });

  it('ошибка не двигает прогресс и возвращает задание в конец один раз', () => {
    let run = createRun(lesson);
    run = step(run, ok());
    run = recordAnswer(run, bad({ a: 3 }));
    expect(progressOf(run).done).toBe(1);
    expect(run.queue).toHaveLength(5);
    expect(run.queue[4]).toMatchObject({ origin: 1, attempt: 1 });
    run = advance(run);
    run = step(run, ok({ b: 3 }));
    run = step(run, ok({ c: 3 }));
    expect(isFinished(run)).toBe(false);
    expect(currentEntry(run)?.origin).toBe(1);
    // повтор тоже неверный — больше не возвращается, задание закрывается
    run = recordAnswer(run, bad({ a: 1 }));
    expect(run.queue).toHaveLength(5);
    expect(progressOf(run).done).toBe(4);
    run = advance(run);
    expect(isFinished(run)).toBe(true);
    const s = summarize(run, 'x', 0);
    expect(s.correct).toBe(2);
    expect(s.total).toBe(3);
  });

  it('успешный повтор закрывает задание, но «верно с первой попытки» не засчитывается', () => {
    let run = createRun([choice('a')]);
    run = step(run, bad({ a: 3 }));
    expect(progressOf(run).done).toBe(0);
    expect(isFinished(run)).toBe(false);
    run = step(run, ok({ a: 3 }));
    expect(isFinished(run)).toBe(true);
    expect(progressOf(run)).toEqual({ done: 1, total: 1 });
    const s = summarize(run, 'x', 0);
    expect(s.correct).toBe(0);
    expect(s.grades).toEqual({ a: 1 }); // оценка — по первой попытке
  });

  it('teach не считается в итогах и не сбрасывает серию', () => {
    let run = createRun([choice('a'), choice('b'), teach('c'), choice('c')]);
    run = step(run, ok());
    run = step(run, ok());
    run = step(run, ok());
    expect(run.streak).toBe(2);
    run = step(run, ok());
    expect(run.streak).toBe(3);
    expect(summarize(run, 'x', 0).total).toBe(3);
  });

  it('teach не возвращается в очередь', () => {
    let run = createRun([teach('a')]);
    run = step(run, bad());
    expect(isFinished(run)).toBe(true);
  });

  it('серия сбрасывается на ошибке, лучшая запоминается', () => {
    let run = createRun([choice('a'), choice('b'), choice('c'), choice('d')]);
    run = step(run, ok());
    run = step(run, almost());
    run = step(run, bad());
    expect(run.streak).toBe(0);
    expect(run.bestStreak).toBe(2);
    expect(run.last).toBe('wrong');
  });

  it('повторный вызов на той же позиции игнорируется', () => {
    let run = createRun([choice('a'), choice('b')]);
    run = recordAnswer(run, bad());
    const again = recordAnswer(run, bad());
    expect(again).toBe(run);
    expect(run.queue).toHaveLength(3);
    // без ответа дальше не идём
    const fresh = createRun([choice('a')]);
    expect(advance(fresh)).toBe(fresh);
  });
});

describe('оценки', () => {
  it('исход ответа ограничивает оценку', () => {
    expect(capGrade(3, 'wrong')).toBe(1);
    expect(capGrade(3, 'almost')).toBe(2);
    expect(capGrade(1, 'almost')).toBe(1);
    expect(capGrade(3, 'correct')).toBe(3);
    expect(capGrade(4, 'correct')).toBe(4);
  });

  it('слово встретилось несколько раз — берём минимальную', () => {
    let g = mergeGrades({}, { a: 4, b: 3 }, 'correct');
    g = mergeGrades(g, { a: 3 }, 'almost');
    g = mergeGrades(g, { b: 4 }, 'correct');
    expect(g).toEqual({ a: 2, b: 3 });
  });

  it('оценки сохраняются по первым попыткам разных заданий', () => {
    let run = createRun([choice('a'), choice('a'), choice('b')]);
    run = step(run, ok({ a: 4 }));
    run = step(run, almost({ a: 3 }));
    run = step(run, bad({ b: 3 }));
    run = step(run, ok({ b: 3 }));
    expect(summarize(run, 'x', 0).grades).toEqual({ a: 2, b: 1 });
  });

  it('outcomeOf', () => {
    expect(outcomeOf({ correct: true })).toBe('correct');
    expect(outcomeOf({ correct: true, almost: true })).toBe('almost');
    expect(outcomeOf({ correct: false })).toBe('wrong');
  });
});

describe('форматирование', () => {
  it('время мм:сс', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65_400)).toBe('1:05');
    expect(formatTime(600_000)).toBe('10:00');
  });
  it('склонение', () => {
    const f = ['день', 'дня', 'дней'] as [string, string, string];
    expect([1, 2, 5, 11, 21, 22, 112].map((n) => plural(n, f))).toEqual(['день', 'дня', 'дней', 'дней', 'день', 'дня', 'дней']);
  });
});
