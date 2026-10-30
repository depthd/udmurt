/**
 * Проверка данных, пришедших «снаружи»: localStorage, коды переноса прогресса, коды группы.
 * Всё это может быть испорчено (ручная правка, старая версия, обрыв записи) или подделано.
 * Правило: из такого источника берём только поля известного типа и в разумных пределах,
 * остальное заменяем значением по умолчанию — приложение не должно падать на чужих данных.
 */

export type Obj = Record<string, unknown>;

export const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);

/** Ключи, которые нельзя записывать в обычный объект: они меняют его прототип. */
const BAD_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
export const safeKey = (k: string) => !BAD_KEYS.has(k) && k.length <= 200;

/** Число в пределах [min, max]; иначе — запасное значение. */
export function num(x: unknown, min: number, max: number, def: number): number {
  return typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max ? x : def;
}

/** Целое в пределах [min, max]. */
export function int(x: unknown, min: number, max: number, def: number): number {
  const n = num(x, min, max, NaN);
  return Number.isNaN(n) ? def : Math.round(n);
}

/** Строка не длиннее max (лишнее обрезаем). */
export function str(x: unknown, max: number, def = ''): string {
  return typeof x === 'string' ? x.slice(0, max) : def;
}

export const bool = (x: unknown, def = false): boolean => (typeof x === 'boolean' ? x : def);

/** Значение из списка разрешённых. */
export function oneOf<T extends string>(x: unknown, allowed: readonly T[], def: T): T {
  return typeof x === 'string' && (allowed as readonly string[]).includes(x) ? (x as T) : def;
}

/** Словарь «ключ → значение»: каждое значение проверяет fn (undefined — выбросить), опасные ключи отбрасываются. */
export function record<T>(x: unknown, fn: (v: unknown, k: string) => T | undefined, maxKeys = 20_000): Record<string, T> {
  const out: Record<string, T> = {};
  if (!isObj(x)) return out;
  let n = 0;
  for (const k of Object.keys(x)) {
    if (!safeKey(k)) continue;
    const v = fn(x[k], k);
    if (v === undefined || (typeof v === 'number' && Number.isNaN(v))) continue;
    out[k] = v;
    if (++n >= maxKeys) break;
  }
  return out;
}

/** Массив, каждый элемент проверяет fn. */
export function list<T>(x: unknown, fn: (v: unknown) => T | undefined, max = 1000): T[] {
  if (!Array.isArray(x)) return [];
  const out: T[] = [];
  for (const v of x.slice(0, max)) {
    const r = fn(v);
    if (r !== undefined) out.push(r);
  }
  return out;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Дата вида 2026-10-30. */
export const dayStr = (x: unknown): string | undefined => (typeof x === 'string' && DAY.test(x) ? x : undefined);

/** Безопасно раскодировать часть адреса: «битый» %-код не должен ронять приложение. */
export function decodeSafe(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}
