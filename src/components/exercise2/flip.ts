/**
 * FLIP-анимация перестановок (First → Last → Invert → Play).
 *
 * Элементы помечаются data-flip="<ключ>". Один и тот же ключ может «переехать» в другой
 * DOM-элемент (плитка из банка → плитка в строке ответа): анимация начинается с того места,
 * где элемент с этим ключом был виден до изменения.
 *
 *   flip(root, () => { chosen = [...chosen, i]; });
 *
 * Изменение состояния применяется синхронно (flushSync), поэтому после mutate DOM уже новый.
 * При reduced motion — просто mutate без анимации.
 */
import { flushSync } from 'svelte';
import { prefs } from '$lib/prefs.svelte';

const FALLBACK_EASE = 'cubic-bezier(0.2, 0.9, 0.3, 1.08)';
let ease: string | null = null;

function springEase(): string {
  if (ease) return ease;
  const v = getComputedStyle(document.documentElement).getPropertyValue('--spring-soft').trim();
  ease = v || FALLBACK_EASE;
  return ease;
}

export type FlipOptions = { duration?: number; lift?: boolean };

export function flip(root: HTMLElement | null | undefined, mutate: () => void, opts: FlipOptions = {}): void {
  if (!root || prefs.reduceMotion || typeof root.animate !== 'function') {
    flushSync(mutate);
    return;
  }
  const before = new Map<string, DOMRect>();
  for (const el of root.querySelectorAll<HTMLElement>('[data-flip]')) before.set(el.dataset.flip!, el.getBoundingClientRect());

  flushSync(mutate);

  const duration = opts.duration ?? 420;
  for (const el of root.querySelectorAll<HTMLElement>('[data-flip]')) {
    const b = before.get(el.dataset.flip!);
    if (!b) continue;
    for (const a of el.getAnimations()) if ((a as Animation & { id: string }).id === 'flip') a.cancel();
    const r = el.getBoundingClientRect();
    const dx = b.left - r.left;
    const dy = b.top - r.top;
    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;
    const far = Math.hypot(dx, dy) > 40;
    const frames: Keyframe[] =
      far && opts.lift !== false
        ? [
            { transform: `translate(${dx}px, ${dy}px)`, offset: 0 },
            { transform: `translate(${dx * 0.45}px, ${dy * 0.45}px) scale(1.06)`, offset: 0.4 },
            { transform: 'none', offset: 1 },
          ]
        : [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }];
    let anim: Animation;
    try {
      anim = el.animate(frames, { duration: far ? duration : duration * 0.8, easing: springEase(), id: 'flip' });
    } catch {
      ease = FALLBACK_EASE;
      anim = el.animate(frames, { duration, easing: FALLBACK_EASE, id: 'flip' });
    }
    if (far) {
      el.classList.add('is-flying');
      const done = () => el.classList.remove('is-flying');
      anim.addEventListener('finish', done);
      anim.addEventListener('cancel', done);
    }
  }
}
