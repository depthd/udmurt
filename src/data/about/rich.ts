/** Разбор строк вида 'удм. {udm:ву} «вода»' на куски с атрибутом lang. */
export type RichSeg = { t: string; lang?: RichLang };
export type RichLang = 'udm' | 'fi' | 'hu' | 'et' | 'kv' | 'mhr';

const RE = /\{(udm|fi|hu|et|kv|mhr):([^}]+)\}/g;

export function parseRich(text: string): RichSeg[] {
  const out: RichSeg[] = [];
  let last = 0;
  for (const m of text.matchAll(RE)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ t: text.slice(last, at) });
    out.push({ t: m[2], lang: m[1] as RichLang });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ t: text.slice(last) });
  return out;
}

/** Все удмуртские куски строки (для тестов). */
export const udmPieces = (text: string) =>
  parseRich(text)
    .filter((s) => s.lang === 'udm')
    .map((s) => s.t);
