import { chromium, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { solveCurrent } from '../tests/e2e/solve.ts';

export const sizes = [
  { width: 320, height: 640 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];
export const themes = ['light', 'dark'];
export const baseURL = process.env.DESIGN_URL ?? 'http://localhost:4173/udmurt/';
export const routes = {
  home: '/', learn: '/learn', practice: '/practice', read: '/read', about: '/about',
  dict: '/dict', phrases: '/phrases', me: '/me', library: '/library',
  projector: '/projector', '404': '/nonexistent', game: '/game', group: '/group',
  credits: '/credits', help: '/help',
};
const seed = { v: 1, name: 'Алексей', xp: 10, onboarded: true, lessons: { 'u1-l1': { done: 1, best: 1 } } };

export function launch() {
  const system = '/opt/pw-browsers/chromium';
  return chromium.launch({ executablePath: process.env.PW_CHROMIUM || (existsSync(system) ? system : undefined) });
}

export async function visit(page, path) {
  await page.goto('#' + path);
  await page.locator('main > :not([aria-busy="true"])').first().waitFor({ state: 'visible' });
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
}

export async function walk(browser, viewport, theme, capture, prepare = () => {}) {
  const context = await browser.newContext({ viewport, baseURL, reducedMotion: 'reduce' });
  await context.addInitScript((theme) => {
    localStorage.setItem('udm.prefs.v1', JSON.stringify({ theme, motion: 'reduce', sound: false, haptics: false }));
  }, theme);
  const page = await context.newPage();
  prepare(page);
  try {
    for (const [name, path] of Object.entries(routes)) {
      await visit(page, path);
      await capture(page, name);
    }
    await visit(page, '/lesson/u1-l1');
    const captured = new Set();
    for (let step = 0; step < 80; step++) {
      let name = '';
      if (await page.getByTestId('lesson-end').isVisible()) {
        await capture(page, 'end');
        await page.getByTestId('finish').click();
        const onboarding = page.getByTestId('onboarding');
        await onboarding.waitFor({ state: 'visible' });
        await capture(page, 'onboarding');
        break;
      }
      if (await page.getByTestId('teach-card').isVisible()) name = 'teach';
      else if (await page.getByTestId('listen-play').isVisible()) name = 'listen';
      else if (await page.locator('[data-testid^="option-"]').first().isVisible()) name = 'choice';
      if (name && !captured.has(name)) {
        await capture(page, name);
        captured.add(name);
        if (name === 'choice') {
          await page.locator('[data-testid^="option-"]:not([data-correct])').first().click();
          await page.getByTestId('check').click();
          await expect(page.getByTestId('feedback')).toBeVisible();
          await capture(page, 'feedback');
          await page.getByTestId('continue').click();
          continue;
        }
      }
      await solveCurrent(page);
      if (step === 79) throw new Error('Первый урок не завершился');
    }
    for (const name of ['teach', 'choice', 'listen']) {
      if (!captured.has(name)) throw new Error('В первом уроке не найден экран: ' + name);
    }
    await page.evaluate((progress) => {
      localStorage.setItem('udm.progress.v1', JSON.stringify(progress));
    }, seed);
    await page.goto('#/');
    await page.reload();
    await page.getByTestId('continue').waitFor({ state: 'visible' });
    await capture(page, 'returning');
  } finally {
    await context.close();
  }
}

async function shots(stage) {
  if (!['before', 'after'].includes(stage)) throw new Error('node scripts/shots.mjs <before|after>');
  const dir = 'docs/redesign/shots/' + stage;
  await mkdir(dir, { recursive: true });
  const browser = await launch();
  try {
    for (const viewport of sizes) {
      await Promise.all(themes.map((theme) => walk(browser, viewport, theme, async (page, screen) => {
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(Array.from(document.querySelectorAll('.cast'), (img) => img.decode()));
        });
        const path = `${dir}/${screen}-${viewport.width}-${theme}.jpg`;
        const buffer = await page.screenshot({ path, type: 'jpeg', quality: 70, animations: 'disabled' });
        if (buffer.length > 1_000_000) throw new Error('Снимок тяжелее 1 МБ: ' + path);
      })));
      console.log('Снимки ' + viewport.width + ' px готовы');
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('/shots.mjs')) await shots(process.argv[2]);
