/** Доступ к курсу (собирается из /content при сборке) и вспомогательные функции. */
import course from 'virtual:course';
import type { LexItem, Lesson, Unit, Source } from './content/schema';
import { progress } from './progress.svelte';

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

/** Урок открыт, если пройден предыдущий (первый открыт всегда). */
export function isUnlocked(ref: LessonRef): boolean {
  if (ref.flatIndex === 0) return true;
  return progress.isDone(allLessons[ref.flatIndex - 1].lesson.id);
}

/** Текущий урок — первый непройденный. */
export function currentLesson(): LessonRef | undefined {
  return allLessons.find((l) => !progress.isDone(l.lesson.id)) ?? allLessons.at(-1);
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
