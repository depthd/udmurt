/**
 * Звуки без файлов: WebAudio-синтез (~1 КБ). Контекст создаётся лениво — по первому жесту.
 * Рецепт: docs/research/04-design-motion-system.md §3.8
 */
import { prefs } from './prefs.svelte';

let ctx: AudioContext | undefined;
let out: GainNode | undefined;

function ac(): AudioContext | undefined {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      out = ctx.createGain();
      out.gain.value = 0.25;
      const comp = ctx.createDynamicsCompressor();
      out.connect(comp).connect(ctx.destination);
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return undefined;
  }
}

type Tone = { f: number; type?: OscillatorType; at?: number; dur?: number; gain?: number; attack?: number; to?: number };

function tone({ f, type = 'sine', at = 0, dur = 0.15, gain = 0.5, attack = 0.005, to }: Tone) {
  const c = ac();
  if (!c || !out) return;
  const t0 = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + dur + 0.02);
}

const on = () => prefs.value.sound;

export const sfx = {
  tap() {
    if (on()) tone({ f: 660, type: 'triangle', dur: 0.05, gain: 0.2 });
  },
  correct() {
    if (!on()) return;
    tone({ f: 1046.5, dur: 0.12 });
    tone({ f: 1568, at: 0.07, dur: 0.25 });
    tone({ f: 3136, at: 0.07, dur: 0.18, gain: 0.08 });
  },
  wrong() {
    if (!on()) return;
    tone({ f: 220, to: 110, type: 'triangle', dur: 0.22, gain: 0.45 });
    tone({ f: 207.65, to: 98, at: 0.09, dur: 0.25, gain: 0.3 });
  },
  combo(n: number) {
    if (!on()) return;
    const f = 880 * 2 ** ((Math.min(n, 8) * 2) / 12);
    tone({ f, dur: 0.12, gain: 0.4 });
    tone({ f: f * 1.5, at: 0.06, dur: 0.18, gain: 0.3 });
  },
  complete() {
    if (!on()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone({ f, type: 'triangle', at: i * 0.09, dur: 0.3, gain: 0.4 }));
  },
  unlock() {
    if (!on()) return;
    [659.25, 987.77].forEach((f, i) => tone({ f, at: i * 0.08, dur: 0.2, gain: 0.3 }));
  },
};

const canVibrate = () => typeof navigator !== 'undefined' && 'vibrate' in navigator && prefs.value.haptics;

export const haptic = {
  tap() {
    if (canVibrate()) navigator.vibrate(10);
  },
  correct() {
    if (canVibrate()) navigator.vibrate(15);
  },
  wrong() {
    if (canVibrate()) navigator.vibrate([30, 60, 30]);
  },
  combo() {
    if (canVibrate()) navigator.vibrate([10, 30, 10, 30, 20]);
  },
};

/** Произнести слово: проигрывает аудиофайл из public/audio, если он есть. */
let current: HTMLAudioElement | undefined;
export function playAudio(path: string | undefined, rate = 1): boolean {
  if (!path) return false;
  try {
    current?.pause();
    current = new Audio(`${import.meta.env.BASE_URL}audio/${path}.mp3`);
    current.playbackRate = rate;
    void current.play().catch(() => {});
    return true;
  } catch {
    return false;
  }
}
