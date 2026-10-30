/**
 * Прогресс ученика: XP, серия дней (стрик) с заморозками, уроки, карточки повторения.
 * Хранится в localStorage (ключ udm.progress.v1). Есть экспорт/импорт кодом — на случай,
 * если браузер очистит данные (Safari делает это через 7 дней без визитов).
 *
 * Принципы (docs/research/01, 03): стрик считается за ≥1 урок в день, а не за цель XP;
 * пропуск закрывается «заморозкой»; ошибки не наказываются (нет сердечек).
 */
import { readJSON, writeJSON } from './storage';
import { dayKey, addDays, diffDays } from './dates';
import { review, newCard, type Card, type Grade } from './srs';
import { isObj, num, int, str, bool, record, list, dayStr } from './safe';

export type LessonState = { done: number; best: number; last: number };

export type ProgressData = {
  v: 1;
  name: string;
  createdAt: number;
  xp: number;
  /** XP по дням: 'YYYY-MM-DD' → xp. */
  days: Record<string, number>;
  streak: {
    current: number;
    best: number;
    last: string | null;
    freezes: number;
    frozen: string[];
    /** Прерванная серия, которую можно вернуть: пройти REPAIR_LESSONS уроков за 2 дня. */
    lost?: { value: number; since: string; lessons: number } | null;
  };
  lessons: Record<string, LessonState>;
  cards: Record<string, Card>;
  /** Сколько раз ошибались в слове (для «Работы над ошибками»). */
  mistakes: Record<string, number>;
  dailyGoal: number;
  achievements: string[];
  /** Обещание после первого урока: 7/14/30 дней. */
  commitment: number | null;
  onboarded: boolean;
  /** Читалка: id текста → сколько раз прочитан. */
  read?: Record<string, number>;
  /** Уроки, открытые раньше очереди (урок задали в группе): id уроков. */
  opened?: string[];
};

const KEY = 'udm.progress.v1';
const MAX_FREEZES = 2;
/** Сколько уроков нужно пройти (включая первый после перерыва), чтобы вернуть серию. */
export const REPAIR_LESSONS = 3;

function fresh(): ProgressData {
  return {
    v: 1,
    name: '',
    createdAt: Date.now(),
    xp: 0,
    days: {},
    streak: { current: 0, best: 0, last: null, freezes: 1, frozen: [] },
    lessons: {},
    cards: {},
    mistakes: {},
    dailyGoal: 30,
    achievements: [],
    commitment: null,
    onboarded: false,
  };
}

const T_MAX = 8.64e15; // предел Date в мс

function card(v: unknown): Card | undefined {
  if (!isObj(v)) return undefined;
  const c: Card = { due: num(v.due, 0, T_MAX, 0), reps: int(v.reps, 0, 1e6, 0), lapses: int(v.lapses, 0, 1e6, 0) };
  // те же пределы, что держит srs.ts: S = 0 дало бы NaN в сроках повторения
  if (v.S !== undefined) c.S = num(v.S, 0.001, 36500, 1);
  if (v.D !== undefined) c.D = num(v.D, 1, 10, 5);
  if (v.last !== undefined) c.last = num(v.last, 0, T_MAX, 0);
  return c;
}

/**
 * Прогресс из localStorage или кода переноса: берём только поля нужного типа и в разумных пределах.
 * Испорченные данные не должны ронять приложение — иначе до кнопки «Сбросить» уже не добраться.
 */
