/**
 * «Похожие части» слов для таблицы родственных слов.
 * Это наглядная подсказка, а не этимология: слова переводятся в грубую «звуковую строку»
 * (гласные — одна метка V, двойные согласные схлопываются), и подсвечивается общее начало,
 * если в нём совпадает хотя бы два звука. Подпись в интерфейсе честно предупреждает об этом.
 */

type Token = { t: string; from: number; to: number };

const CYR: Record<string, string> = {
  б: 'b', в: 'v', г: 'g', д: 'd', ж: 'zh', ӝ: 'dzh', з: 'z', ӟ: 'dz', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', п: 'p',
  р: 'r', с: 's', т: 't', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ӵ: 'ch', ш: 'sh', щ: 'sh',
};
const CYR_V = new Set('аеёиӥоӧуӱыэюяі'.split(''));
const CYR_IOTATED = new Set('еёюя'.split(''));
const SILENT = new Set(['ь', 'ъ']);

const LAT_V = new Set('aeiouyäöüõáéíóöőúüű'.split(''));
/** Венгерские диграфы → звук. */
const HUN_DI: Record<string, string> = { sz: 's', zs: 'zh', cs: 'ch', gy: 'd', ny: 'n', ty: 't', ly: 'j', dz: 'dz' };
const LAT: Record<string, string> = { s: 's', c: 'ts', j: 'j', h: 'h', w: 'v' };

function push(out: Token[], t: string, from: number, to: number) {
  const last = out[out.length - 1];
  // гласные подряд и одинаковые согласные подряд — одна метка
  if (last && last.t === t) {
    last.to = to;
    return;
  }
  out.push({ t, from, to });
}

/** Звуковая строка кириллического слова (удмуртский, коми, марийский). */
export function cyrTokens(word: string): Token[] {
  const w = word.toLowerCase();
  const out: Token[] = [];
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    if (CYR_V.has(ch)) {
      const prev = w[i - 1];
      // е, ё, ю, я в начале слова и после гласной/ь/ъ звучат с [й]
      if (CYR_IOTATED.has(ch) && (i === 0 || CYR_V.has(prev) || SILENT.has(prev))) push(out, 'j', i, i + 1);
      push(out, 'V', i, i + 1);
    } else if (SILENT.has(ch)) {
      const last = out[out.length - 1];
      if (last) last.to = i + 1;
    } else if (CYR[ch]) push(out, CYR[ch], i, i + 1);
  }
  return out;
}

/** Звуковая строка латинского слова (финский, эстонский, венгерский). */
export function latTokens(word: string, hungarian = false): Token[] {
  const w = word.toLowerCase();
  const out: Token[] = [];
  for (let i = 0; i < w.length; i++) {
    const ch = w[i];
    const di = w.slice(i, i + 2);
    if (hungarian && HUN_DI[di]) {
      push(out, HUN_DI[di], i, i + 2);
      i++;
    } else if (LAT_V.has(ch)) push(out, 'V', i, i + 1);
    else if (hungarian && ch === 's') push(out, 'sh', i, i + 1);
    else if (/[a-z]/.test(ch)) push(out, LAT[ch] ?? ch, i, i + 1);
  }
  return out;
}

/** Сколько символов в начале каждого слова «звучат одинаково». 0 — подсветки нет. */
export function similarPrefix(udm: string, other: string, script: 'cyr' | 'lat', hungarian = false): [number, number] {
  const a = cyrTokens(udm);
  const b = script === 'cyr' ? cyrTokens(other) : latTokens(other, hungarian);
  let k = 0;
  while (k < a.length && k < b.length && a[k].t === b[k].t) k++;
  if (k < 2) return [0, 0];
  return [a[k - 1].to, b[k - 1].to];
}

/** Первое слово из записи вида «kettő / két» или «hal (meghal)». */
export const headWord = (s: string) => s.split(/\s*[/(]\s*|\s+/)[0];

/** Разбить слово на [подсвеченная часть, остаток]. */
export function splitSimilar(udm: string, other: string, script: 'cyr' | 'lat', hungarian = false) {
  const head = headWord(other);
  const [ua, ob] = similarPrefix(udm, head, script, hungarian);
  return {
    udm: [udm.slice(0, ua), udm.slice(ua)] as const,
    other: [other.slice(0, ob), other.slice(ob)] as const,
  };
}
