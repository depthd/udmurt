/**
 * Геометрия СХЕМЫ Удмуртии: грубая проекция долготы/широты в координаты SVG.
 * Контур — условный (несколько опорных точек, сглаженных кривой), это не карта.
 */
export type Pt = { x: number; y: number };

export const MAP_W = 250;
export const MAP_H = 330;

/** Простейшая проекция: 1° широты = 100, 1° долготы ≈ 54 (cos 57.5°). */
export const proj = (lon: number, lat: number): Pt => ({ x: 20 + (lon - 51) * 54, y: 15 + (59 - lat) * 100 });

/** Замкнутая гладкая кривая через точки (Catmull-Rom → кубические Безье). */
export function smoothClosed(p: Pt[]): string {
  const n = p.length;
  const f = (v: number) => v.toFixed(1);
  let d = `M ${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 0; i < n; i++) {
    const p0 = p[(i - 1 + n) % n],
      p1 = p[i],
      p2 = p[(i + 1) % n],
      p3 = p[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d + ' Z';
}

/** Открытая гладкая кривая (для рек). */
export function smoothOpen(p: Pt[]): string {
  const f = (v: number) => v.toFixed(1);
  let d = `M ${f(p[0].x)} ${f(p[0].y)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i],
      p1 = p[i],
      p2 = p[i + 1],
      p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${f(c1.x)} ${f(c1.y)}, ${f(c2.x)} ${f(c2.y)}, ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

const ll = (pts: Array<[number, number]>) => pts.map(([lon, lat]) => proj(lon, lat));

/** Условный контур республики. */
export const OUTLINE = smoothClosed(
  ll([
    [51.85, 58.8],
    [52.5, 58.98],
    [53.25, 58.92],
    [53.85, 58.5],
    [54.2, 57.95],
    [54.45, 57.3],
    [54.5, 56.6],
    [54.3, 56.18],
    [53.6, 56.05],
    [52.8, 56.02],
    [52.05, 56.12],
    [51.5, 56.4],
    [51.25, 56.95],
    [51.3, 57.55],
    [51.5, 58.2],
  ]),
);

/** Реки (схематично): Чепца — Чупчи, Кама — Кам. */
export const RIVERS = {
  cheptsa: smoothOpen(
    ll([
      [53.65, 57.62],
      [53.3, 57.85],
      [53.0, 57.98],
      [52.66, 58.14],
      [52.1, 58.25],
      [51.55, 58.5],
    ]),
  ),
  kama: smoothOpen(
    ll([
      [54.55, 57.75],
      [54.25, 57.1],
      [54.0, 56.75],
      [53.82, 56.45],
      [54.1, 56.2],
      [53.4, 55.98],
      [52.3, 55.92],
    ]),
  ),
};

/** Широты условных границ зон наречий. */
export const ZONE_Y = { northTo: proj(0, 57.72).y, middleTo: proj(0, 57.3).y };
