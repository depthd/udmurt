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

describe('урок вне очереди (задали в группе)', () => {
  beforeEach(() => progress.reset());
  it('открытый вручную урок доступен, соседние — нет; после него открывается следующий', async () => {
    const { allLessons, isUnlocked } = await import('../src/lib/course.ts');
    const [first, second, mid, after] = [allLessons[0], allLessons[1], allLessons[5], allLessons[6]];
    expect(isUnlocked(first)).toBe(true);
    expect(isUnlocked(mid)).toBe(false);
    progress.openLesson(mid.lesson.id);
    progress.openLesson(mid.lesson.id); // повтор не дублирует
    expect(progress.data.opened).toEqual([mid.lesson.id]);
    expect(isUnlocked(mid)).toBe(true);
    expect(isUnlocked(after)).toBe(false);
    progress.completeLesson(res(mid.lesson.id));
    expect(isUnlocked(after)).toBe(true);
    expect(isUnlocked(second)).toBe(false);
  });
  it('«Продолжить» ведёт дальше с места, где занимались, а по порядку — к первому непройденному', async () => {
    const { allLessons, currentLesson } = await import('../src/lib/course.ts');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1, 12));
    expect(currentLesson()?.flatIndex).toBe(0);
    progress.completeLesson(res(allLessons[0].lesson.id));
    progress.completeLesson(res(allLessons[1].lesson.id));
    expect(currentLesson()?.flatIndex).toBe(2);
    // повторили старый урок — «Продолжить» всё равно ведёт к первому непройденному
    vi.setSystemTime(new Date(2026, 9, 2, 12));
    progress.completeLesson(res(allLessons[0].lesson.id));
    expect(currentLesson()?.flatIndex).toBe(2);
    // прошли урок вне очереди — продолжаем за ним
    vi.setSystemTime(new Date(2026, 9, 3, 12));
    progress.openLesson(allLessons[10].lesson.id);
    progress.completeLesson(res(allLessons[10].lesson.id));
    expect(currentLesson()?.flatIndex).toBe(11);
    vi.useRealTimers();
  });
  it('из сохранённых данных берутся только строки-id; карточки — в пределах FSRS', async () => {
    const { migrate } = await import('../src/lib/progress.svelte.ts');
    expect(migrate({ v: 1, opened: ['u2-l1', 5, null, 'x'.repeat(200), { a: 1 }] }).opened).toEqual(['u2-l1']);
    expect(migrate({ v: 1, opened: 'u2-l1' }).opened).toEqual([]);
    const c = migrate({ v: 1, cards: { w: { due: 1, reps: 1, lapses: 0, S: 0, D: 99 } } }).cards.w;
    expect([c.S, c.D]).toEqual([1, 5]);
  });
});
