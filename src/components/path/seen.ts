/**
 * Что ученик уже видел на пути: докуда была «прошита» нить в каждом юните.
 * Нужно только для красоты — чтобы новый отрезок нити прорисовывался один раз,
 * когда ученик возвращается на путь после урока. Хранится в браузере (удобство, не прогресс).
 */
import { readJSON, writeJSON } from '$lib/storage';

const KEY = 'udm.path.seen.v1';

export function readSeen(): Record<string, number> | null {
  const v = readJSON<Record<string, number> | null>(KEY, null);
  return v && typeof v === 'object' ? v : null;
}

export function writeSeen(map: Record<string, number>): void {
  writeJSON(KEY, map);
}