export function migrate(raw: unknown): ProgressData {
  const base = fresh();
  if (!isObj(raw)) return base;
  const s = isObj(raw.streak) ? raw.streak : {};
  const lost = isObj(s.lost) && dayStr(s.lost.since)
    ? { value: int(s.lost.value, 0, 1e5, 0), since: dayStr(s.lost.since)!, lessons: int(s.lost.lessons, 0, 1e3, 0) }
    : null;
  return {
    v: 1,
    name: str(raw.name, 40),
    createdAt: num(raw.createdAt, 0, T_MAX, base.createdAt),
    xp: int(raw.xp, 0, 1e9, 0),
    days: record(raw.days, (v, k) => (dayStr(k) ? int(v, 0, 1e6, NaN) : undefined)),
    streak: {
      current: int(s.current, 0, 1e5, 0),
      best: int(s.best, 0, 1e5, 0),
      last: dayStr(s.last) ?? null,
      freezes: int(s.freezes, 0, MAX_FREEZES, base.streak.freezes),
      frozen: list(s.frozen, dayStr, 400),
      lost,
    },
    lessons: record(raw.lessons, (v) =>
      isObj(v) ? { done: int(v.done, 0, 1e6, 0), best: num(v.best, 0, 1, 0), last: num(v.last, 0, T_MAX, 0) } : undefined,
    ),
    cards: record(raw.cards, card),
    mistakes: record(raw.mistakes, (v) => int(v, 0, 1e6, NaN)),
    dailyGoal: int(raw.dailyGoal, 5, 1000, base.dailyGoal),
    achievements: list(raw.achievements, (v) => (typeof v === 'string' && v.length <= 40 ? v : undefined), 100),
    commitment: raw.commitment == null ? null : int(raw.commitment, 1, 365, 7),
    onboarded: bool(raw.onboarded),
    read: record(raw.read, (v) => int(v, 0, 1e6, NaN)),
    opened: list(raw.opened, (v) => (typeof v === 'string' && v.length <= 80 ? v : undefined), 500),
  };
}

export type LessonResult = {
  lessonId: string;
  correct: number;
  total: number;
  /** Оценки по словам словника: id → g. */
  grades: Record<string, Grade>;
  ms: number;
};

export type Reward = {
  xp: number;
  streakBefore: number;
  streakAfter: number;
  streakExtended: boolean;
  usedFreeze: number;
  goalReached: boolean;
  /** Сколько дней серии вернули починкой (0 — нет). */
  repaired: number;
  newAchievements: string[];
  firstTime: boolean;
};

class Progress {
  data = $state<ProgressData>(migrate(readJSON(KEY, null)));

  save() {
    writeJSON(KEY, $state.snapshot(this.data));
  }

  get today() {
    return dayKey();
  }

  get xpToday() {
    return this.data.days[this.today] ?? 0;
  }

  /** Стрик с учётом того, что сегодня ещё может быть не пройдено. */
  get streakState(): { value: number; doneToday: boolean; atRisk: boolean; broken: boolean; canFreeze: boolean } {
    const s = this.data.streak;
    if (!s.last) return { value: 0, doneToday: false, atRisk: false, broken: false, canFreeze: false };
    const gap = diffDays(s.last, this.today);
    if (gap <= 0) return { value: s.current, doneToday: true, atRisk: false, broken: false, canFreeze: false };
    if (gap === 1) return { value: s.current, doneToday: false, atRisk: true, broken: false, canFreeze: false };
    const missed = gap - 1;
    if (missed <= s.freezes) return { value: s.current, doneToday: false, atRisk: true, broken: false, canFreeze: true };
    return { value: 0, doneToday: false, atRisk: false, broken: s.current > 0, canFreeze: false };
  }

  /** Можно ли вернуть прерванную серию и сколько уроков осталось. */
  get repair(): { value: number; left: number } | null {
    const l = this.data.streak.lost;
    if (!l || diffDays(l.since, this.today) > 1) return null;
    return { value: l.value, left: Math.max(0, REPAIR_LESSONS - l.lessons) };
  }

  lesson(id: string): LessonState | undefined {
    return this.data.lessons[id];
  }

  isDone(id: string) {
    return (this.data.lessons[id]?.done ?? 0) > 0;
  }

  /** Урок открыт вне очереди (ученик сам открыл: его задали в группе). */
  isOpened(id: string) {
    return !!this.data.opened?.includes(id);
  }

  openLesson(id: string) {
    if (this.isOpened(id)) return;
    // новый массив целиком: push в результат «??=» попал бы мимо реактивной обёртки Svelte
    this.data.opened = [...(this.data.opened ?? []), id];
    this.save();
  }

