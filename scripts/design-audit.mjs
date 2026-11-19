import { expect } from '@playwright/test';
import { readdir, readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { baseURL, launch, saveShot, sizes, themes, walk } from './shots.mjs';

const tokens = [
  '--ink', '--muted', '--bg', '--surface', '--surface-2', '--on-fill',
  '--red', '--blue', '--green', '--field-border',
];
const surfaces = ['--bg', '--surface', '--surface-2'];
const pairs = [
  ...['--ink', '--muted'].flatMap((fg) => surfaces.map((bg) => [fg, bg, 4.5])),
  ...['--red', '--blue', '--green'].map((bg) => ['--on-fill', bg, 4.5]),
  ...['--red', '--blue'].map((fg) => [fg, '--bg', 4.5]),
  ...surfaces.map((bg) => ['--field-border', bg, 3]),
];

function luminance(hex) {
  const normalized = hex.length === 4 ? '#' + [...hex.slice(1)].map((digit) => digit.repeat(2)).join('') : hex;
  const [r, g, b] = normalized.match(/[0-9a-f]{2}/gi).map((pair) => {
    const c = Number.parseInt(pair, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(fg, bg) {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const dist = process.env.DESIGN_DIST ?? 'dist';
const shots = process.env.DESIGN_SHOTS;
if (shots && !['before', 'after'].includes(shots)) throw new Error('DESIGN_SHOTS=before|after');
const assetsDir = 'src/assets/characters';
const distAssets = dist + '/assets';
const baselineGzip = Number(process.env.DESIGN_BASELINE_GZIP ?? 275263);
const result = {
  screens: 0,
  controls: 0,
  castImages: 0,
  overflows: [],
  smallControls: [],
  brokenImages: [],
  errors: [],
  foreignRequests: [],
  contrast: {},
  firstAction: {},
  offline: null,
  weight: {
    charactersBytes: (await Promise.all((await readdir(assetsDir)).map(async (file) =>
      (await stat(assetsDir + '/' + file)).size))).reduce((sum, size) => sum + size, 0),
    gzipBytes: (await Promise.all((await readdir(distAssets)).filter((file) => /\.(js|css)$/.test(file)).map(async (file) =>
      gzipSync(await readFile(distAssets + '/' + file)).length))).reduce((sum, size) => sum + size, 0),
  },
};

result.weight.baselineGzipBytes = baselineGzip;
result.weight.gzipGrowth = Number(((result.weight.gzipBytes / baselineGzip - 1) * 100).toFixed(2));

const browser = await launch();
try {
  for (const viewport of sizes) {
    await Promise.all(themes.map(async (theme) => {
      const key = viewport.width + '-' + theme;
      await walk(browser, viewport, theme, async (page, screen) => {
        const checkControls = ['home', 'returning', 'teach', 'choice', 'listen', 'feedback', 'end', 'onboarding'].includes(screen);
        const label = screen + '-' + key;
        const metrics = await page.evaluate(async ({ checkControls, tokens }) => {
          const root = document.documentElement;
          const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility === 'visible';
          const images = [...document.querySelectorAll('img.cast')].filter(visible);
          const invalid = (await Promise.all(images.map(async (img) => {
            const decoded = await img.decode().then(() => true, () => false);
            return decoded && Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0 ? null : img.src;
          }))).filter(Boolean);
          const controls = checkControls
            ? [...document.querySelectorAll('button, a[href], [role=button]')].filter((el) => visible(el) && !el.matches('.skip'))
            : [];
          const style = getComputedStyle(root);
          const first = document.querySelector('[data-testid=start-first]');
          const nav = document.querySelector('nav[aria-label="Основная навигация"]');
          return {
            width: root.clientWidth, scrollWidth: root.scrollWidth,
            controls: controls.length,
            small: controls.flatMap((el) => {
              const { width, height } = el.getBoundingClientRect();
              if (width >= 44 && height >= 44) return [];
              return [{ label: el.getAttribute('aria-label') || el.textContent.trim().replace(/\s+/g, ' '), width, height }];
            }),
            images: images.length, invalid,
            colors: Object.fromEntries(tokens.map((token) => [token, style.getPropertyValue(token).trim()])),
            first: first && nav && {
              bottom: Math.round(first.getBoundingClientRect().bottom),
              navTop: Math.round(nav.getBoundingClientRect().top),
            },
          };
        }, { checkControls, tokens });
        result.screens++;
        result.controls += metrics.controls;
        result.castImages += metrics.images;
        if (metrics.scrollWidth > metrics.width) result.overflows.push({ screen: label, width: metrics.width, scrollWidth: metrics.scrollWidth });
        result.smallControls.push(...metrics.small.map((control) => ({ screen: label, ...control })));
        result.brokenImages.push(...metrics.invalid.map((image) => ({ screen: label, image })));
        if (screen === 'home' && viewport.width === 390) {
          result.firstAction[theme] = metrics.first;
          result.contrast[theme] = pairs.map(([fg, bg, min]) => {
            const ratio = contrast(metrics.colors[fg], metrics.colors[bg]);
            return { fg, bg, ratio: Number(ratio.toFixed(2)), min, pass: ratio >= min };
          });
        }
        if (shots) await saveShot(page, shots, screen, viewport.width, theme);
      }, (page) => {
        page.on('pageerror', (error) => result.errors.push({ viewport: key, url: page.url(), error: String(error) }));
        page.on('console', (msg) => {
          if (msg.type() === 'error') result.errors.push({ viewport: key, url: page.url(), error: msg.text() });
        });
        page.on('request', (request) => {
          const url = new URL(request.url());
          if (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(baseURL).origin) {
            result.foreignRequests.push({ viewport: key, url: url.href });
          }
        });
      });
    }));
  }
  if (process.env.DESIGN_OFFLINE_URL) {
    const context = await browser.newContext({ viewport: sizes[1] });
    const page = await context.newPage();
    try {
      await page.goto(new URL('#/', process.env.DESIGN_OFFLINE_URL).href);
      await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15000 }).toBe(true);
      const hero = page.locator('img.cast[fetchpriority=high]');
      const src = await hero.evaluate((img) => img.src);
      const precached = await page.evaluate(async (src) => {
        const name = (await caches.keys()).find((key) => key.startsWith('udm-static-'));
        return !!name && !!(await (await caches.open(name)).match(src));
      }, src);
      await context.setOffline(true);
      await page.reload();
      const decoded = await hero.evaluate(async (img) => {
        await img.decode();
        return img.naturalWidth > 0;
      });
      result.offline = { precached, decoded };
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
if (
  result.overflows.length || result.smallControls.length || result.brokenImages.length ||
  result.errors.length || result.foreignRequests.length ||
  Object.values(result.contrast).flat().some((pair) => !pair.pass) ||
  Object.values(result.firstAction).some((action) => !action || action.bottom > action.navTop) ||
  (result.offline && (!result.offline.precached || !result.offline.decoded)) ||
  result.weight.charactersBytes > 700_000 || result.weight.gzipBytes > baselineGzip * 1.15
) process.exitCode = 1;
