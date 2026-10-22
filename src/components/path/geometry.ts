/**
 * Геометрия пути уроков (отчёт 04 §3.6): узлы смещаются по синусоиде, через них идёт
 * гладкая кривая Catmull-Rom, переведённая в кубические Безье.
 * Координаты — в пикселях относительно центральной оси пути (x = 0 — середина колонки).
 */

export type Pt = { x: number; y: number };

export const NODE = 72;

export type Layout = {
  /** Центры узлов. */
  nodes: Pt[];
  /** Точки кривой: старт у баннера, узлы, финиш у полосы орнамента. */
  thread: Pt[];
  height: number;
  amp: number;
};

export function pathLayout(n: number, { gapY = 104, amp = 64, period = 8, top = 92, bottom = 72 } = {}): Layout {
  const nodes = Array.from({ length: n }, (_, i) => ({
    x: Math.round(amp * Math.sin((i / period) * 2 * Math.PI) * 10) / 10,
    y: top + i * gapY,
  }));
  const height = top + Math.max(0, n - 1) * gapY + bottom;
  const thread = [{ x: 0, y: 0 }, ...nodes, { x: 0, y: height }];
  return { nodes, thread, height, amp };
}

const f = (v: number) => v.toFixed(1);

/**
 * Кривая через точки p[from..to] (включительно). Касательные берутся из соседей ПОЛНОГО
 * массива — поэтому отрезок «нити» точно ложится поверх «стежка» всей кривой.
 */
export function smoothPath(p: Pt[], from = 0, to = p.length - 1, k = 1): string {
  if (to <= from || p.length < 2) return '';
  let d = `M ${f(p[from].x)} ${f(p[from].y)}`;
  for (let i = from; i < to; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * k, y: p1.y + ((p2.y - p0.y) / 6) * k };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * k, y: p2.y - ((p3.y - p1.y) / 6) * k };
    d += ` C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

/** Русские формы множественного числа: plural(5, ['день', 'дня', 'дней']). */
export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

/** Иконка узла: из урока или по типу. */
export function lessonIcon(icon: string | undefined, kind: string): string {
  if (icon) return icon;
  return { story: '📖', review: '🔁', checkpoint: '🏆' }[kind] ?? '✏️';
}

/**
 * Названия уроков пишутся по-удмуртски; у историй/повторений бывает русская приставка
 * «История: …». Делим, чтобы разметить lang="udm" только удмуртскую часть.
 */
export function splitTitle(title: string): { prefix: string; udm: string } {
  const m = title.match(/^((?:История|Повторение|Контрольная|Проверка)\s*:\s*)(.+)$/u);
  return m ? { prefix: m[1], udm: m[2] } : { prefix: '', udm: title };
}
