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

export type LessonState = { done: number; best: number; last: number };

export type ProgressData = {
  v: 1;
  name: string;
  createdAt: number;
  xp: number;
  /** XP по дням: 'YYYY-MM-DD' → xp. */
  days: Record<string, number>;
  streak: { current: number; best: number; last: string | null; freezes: number; frozen: string[] };
  lessons: Record<string, LessonState>;
  cards: Record<string, Card>;
  /** Сколько раз ошибались в слове (для «Работы над ошибками»). */
  mistakes: Record<string, number>;
  dailyGoal: number;
  achievements: string[];
  /** Обещание после первого урока: 7/14/30 дней. */
  commitment: number | null;
  onboarded: boolean;
};

const KEY = 'udm.progress.v1';
const MAX_FREEZES = 2;

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

function migrate(raw: unknown): ProgressData {
  const base = fresh();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<ProgressData>;
  return { ...base, ...r, streak: { ...base.streak, ...(r.streak ?? {}) }, v: 1 };
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

  lesson(id: string): LessonState | undefined {
    return this.data.lessons[id];
  }

  isDone(id: string) {
    return (this.data.lessons[id]?.done ?? 0) > 0;
  }

  /** Записать результат урока и вернуть награды для экрана итогов. */
  completeLesson(r: LessonResult): Reward {
    const d = this.data;
    const today = this.today;
    const accuracy = r.total ? r.correct / r.total : 1;
    const prev = d.lessons[r.lessonId];
    const firstTime = !prev;

    // XP: 10 за урок + бонус за точность; повторное прохождение — половина
    let xp = 10 + Math.round(accuracy * 5);
    if (accuracy === 1) xp += 5;
    if (!firstTime) xp = Math.max(5, Math.round(xp / 2));

    d.xp += xp;
    const goalBefore = (d.days[today] ?? 0) >= d.dailyGoal;
    d.days[today] = (d.days[today] ?? 0) + xp;
    const goalReached = !goalBefore && d.days[today] >= d.dailyGoal;

    d.lessons[r.lessonId] = {
      done: (prev?.done ?? 0) + 1,
      best: Math.max(prev?.best ?? 0, accuracy),
      last: Date.now(),
    };

    // Карточки повторения
    const now = Date.now();
    for (const [id, g] of Object.entries(r.grades)) {
      d.cards[id] = review(d.cards[id] ?? newCard(now), g, now);
      if (g === 1) d.mistakes[id] = (d.mistakes[id] ?? 0) + 1;
      else if (d.mistakes[id]) d.mistakes[id] = Math.max(0, d.mistakes[id] - 1);
    }

    // Стрик
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
        } else s.current = 1;
        extended = true;
      }
    }
    if (extended) {
      s.last = today;
      // каждые 7 дней — заморозка в запас
      if (s.current > 0 && s.current % 7 === 0) s.freezes = Math.min(MAX_FREEZES, s.freezes + 1);
    }
    s.best = Math.max(s.best, s.current);

    const newAchievements = this.#checkAchievements(accuracy);
    this.save();
    return {
      xp,
      streakBefore,
      streakAfter: s.current,
      streakExtended: extended,
      usedFreeze,
      goalReached,
      newAchievements,
      firstTime,
    };
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

  /** Записать отдельное повторение (практика вне урока). */
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
      const data = migrate(JSON.parse(new TextDecoder().decode(bytes)));
      if (typeof data.xp !== 'number') return false;
      this.data = data;
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
};
