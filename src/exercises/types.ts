/**
 * Контракт между «оболочкой урока» (routes/Lesson.svelte) и компонентами упражнений.
 *
 * Каждый компонент упражнения (src/exercises/<Type>.svelte) получает props `ExerciseProps`:
 *
 *   ex        — данные упражнения из схемы (src/lib/content/schema.ts)
 *   locked    — true после нажатия «Проверить»: показать верно/неверно, заблокировать ввод
 *   api       — методы обратной связи с оболочкой (см. ниже)
 *
 * Поток для обычных упражнений (choice, tiles, type, fill, build, listen, dialogue):
 *   1. компонент вызывает api.setReady(true/false), когда ответ можно/нельзя проверить
 *      (кнопка «Проверить» активна только при ready);
 *   2. компонент регистрирует api.setChecker(() => AnswerResult);
 *   3. оболочка по «Проверить» (или Enter) вызывает checker, показывает плашку обратной связи,
 *      ставит locked=true; затем «Продолжить» → следующее упражнение.
 *
 * Самозавершающиеся упражнения (teach, match) вместо этого вызывают api.complete(result):
 *   teach — когда ученик нажал «Понятно»/«Дальше» на карточке (оболочка показывает обычную кнопку
 *           «Продолжить» через api.setReady(true) и setChecker, возвращающий correct: true),
 *   match — когда все пары сопоставлены (оболочка сразу показывает «Отлично!»).
 *
 * Клавиатура: оболочка ловит Enter. Компоненты с вариантами поддерживают цифры 1–9.
 * Звуки/вибрацию на «Проверить» запускает оболочка; компоненты могут вызывать sfx.tap() на выбор.
 */
import type { Exercise } from '$lib/content/schema';
import type { Grade } from '$lib/srs';

export type AnswerResult = {
  correct: boolean;
  /** Засчитано, но с замечанием (пропущена удмуртская буква / опечатка). */
  almost?: boolean;
  /** Пояснение для плашки: «Обратите внимание: ӧ, а не о». */
  note?: string;
  /** Правильный ответ (показывается при ошибке и в «почти»). */
  expected: string;
  /** Перевод/смысл правильного ответа — для плашки «Верно!». */
  meaning?: string;
  /** Оценки для интервального повторения: id слова → 1..4. */
  grades: Record<string, Grade>;
};

export type ExerciseApi = {
  setReady(ready: boolean): void;
  setChecker(fn: () => AnswerResult): void;
  complete(result: AnswerResult): void;
};

export type ExerciseProps<E extends Exercise = Exercise> = {
  ex: E;
  locked: boolean;
  api: ExerciseApi;
};

/** Перемешать массив детерминированно по строке-зерну (чтобы порядок не прыгал при перерисовке). */
export function seededShuffle<T>(arr: readonly T[], seed: string): T[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const rnd = () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
