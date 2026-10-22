/**
 * Схема учебного контента.
 *
 * Контент пишется в YAML в папке /content и проверяется этой схемой при сборке
 * (vite/content-plugin.ts) и в тестах (tests/content.test.ts). Если студент
 * ошибётся в файле, сборка упадёт с понятным сообщением: какой файл, какое поле.
 *
 * Главное правило: каждое удмуртское слово/фраза приходит из словника (lexicon)
 * с источником и статусом проверки. В уроки попадают только записи со статусом
 * `verified` или `sourced`; `draft` в уроках запрещён (это проверяет тест).
 */
import { z } from 'zod';

/** Статус проверки удмуртского материала. */
export const Status = z.enum([
  'verified', // проверено носителем / преподавателем
  'sourced', // взято из надёжного источника (учебник, Tatoeba, словарь), ждёт проверки носителем
  'draft', // черновик — в уроки не попадает
]);
export type Status = z.infer<typeof Status>;

export const SourceRef = z.object({
  /** Короткий id источника из content/sources.yaml, например `tatoeba`, `ruwikt`, `uniparser`. */
  id: z.string(),
  /** Уточнение: URL, номер предложения Tatoeba, страница учебника. */
  ref: z.string().optional(),
});
export type SourceRef = z.infer<typeof SourceRef>;

export const Morpheme = z.object({
  form: z.string(),
  /** Что значит морфема: «имя», «мой (притяж. 1 л.)», «из (элатив)». */
  meaning: z.string(),
  kind: z.enum(['root', 'suffix', 'particle', 'word']).default('root'),
});
export type Morpheme = z.infer<typeof Morpheme>;

/** Элемент словника: слово, фраза или грамматический шаблон. */
export const LexItem = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id: только латиница в нижнем регистре, цифры и дефис'),
  udm: z.string().min(1),
  ru: z.string().min(1),
  /** Дополнительные допустимые русские переводы (для проверки ввода). */
  ru_alt: z.array(z.string()).default([]),
  /** Дополнительные допустимые удмуртские варианты. */
  udm_alt: z.array(z.string()).default([]),
  kind: z.enum(['word', 'phrase', 'pattern']).default('word'),
  /** Часть речи / тип — для словаря и подсказок. */
  pos: z.string().optional(),
  morphemes: z.array(Morpheme).default([]),
  /** Подсказка по употреблению, показывается в карточке. */
  note: z.string().optional(),
  /** Эмодзи-картинка для карточки (просто и без лицензий). */
  emoji: z.string().optional(),
  /** Путь к аудио относительно public/audio, без расширения. */
  audio: z.string().optional(),
  /** Аудио — синтез речи (помечается в интерфейсе). */
  audio_synth: z.boolean().default(false),
  status: Status,
  sources: z.array(SourceRef).min(1, 'у каждого слова должен быть хотя бы один источник'),
  tags: z.array(z.string()).default([]),
});
export type LexItem = z.infer<typeof LexItem>;

export const LexiconFile = z.object({
  items: z.array(LexItem),
});

/* ───────────────────────── Упражнения ───────────────────────── */

const Base = {
  /** Необязательный id — для статистики ошибок. */
  id: z.string().optional(),
  /** Пояснение, которое показывается после ответа (почему так). */
  explain: z.string().optional(),
};

/** Знакомство с новым словом: карточка с переводом, разбором и аудио. */
export const TeachEx = z.object({
  ...Base,
  type: z.literal('teach'),
  item: z.string(),
});

/** Выбор правильного перевода из вариантов. */
export const ChoiceEx = z.object({
  ...Base,
  type: z.literal('choice'),
  /** Направление: udm→ru (дан удмуртский, выбираем русский) или ru→udm. */
  dir: z.enum(['udm-ru', 'ru-udm']).default('udm-ru'),
  /** Слово/фраза из словника — подставляется как вопрос, правильный ответ берётся из него же. */
  item: z.string(),
  /** id других слов словника в качестве неправильных вариантов. */
  distractors: z.array(z.string()).min(1),
  /** Показывать эмодзи слов как картинки (упражнение «выбери картинку»). */
  pictures: z.boolean().default(false),
});

