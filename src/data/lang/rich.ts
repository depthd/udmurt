/**
 * Мини-разметка в пояснениях: *слово* — удмуртский (рендерится с lang="udm"),
 * _word_ — слово другого языка (курсив без lang). Остальное — русский текст.
 */
export type RichPart = { kind: 'text' | 'udm' | 'foreign'; text: string };

export function parseRich(s: string): RichPart[] {
  const out: RichPart[] = [];
  const re = /\*([^*]+)\*|_([^_]+)_/g;
  let last = 0;
  for (const m of s.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ kind: 'text', text: s.slice(last, i) });
    out.push(m[1] !== undefined ? { kind: 'udm', text: m[1] } : { kind: 'foreign', text: m[2] });
    last = i + m[0].length;
  }
  if (last < s.length) out.push({ kind: 'text', text: s.slice(last) });
  return out;
}

/** Только удмуртские фрагменты строки (для тестов). */
export const udmParts = (s: string) => parseRich(s).filter((p) => p.kind === 'udm').map((p) => p.text);

/** Текст без разметки (для aria-label и title). */
export const plain = (s: string) => parseRich(s).map((p) => p.text).join('');
