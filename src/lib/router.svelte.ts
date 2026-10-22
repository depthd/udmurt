/**
 * Хэш-роутер: GitHub Pages не умеет переписывать адреса, поэтому #/learn, #/lesson/u1-l1 и т.д.
 * Переходы анимируются через View Transitions API (если браузер умеет и движение не отключено).
 */
import { prefs } from './prefs.svelte';

export type Route = { name: string; params: Record<string, string>; path: string };

const routes: Array<[RegExp, string, string[]]> = [
  [/^\/?$/, 'home', []],
  [/^\/learn\/?$/, 'learn', []],
  [/^\/lesson\/([\w-]+)\/?$/, 'lesson', ['id']],
  [/^\/practice\/?$/, 'practice', []],
  [/^\/about\/?$/, 'about', []],
  [/^\/about\/([\w-]+)\/?$/, 'about', ['section']],
  [/^\/dict\/?$/, 'dict', []],
  [/^\/dict\/([^/]+)\/?$/, 'dict', ['q']],
  [/^\/library\/?$/, 'library', []],
  [/^\/me\/?$/, 'me', []],
  [/^\/credits\/?$/, 'credits', []],
  [/^\/group\/?$/, 'group', []],
  [/^\/group\/([^/]+)\/?$/, 'group', ['code']],
  [/^\/projector\/?$/, 'projector', []],
  [/^\/game\/?$/, 'game', []],
  [/^\/read\/?$/, 'read', []],
  [/^\/read\/([\w-]+)\/?$/, 'read', ['id']],
  [/^\/phrases\/?$/, 'phrases', []],
  [/^\/help\/?$/, 'help', []],
];

function parse(hash: string): Route {
  const path = decodeURIComponent(hash.replace(/^#/, '') || '/');
  const clean = path.split('?')[0];
  for (const [re, name, keys] of routes) {
    const m = clean.match(re);
    if (m) return { name, path, params: Object.fromEntries(keys.map((k, i) => [k, m[i + 1]])) };
  }
  return { name: 'notfound', path, params: {} };
}

class Router {
  current = $state<Route>(parse(typeof location !== 'undefined' ? location.hash : ''));
  #pendingType: string = 'forward';

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('hashchange', () => this.#apply());
  }

  #apply() {
    const next = parse(location.hash);
    const update = () => {
      this.current = next;
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    const doc = document as Document & { startViewTransition?: (arg: unknown) => unknown };
    if (!doc.startViewTransition || prefs.reduceMotion) return update();
    try {
      doc.startViewTransition({ update, types: [this.#pendingType] });
    } catch {
      doc.startViewTransition(update);
    }
    this.#pendingType = 'forward';
  }

  /** Перейти по адресу вида '/learn'. type — тип анимации перехода. */
  go(path: string, type: 'forward' | 'back' | 'lesson' = 'forward') {
    this.#pendingType = type;
    const h = '#' + path;
    if (location.hash === h) return;
    location.hash = path;
  }
}

export const router = new Router();

/** Ссылка для href: учитывает хэш-роутинг. */
export const href = (path: string) => '#' + path;
