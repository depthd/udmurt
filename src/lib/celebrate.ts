/**
 * Праздничное конфетти: «звёздочки» толэзе (восьмиконечная звезда с флага, отчёт 04 §3.5, §5.2)
 * вперемешку с квадратиками. Цвета — из токенов темы (в тёмной теме «серебро на чёрном»).
 * При «меньше анимации» (системной или своей) — ничего не делает.
 */
import confetti from 'canvas-confetti';
import { prefs } from './prefs.svelte';

const TOLEZE = 'M50 0 L150 100 L0 100 L100 0 L100 150 L0 50 L150 50 L50 150 Z';
let star: confetti.Shape | undefined;

function shapes(): confetti.Shape[] {
  try {
    star ??= confetti.shapeFromPath({ path: TOLEZE });
    return [star, star, 'square'];
  } catch {
    return ['square', 'circle'];
  }
}

function colors(): string[] {
  const fallback = ['#dd2211', '#1f1a17', '#2a744a', '#9a5b00'];
  try {
    const cs = getComputedStyle(document.documentElement);
    const list = ['--flag-red', '--red', '--ink', '--green', '--amber']
      .map((t) => cs.getPropertyValue(t).trim())
      .filter(Boolean);
    return list.length ? list : fallback;
  } catch {
    return fallback;
  }
}

/** Залп конфетти в конце урока. intensity: 1 — обычный, 2 — «без ошибок». */
export function celebrate(intensity: 1 | 2 = 1): void {
  if (typeof window === 'undefined' || prefs.reduceMotion) return;
  try {
    const base: confetti.Options = {
      shapes: shapes(),
      colors: colors(),
      scalar: 1.15,
      ticks: 260,
      zIndex: 50,
      disableForReducedMotion: true,
    };
    // центральный залп снизу
    void confetti({ ...base, particleCount: 70 * intensity, spread: 75, startVelocity: 48, origin: { x: 0.5, y: 0.72 } });
    // и два боковых чуть позже — «фейерверк» с краёв
    window.setTimeout(() => {
      void confetti({ ...base, particleCount: 35 * intensity, angle: 60, spread: 55, startVelocity: 55, origin: { x: 0, y: 0.8 } });
      void confetti({ ...base, particleCount: 35 * intensity, angle: 120, spread: 55, startVelocity: 55, origin: { x: 1, y: 0.8 } });
    }, 180);
  } catch {
    /* конфетти — украшение: без него всё работает */
  }
}

/** Убрать конфетти (при уходе со страницы итогов). */
export function stopCelebrate(): void {
  try {
    confetti.reset();
  } catch {
    /* ignore */
  }
}