/** Собрать фразу из плиток-слов (визитная карточка Duolingo). */
export const TilesEx = z.object({
  ...Base,
  type: z.literal('tiles'),
  dir: z.enum(['udm-ru', 'ru-udm']).default('ru-udm'),
  item: z.string(),
  /** Лишние плитки-обманки (слова на языке ответа). */
  extra: z.array(z.string()).default([]),
});

/** Сопоставить пары удмуртский ↔ русский. */
export const MatchEx = z.object({
  ...Base,
  type: z.literal('match'),
  items: z.array(z.string()).min(3).max(6),
});

/** Напечатать перевод (с удмуртской клавиатурой и мягкой проверкой). */
export const TypeEx = z.object({
  ...Base,
  type: z.literal('type'),
  dir: z.enum(['udm-ru', 'ru-udm']).default('ru-udm'),
  item: z.string(),
});

/** Вставить пропуск: выбрать нужное окончание/слово. */
export const FillEx = z.object({
  ...Base,
  type: z.literal('fill'),
  /** Предложение с пропуском `___`, например «Мон Глаз___». */
  text: z.string().refine((s) => s.includes('___'), 'в тексте нужен пропуск ___'),
  /** Перевод всего предложения. */
  ru: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.string(),
  /** Слово словника, к которому относится упражнение (для источника и SRS). */
  item: z.string().optional(),
});

/** Собрать слово из морфем: ним + -ы → нимы. */
export const BuildEx = z.object({
  ...Base,
  type: z.literal('build'),
  item: z.string(),
  /** Лишние морфемы-обманки. */
  extra: z.array(z.string()).default([]),
});

/** Послушать и выбрать / напечатать (только если у слова есть аудио). */
export const ListenEx = z.object({
  ...Base,
  type: z.literal('listen'),
  item: z.string(),
  mode: z.enum(['choice', 'type']).default('choice'),
  distractors: z.array(z.string()).default([]),
});

/** Мини-диалог с вопросом на понимание. */
export const DialogueEx = z.object({
  ...Base,
  type: z.literal('dialogue'),
  lines: z
    .array(
      z.object({
        who: z.string(),
        /** id фразы из словника ИЛИ свободный текст (тогда нужен ru и источник у диалога). */
        item: z.string().optional(),
        udm: z.string().optional(),
        ru: z.string().optional(),
      }),
    )
    .min(2),
  question: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.string(),
});

export const Exercise = z.discriminatedUnion('type', [
  TeachEx,
  ChoiceEx,
  TilesEx,
  MatchEx,
  TypeEx,
  FillEx,
  BuildEx,
  ListenEx,
  DialogueEx,
]);
export type Exercise = z.infer<typeof Exercise>;
export type ExerciseType = Exercise['type'];

export const Lesson = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  /** Что ученик сможет после урока — одной фразой. */
  goal: z.string(),
  /** Тип узла на пути: обычный урок, история, повторение, контрольная. */
  kind: z.enum(['lesson', 'story', 'review', 'checkpoint']).default('lesson'),
  icon: z.string().optional(),
  exercises: z.array(Exercise).min(1),
});
export type Lesson = z.infer<typeof Lesson>;

export const Unit = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  title_udm: z.string().optional(),
  description: z.string(),
  /** Шпаргалка юнита (Markdown): грамматика и полезные фразы. */
  guide: z.string().optional(),
  lessons: z.array(Lesson).min(1),
});
export type Unit = z.infer<typeof Unit>;

export const Source = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url().optional(),
  license: z.string(),
  author: z.string().optional(),
  note: z.string().optional(),
});
export type Source = z.infer<typeof Source>;

export const SourcesFile = z.object({ sources: z.array(Source) });

export const Course = z.object({
  id: z.string(),
  title: z.string(),
  units: z.array(Unit),
  lexicon: z.array(LexItem),
  sources: z.array(Source),
});
export type Course = z.infer<typeof Course>;
