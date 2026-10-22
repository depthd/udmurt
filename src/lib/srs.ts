/**
 * Интервальное повторение: FSRS-6 «лайт» (формулы ts-fsrs 5.4.2, параметры по умолчанию).
 * Источник и проверка: docs/research/03-learning-science.md §2.4.
 *
 * Оценка g: 1 — ошибка, 2 — «почти»/с подсказкой, 3 — верно, 4 — легко (быстрый верный ввод).
 */
export const DAY = 864e5;

export type Card = { S?: number; D?: number; last?: number; due: number; reps: number; lapses: number };
export type Grade = 1 | 2 | 3 | 4;

const W = [
  0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666, 0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014,
  1.8729, 0.5425, 0.0912, 0.0658, 0.1542,
];
const DECAY = -W[20];
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1;
const clamp = (x: number, a: number, b: number) => Math.min(Math.max(x, a), b);

/** Вероятность вспомнить через t дней при стабильности S. */
export const retrievability = (t: number, S: number) => Math.pow(1 + (FACTOR * t) / S, DECAY);
const ivl = (S: number, r: number) => clamp(Math.round((S / FACTOR) * (Math.pow(r, 1 / DECAY) - 1)), 1, 365);
const D0 = (g: number) => clamp(W[4] - Math.exp(W[5] * (g - 1)) + 1, 1, 10);
const S0 = (g: number) => Math.max(W[g - 1], 0.1);
const nextD = (D: number, g: number) => clamp(W[7] * D0(4) + (1 - W[7]) * (D + (-W[6] * (g - 3) * (10 - D)) / 9), 1, 10);
const sRecall = (D: number, S: number, r: number, g: number) =>
  S * (1 + Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * (g === 2 ? W[15] : 1) * (g === 4 ? W[16] : 1));
const sForget = (D: number, S: number, r: number) =>
  Math.min(W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)), S / Math.exp(W[17] * W[18]));
const sShort = (S: number, g: number) => {
  const k = Math.exp(W[17] * (g - 3 + W[18])) * Math.pow(S, -W[19]);
  return S * (g >= 2 ? Math.max(k, 1) : k);
};

export const newCard = (now = Date.now()): Card => ({ due: now, reps: 0, lapses: 0 });

export function review(card: Card, g: Grade, now = Date.now(), retention = 0.9): Card {
  let S = card.S;
  let D = card.D;
  if (S == null || D == null || card.last == null) {
    S = S0(g);
    D = D0(g);
  } else {
    const t = Math.max(0, (now - card.last) / DAY);
    S = t < 1 ? sShort(S, g) : g === 1 ? sForget(D, S, retrievability(t, S)) : sRecall(D, S, retrievability(t, S), g);
    D = nextD(D, g);
  }
  S = clamp(S, 0.001, 36500);
  const days = g === 1 ? 0 : ivl(S, retention);
  return {
    S,
    D,
    last: now,
    due: g === 1 ? now + 10 * 60e3 : now + days * DAY,
    reps: card.reps + 1,
    lapses: card.lapses + (g === 1 ? 1 : 0),
  };
}

/** Насколько слово «живо» в памяти сейчас: 0..1 (для полосок силы слова). */
export function strength(card: Card | undefined, now = Date.now()): number {
  if (!card || card.S == null || card.last == null) return 0;
  return retrievability(Math.max(0, (now - card.last) / DAY), card.S);
}
