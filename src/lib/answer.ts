/**
 * Проверка ответов: нормализация и «почти правильно».
 *
 * Правила:
 *  - регистр, лишние пробелы, пунктуация в конце, ё/е — не важны;
 *  - латинские двойники (ö, ä, ï…) приводим к удмуртским буквам;
 *  - если ответ отличается только удмуртскими буквами (о/ӧ, и/ӥ, ж/ӝ, з/ӟ, ч/ӵ) —
 *    засчитываем, но показываем «Почти! Обратите внимание на букву…»;
 *  - одна опечатка (расстояние Левенштейна 1) в слове длиной ≥ 5 — тоже «почти».
 */

const LATIN_TO_UDM: Record<string, string> = {
  ö: 'ӧ', Ö: 'Ӧ', ï: 'ӥ', Ï: 'Ӥ', ä: 'а', ë: 'ё',
  // строчная латиница, неотличимая от кириллицы (бывает при смешанной раскладке)
  a: 'а', e: 'е', o: 'о', p: 'р', c: 'с', y: 'у', x: 'х',
};

const UDM_BASE: Record<string, string> = { ӧ: 'о', ӥ: 'и', ӝ: 'ж', ӟ: 'з', ӵ: 'ч' };

/** Базовая нормализация: NFC, регистр, пробелы, пунктуация, ё→е. */
export function normalize(s: string, { fixLatin = true } = {}): string {
  let t = s.normalize('NFC').toLowerCase();
  // комбинирующая диерезис после о/и/ж/з/ч → удмуртская буква
  t = t.replace(/ӧ/g, 'ӧ').replace(/ӥ/g, 'ӥ').replace(/ӝ/g, 'ӝ').replace(/ӟ/g, 'ӟ').replace(/ӵ/g, 'ӵ');
  if (fixLatin && /[а-яӧӥӝӟӵ]/.test(t)) t = [...t].map((ch) => LATIN_TO_UDM[ch] ?? ch).join('');
  t = t.replace(/ё/g, 'е');
  t = t.replace(/[«»"“”„]/g, '').replace(/[‐‑‒–—]/g, '-');
  t = t.replace(/[.,!?;:…]+/g, ' ');
  t = t.replace(/\s*-\s*/g, '-');
  return t.replace(/\s+/g, ' ').trim();
}

/** Убрать удмуртские диакритики: ӧ→о, ӥ→и… */
export function stripUdm(s: string): string {
  return [...s].map((ch) => UDM_BASE[ch] ?? ch).join('');
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const m = a.length,
    n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

export type Verdict =
  | { ok: true; exact: true; matched: string }
  | { ok: true; exact: false; matched: string; hint: 'diacritics' | 'typo'; letters?: string[] }
  | { ok: false; closest: string };

/** Сравнить ответ ученика со списком правильных вариантов. */
export function checkAnswer(input: string, accepted: string[]): Verdict {
  const a = normalize(input);
  const norms = accepted.map((x) => [x, normalize(x)] as const);
  for (const [orig, n] of norms) if (a === n) return { ok: true, exact: true, matched: orig };

  for (const [orig, n] of norms) {
    if (stripUdm(a) === stripUdm(n)) {
      const letters = [...new Set([...n].filter((ch, i) => ch !== a[i] && UDM_BASE[ch]))];
      return { ok: true, exact: false, matched: orig, hint: 'diacritics', letters };
    }
  }
  // Опечатка: ровно одно слово отличается на одну букву, слово длинное (≥ 6),
  // и окончание (последние 2 буквы) совпадает — окончания в удмуртском значимы
  // (нимы «моё имя» ≠ нимыд «твоё имя»), поэтому их ошибки не прощаем.
  const aw = stripUdm(a).split(' ');
  for (const [orig, n] of norms) {
    const nw = stripUdm(n).split(' ');
    if (nw.length !== aw.length) continue;
    const diff = nw.map((w, i) => [w, aw[i]] as const).filter(([w, x]) => w !== x);
    if (diff.length !== 1) continue;
    const [w, x] = diff[0];
    if (w.length >= 6 && levenshtein(w, x) === 1 && w.slice(-2) === x.slice(-2)) return { ok: true, exact: false, matched: orig, hint: 'typo' };
  }
  return { ok: false, closest: accepted[0] ?? '' };
}

/** Разбить фразу на плитки-слова (пунктуация уходит). */
export function tokenize(s: string): string[] {
  return s
    .replace(/[.,!?;:…«»"]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
