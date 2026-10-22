import { beforeEach, describe, expect, it, vi } from 'vitest';

// localStorage-заглушка для node
const mem = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
});

const { progress } = await import('../src/lib/progress.svelte.ts');
const res = (id: string) => ({ lessonId: id, correct: 5, total: 5, grades: {}, ms: 1000 });

describe('серия дней и её починка', () => {
  beforeEach(() => {
    progress.reset();
    vi.useFakeTimers();
  });
  it('стрик растёт день за днём, пропуск закрывает заморозка', () => {
    vi.setSystemTime(new Date(2026, 9, 1, 12));
    progress.completeLesson(res('a'));
    vi.setSystemTime(new Date(2026, 9, 2, 12));
    progress.completeLesson(res('b'));
    expect(progress.data.streak.current).toBe(2);
    vi.setSystemTime(new Date(2026, 9, 4, 12)); // пропущен 1 день, заморозка 1
    const r = progress.completeLesson(res('c'));
    expect(r.usedFreeze).toBe(1);
    expect(progress.data.streak.current).toBe(3);
  });
  it('прерванную серию можно вернуть тремя уроками за два дня', () => {
    for (let d = 1; d <= 5; d++) {
      vi.setSystemTime(new Date(2026, 9, d, 12));
      progress.completeLesson(res('l' + d));
    }
    expect(progress.data.streak.current).toBe(5);
    progress.data.streak.freezes = 0;
    vi.setSystemTime(new Date(2026, 9, 9, 12)); // перерыв 3 дня
    progress.completeLesson(res('x1'));
    expect(progress.data.streak.current).toBe(1);
    expect(progress.repair).toEqual({ value: 5, left: 2 });
    progress.completeLesson(res('x2'));
    vi.setSystemTime(new Date(2026, 9, 10, 12));
    const r = progress.completeLesson(res('x3'));
    expect(r.repaired).toBe(5);
    expect(progress.data.streak.current).toBe(7);
    expect(progress.repair).toBeNull();
  });
});
