/**
 * Появление блоков при прокрутке (IntersectionObserver).
 *  use:reveal          — блок «всплывает» (классы .rv → .rv-in, стили в About.svelte);
 *  use:inview={fn}     — просто вызвать fn один раз, когда блок показался.
 * При отключённых анимациях всё показывается сразу.
 */
import type { Action } from 'svelte/action';
import { prefs } from '$lib/prefs.svelte';

type Cb = () => void;
const callbacks = new WeakMap<Element, Cb>();
let io: IntersectionObserver | null = null;

function observer() {
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const cb = callbacks.get(e.target);
        io?.unobserve(e.target);
        callbacks.delete(e.target);
        cb?.();
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  return io;
}

function watch(node: Element, cb: Cb) {
  if (typeof IntersectionObserver === 'undefined') {
    cb();
    return () => {};
  }
  callbacks.set(node, cb);
  observer().observe(node);
  return () => {
    io?.unobserve(node);
    callbacks.delete(node);
  };
}

export const reveal: Action<HTMLElement, { delay?: number } | undefined> = (node, opts) => {
  if (prefs.reduceMotion) {
    node.classList.add('rv-in');
    return;
  }
  node.classList.add('rv');
  if (opts?.delay) node.style.setProperty('--rv-delay', `${opts.delay}ms`);
  const stop = watch(node, () => node.classList.add('rv-in'));
  return { destroy: stop };
};

export const inview: Action<Element, Cb> = (node, cb) => {
  if (prefs.reduceMotion) {
    cb();
    return;
  }
  const stop = watch(node, () => cb());
  return { destroy: stop };
};
