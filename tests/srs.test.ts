import { describe, expect, it } from 'vitest';
import { review, newCard, retrievability, DAY } from '../src/lib/srs.ts';

describe('FSRS-lite', () => {
  it('R(S,S) = 0.9', () => {
    expect(retrievability(5, 5)).toBeCloseTo(0.9, 5);
  });
  it('серия «верно» растит интервалы', () => {
    let c = newCard(0);
    let t = 0;
    const gaps: number[] = [];
    for (let i = 0; i < 4; i++) {
      c = review(c, 3, t);
      gaps.push(Math.round((c.due - t) / DAY));
      t = c.due;
    }
    expect(gaps[0]).toBeGreaterThanOrEqual(1);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1]);
  });
  it('ошибка возвращает слово через 10 минут', () => {
    const c = review(newCard(0), 1, 0);
    expect(c.due).toBe(10 * 60e3);
    expect(c.lapses).toBe(1);
  });
});
