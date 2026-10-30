/**
 * Что ученик уже видел на пути: докуда была «прошита» нить в каждом юните.
 * Нужно только для красоты — чтобы новый отрезок нити прорисовывался один раз,
 * когда ученик возвращается на путь после урока. Хранится в браузере (удобство, не прогресс).
 */
import { readJSON, writeJSON } from '$lib/storage';
import { isObj, num, record } from '$lib/safe';

const KEY = 'udm.path.seen.v1';

export function readSeen(): Record<string, number> | null {
  const v = readJSON<unknown>(KEY, null);
  return isObj(v) ? record(v, (x) => num(x, 0, 1000, NaN)) : null;
}

export function writeSeen(map: Record<string, number>): void {
  writeJSON(KEY, map);
}
