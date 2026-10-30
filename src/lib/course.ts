/** Доступ к курсу (собирается из /content при сборке) и вспомогательные функции. */
import course from 'virtual:course';
import type { LexItem, Lesson, Unit, Source } from './content/schema';
import { progress } from './progress.svelte';
import { exerciseRefs } from './content/refs';

export { course };

export const lexicon = new Map<string, LexItem>(course.lexicon.map((i) => [i.id, i]));
export const sources = new Map<string, Source>(course.sources.map((s) => [s.id, s]));

export type LessonRef = { unit: Unit; lesson: Lesson; unitIndex: number; lessonIndex: number; flatIndex: number };

export const allLessons: LessonRef[] = course.units.flatMap((unit, unitIndex) =>
  unit.lessons.map((lesson, lessonIndex) => ({ unit, lesson, unitIndex, lessonIndex, flatIndex: 0 })),
);
allLessons.forEach((l, i) => (l.flatIndex = i));

export function findLesson(id: string): LessonRef | undefined {
  return allLessons.find((l) => l.lesson.id === id);
}

export function item(id: string): LexItem {
  const it = lexicon.get(id);
  if (!it) throw new Error(`Нет слова «${id}» в словнике`);
  return it;
}

/** Урок открыт, если пройден предыдущий (первый открыт всегда) или ученик открыл его сам — урок задали в группе. */
export function isUnlocked(ref: LessonRef): boolean {
  if (ref.flatIndex === 0 || progress.isOpened(ref.lesson.id)) return true;
  return progress.isDone(allLessons[ref.flatIndex - 1].lesson.id);
}

/**
 * Текущий урок — следующий непройденный после последнего пройденного. Кто идёт по порядку, получает первый
 * непройденный; кто проходил урок, заданный в группе, вне очереди, — продолжает с этого места, а не с начала.
 */
export function currentLesson(): LessonRef | undefined {
  let lastIdx = -1;
  let lastAt = -1;
  for (const l of allLessons) {
    const st = progress.lesson(l.lesson.id);
    if (st && st.done > 0 && st.last > lastAt) [lastIdx, lastAt] = [l.flatIndex, st.last];
  }
  return (
    allLessons.find((l) => l.flatIndex > lastIdx && !progress.isDone(l.lesson.id)) ??
    allLessons.find((l) => !progress.isDone(l.lesson.id)) ??
    allLessons.at(-1)
  );
}

/** Подстановка имени ученика в фразы с {name}. По умолчанию — «Алексей». */
export function personalize(s: string): string {
  const name = progress.data.name || 'Алексей';
  return s.replaceAll('{name}', name);
}

/** Все допустимые ответы на удмуртском / русском для слова. */
export function accepted(it: LexItem, lang: 'udm' | 'ru'): string[] {
  const list = lang === 'udm' ? [it.udm, ...it.udm_alt] : [it.ru, ...it.ru_alt];
  return list.map(personalize);
}

export type UnitGroup = { unit: Unit; n: number; items: LexItem[] };

/** Слова и фразы по юнитам: каждое — в первом юните, где оно встречается в уроках (порядок — как в уроках). */
export const itemsByUnit: UnitGroup[] = (() => {
  const seen = new Set<string>();
  return course.units.map((unit, i) => {
    const items: LexItem[] = [];
    for (const l of unit.lessons)
      for (const ex of l.exercises)
        for (const r of exerciseRefs(ex))
          if (!seen.has(r) && lexicon.has(r)) {
            seen.add(r);
            items.push(lexicon.get(r)!);
          }
    return { unit, n: i + 1, items };
  });
})();
