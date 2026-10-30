/** Настройки интерфейса: звук, вибрация, анимации, тема. Хранятся в localStorage. */
import { readJSON, writeJSON } from './storage';
import { isObj, bool, oneOf } from './safe';

type Prefs = {
  sound: boolean;
  haptics: boolean;
  motion: 'auto' | 'reduce';
  theme: 'auto' | 'light' | 'dark';
  /** Показывать подсказку-разбор морфем после ответа. */
  morphemes: boolean;
};

const KEY = 'udm.prefs.v1';
const DEFAULTS: Prefs = { sound: true, haptics: true, motion: 'auto', theme: 'auto', morphemes: true };

/** Настройки из localStorage — только известные поля нужного типа. */
function readPrefs(): Prefs {
  const r = readJSON<unknown>(KEY, {});
  const o = isObj(r) ? r : {};
  return {
    sound: bool(o.sound, DEFAULTS.sound),
    haptics: bool(o.haptics, DEFAULTS.haptics),
    motion: oneOf(o.motion, ['auto', 'reduce'] as const, DEFAULTS.motion),
    theme: oneOf(o.theme, ['auto', 'light', 'dark'] as const, DEFAULTS.theme),
    morphemes: bool(o.morphemes, DEFAULTS.morphemes),
  };
}

class PrefsStore {
  value = $state<Prefs>(readPrefs());
  systemReduce = $state(false);

  constructor() {
    if (typeof window === 'undefined') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    this.systemReduce = mq.matches;
    mq.addEventListener('change', (e) => (this.systemReduce = e.matches));
    this.apply();
  }

  get reduceMotion() {
    return this.systemReduce || this.value.motion === 'reduce';
  }

  set<K extends keyof Prefs>(k: K, v: Prefs[K]) {
    this.value[k] = v;
    writeJSON(KEY, this.value);
    this.apply();
  }

  apply() {
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    if (this.value.theme === 'auto') html.removeAttribute('data-theme');
    else html.dataset.theme = this.value.theme;
    if (this.value.motion === 'reduce') html.dataset.motion = 'reduce';
    else html.removeAttribute('data-motion');
  }
}

export const prefs = new PrefsStore();
