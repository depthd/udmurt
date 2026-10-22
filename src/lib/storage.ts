/**
 * Безопасная обёртка над localStorage: в приватном режиме, при очищенных данных
 * или в превью доступ может бросать исключение — тогда работаем в памяти.
 */
const mem = new Map<string, string>();

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return mem.has(key) ? (JSON.parse(mem.get(key)!) as T) : fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  mem.set(key, raw);
  try {
    localStorage.setItem(key, raw);
  } catch {
    /* хранилище недоступно — остаёмся в памяти */
  }
}

/** Просим браузер не удалять наши данные (Safari чистит хранилище через 7 дней без визитов). */
export async function requestPersist(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}
