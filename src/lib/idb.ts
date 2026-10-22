/**
 * Простейшее хранилище «ключ → значение» в IndexedDB — для аудиозаписей (Blob),
 * которые не помещаются в localStorage. Любая ошибка (приватный режим, запрет) → undefined/false.
 */
const DB = 'udm-native';
const STORE = 'kv';

let dbP: Promise<IDBDatabase> | undefined;
function db(): Promise<IDBDatabase> {
  dbP ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbP;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  return db()
    .then(
      (d) =>
        new Promise<T | undefined>((resolve) => {
          const req = fn(d.transaction(STORE, mode).objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => resolve(undefined);
        }),
    )
    .catch(() => undefined);
}

export const idbGet = <T = unknown>(key: string) => tx<T>('readonly', (s) => s.get(key) as IDBRequest<T>);
export const idbSet = (key: string, value: unknown) => tx('readwrite', (s) => s.put(value, key)).then((r) => r !== undefined);
export const idbDel = (key: string) => tx('readwrite', (s) => s.delete(key));
export const idbKeys = () => tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys()).then((k) => (k ?? []).map(String));