  /** Начислить XP за сегодня и продлить серию дней. */
  #award(xp: number) {
    const d = this.data;
    const today = this.today;
    d.xp += xp;
    const goalBefore = (d.days[today] ?? 0) >= d.dailyGoal;
    d.days[today] = (d.days[today] ?? 0) + xp;
    const goalReached = !goalBefore && d.days[today] >= d.dailyGoal;

    const s = d.streak;
    const streakBefore = this.streakState.value;
    let usedFreeze = 0;
    let extended = false;
    if (!s.last) {
      s.current = 1;
      extended = true;
    } else {
      const gap = diffDays(s.last, today);
      if (gap === 1) {
        s.current += 1;
        extended = true;
      } else if (gap > 1) {
        const missed = gap - 1;
        if (missed <= s.freezes) {
          usedFreeze = missed;
          s.freezes -= missed;
          for (let i = 1; i <= missed; i++) s.frozen.push(addDays(s.last, i));
          s.current += 1;
        } else {
          // Серия прервалась — не наказываем: её можно вернуть, пройдя ещё уроки за 2 дня
          if (s.current >= 2) s.lost = { value: s.current, since: today, lessons: 0 };
          s.current = 1;
        }
        extended = true;
      }
    }
    let repaired = 0;
    if (s.lost) {
      if (diffDays(s.lost.since, today) > 1) s.lost = null;
      else {
        s.lost.lessons += 1;
        if (s.lost.lessons >= REPAIR_LESSONS) {
          repaired = s.lost.value;
          s.current = s.lost.value + s.current;
          s.lost = null;
        }
      }
    }
    if (extended) {
      s.last = today;
      // каждые 7 дней — заморозка в запас
      if (s.current > 0 && s.current % 7 === 0) s.freezes = Math.min(MAX_FREEZES, s.freezes + 1);
    }
    s.best = Math.max(s.best, s.current);
    return { streakBefore, streakAfter: s.current, streakExtended: extended, usedFreeze, goalReached, repaired };
  }

  #applyGrades(grades: Record<string, Grade>) {
    const d = this.data;
    const now = Date.now();
    for (const [id, g] of Object.entries(grades)) {
      d.cards[id] = review(d.cards[id] ?? newCard(now), g, now);
      if (g === 1) d.mistakes[id] = (d.mistakes[id] ?? 0) + 1;
      else if (d.mistakes[id]) d.mistakes[id] = Math.max(0, d.mistakes[id] - 1);
    }
  }

  /** Записать результат урока и вернуть награды для экрана итогов. */
  completeLesson(r: LessonResult): Reward {
    const d = this.data;
    const accuracy = r.total ? r.correct / r.total : 1;
    const prev = d.lessons[r.lessonId];
    const firstTime = !prev;

    // XP: 10 за урок + бонус за точность; повторное прохождение — половина
    let xp = 10 + Math.round(accuracy * 5);
    if (accuracy === 1) xp += 5;
    if (!firstTime) xp = Math.max(5, Math.round(xp / 2));

    d.lessons[r.lessonId] = {
      done: (prev?.done ?? 0) + 1,
      best: Math.max(prev?.best ?? 0, accuracy),
      last: Date.now(),
    };
    this.#applyGrades(r.grades);
    const a = this.#award(xp);
    const newAchievements = this.#checkAchievements(accuracy);
    this.save();
    return { xp, ...a, newAchievements, firstTime };
  }

  /** Результат повторения: оценки слов + немного XP (повторение тоже продлевает серию). */
  completePractice(r: LessonResult): Reward {
    const accuracy = r.total ? r.correct / r.total : 1;
    const xp = Math.min(15, 3 + r.correct);
    this.#applyGrades(r.grades);
    const a = this.#award(xp);
    const newAchievements = this.#checkAchievements(accuracy);
    this.save();
    return { xp, ...a, newAchievements, firstTime: false };
  }

  /** Текст в «Читалке» дочитан: XP (первый раз больше), серия дней, достижение «Читатель». */
  completeReading(id: string, correct: number, total: number): Reward {
    const d = this.data;
    d.read ??= {};
    const firstTime = !d.read[id];
    d.read[id] = (d.read[id] ?? 0) + 1;
    const xp = (firstTime ? 6 : 2) + correct * 2;
    const a = this.#award(xp);
    const newAchievements = this.#checkAchievements(total ? correct / total : 1);
    this.save();
    return { xp, ...a, newAchievements, firstTime };
  }

  timesRead(id: string): number {
    return this.data.read?.[id] ?? 0;
  }

  setOnboarded() {
    this.data.onboarded = true;
    this.save();
  }

  #checkAchievements(accuracy: number): string[] {
    const d = this.data;
    const have = new Set(d.achievements);
    const add: string[] = [];
    const want = (id: string, cond: boolean) => cond && !have.has(id) && add.push(id);
    const lessonsDone = Object.values(d.lessons).filter((l) => l.done > 0).length;
    want('first-lesson', lessonsDone >= 1);
    want('five-lessons', lessonsDone >= 5);
    want('perfect', accuracy === 1);
    want('streak-3', d.streak.current >= 3);
    want('streak-7', d.streak.current >= 7);
    want('xp-100', d.xp >= 100);
    want('xp-500', d.xp >= 500);
    want('words-25', Object.keys(d.cards).length >= 25);
    want('reader-3', Object.keys(d.read ?? {}).length >= 3);
    d.achievements.push(...add);
    return add;
  }

  /** Слова, которые пора повторить (просроченные), отсортированные по сроку. */
  dueCards(now = Date.now()): string[] {
    return Object.entries(this.data.cards)
      .filter(([, c]) => c.due <= now)
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id);
  }

  /** Записать отдельное повторение одного слова. */
  gradeItem(id: string, g: Grade) {
    const now = Date.now();
    this.data.cards[id] = review(this.data.cards[id] ?? newCard(now), g, now);
    if (g === 1) this.data.mistakes[id] = (this.data.mistakes[id] ?? 0) + 1;
    this.save();
  }

  setName(name: string) {
    this.data.name = name.trim().slice(0, 40);
    this.save();
  }

  setCommitment(days: number) {
    this.data.commitment = days;
    this.save();
  }

  setDailyGoal(xp: number) {
    this.data.dailyGoal = xp;
    this.save();
  }

  /** Код для переноса прогресса: base64url(JSON). */
  exportCode(): string {
    const json = JSON.stringify($state.snapshot(this.data));
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return 'UDM1.' + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  importCode(code: string): boolean {
    try {
      const body = code.trim().replace(/^UDM1\./, '').replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(body + '==='.slice((body.length + 3) % 4));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const raw: unknown = JSON.parse(new TextDecoder().decode(bytes));
      // чужой или испорченный код не должен затирать прогресс
      if (!isObj(raw) || raw.v !== 1 || typeof raw.xp !== 'number') return false;
      this.data = migrate(raw);
      this.save();
      return true;
    } catch {
      return false;
    }
  }

  reset() {
    this.data = fresh();
    this.save();
  }
}

export const progress = new Progress();

export const ACHIEVEMENTS: Record<string, { title: string; text: string; icon: string }> = {
  'first-lesson': { title: 'Первый шаг', text: 'Пройден первый урок', icon: '🌱' },
  'five-lessons': { title: 'Разогрелись', text: 'Пять уроков позади', icon: '🔥' },
  perfect: { title: 'Без единой ошибки', text: 'Урок на 100 %', icon: '🎯' },
  'streak-3': { title: 'Три дня подряд', text: 'Привычка начинается', icon: '📅' },
  'streak-7': { title: 'Неделя', text: '7 дней подряд', icon: '🏅' },
  'xp-100': { title: 'Сотня', text: '100 XP', icon: '💯' },
  'xp-500': { title: 'Полтысячи', text: '500 XP', icon: '⭐' },
  'words-25': { title: 'Словарный запас', text: '25 слов в повторении', icon: '📚' },
  'reader-3': { title: 'Читатель', text: 'Прочитаны три текста', icon: '📖' },
};
