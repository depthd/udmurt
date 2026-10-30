/**
 * Устойчивость: «злые» и битые ссылки, испорченные данные в localStorage.
 * Сайт не должен падать в пустую страницу и не должен выполнять чужой код из адреса.
 */
import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

const P = 'udm.progress.v1';

async function open(page: Page, hash: string, storage: Record<string, string> = {}) {
  let dialog = false;
  page.on('dialog', async (d) => {
    dialog = true;
    await d.dismiss();
  });
  await page.goto('#/');
  if (Object.keys(storage).length)
    await page.evaluate((st) => {
      for (const [k, v] of Object.entries(st)) localStorage.setItem(k, v);
    }, storage);
  await page.goto(hash);
  await page.reload();
  await expect(page.locator('main')).not.toBeEmpty();
  // ни «предохранителя», ни пустого экрана
  await expect(page.getByText('Что-то пошло не так')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(/\S{3,}/);
  expect(dialog, 'из адреса выполнился чужой код').toBe(false);
}

const urls: [string, string][] = [
  ['битый %-код в словаре', '#/dict/%'],
  ['обрезанный UTF-8', '#/dict/%E0%A4%A'],
  ['HTML в слове словаря', '#/dict/%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E'],
  ['script вместо урока', '#/lesson/%3Cscript%3Ealert(1)%3C%2Fscript%3E'],
  ['несуществующий урок', '#/lesson/u99-l1'],
  ['несуществующий текст', '#/read/nope'],
  ['мусорный код группы', '#/group/G1.%%%.zzz'],
  ['очень длинный адрес', '#/dict/' + 'я'.repeat(5000)],
];
for (const [name, hash] of urls) test(`ссылка: ${name}`, async ({ page }) => open(page, hash));

const dirty: [string, string, Record<string, string>][] = [
  ['прогресс — не JSON', '#/learn', { [P]: '{oops' }],
  ['прогресс — null вместо полей', '#/learn', { [P]: JSON.stringify({ v: 1, lessons: null, streak: null, cards: null, days: null }) }],
  ['прогресс — неверные типы', '#/me', { [P]: JSON.stringify({ v: 1, xp: 'много', lessons: [1, 2], streak: { current: 'x', frozen: 'no' }, achievements: 'all' }) }],
  ['карточки удалённых слов', '#/practice', { [P]: JSON.stringify({ v: 1, onboarded: true, xp: 10, cards: { 'nope-nope': { due: 0, reps: 1, lapses: 0 } }, mistakes: { 'nope-nope': 3 } }) }],
  ['__proto__ в прогрессе', '#/me', { [P]: '{"v":1,"__proto__":{"x":1},"lessons":{"__proto__":{"done":1}}}' }],
  ['настройки — мусор', '#/', { 'udm.prefs.v1': '[1,2,3]' }],
  ['«Помочь проекту» — мусор', '#/help', { 'udm.native.v1': '{"speaker":null,"marks":"x"}' }],
  ['группа — мусор', '#/group', { 'udm.group.v1': '{"members":"x","goal":null}' }],
  ['игра — null', '#/game', { 'udm.wordle.v1': 'null' }],
  ['игра — старая и битая', '#/game', { 'udm.wordle.v1': '{"day":"2020-01-01","stats":{"dist":"x","played":-5}}' }],
  ['путь — мусор', '#/learn', { 'udm.path.seen.v1': '{"u1-znakomstvo":"x","__proto__":5}' }],
];
for (const [name, hash, st] of dirty) test(`данные: ${name}`, async ({ page }) => open(page, hash, st));

test('чужой или испорченный код прогресса не затирает свой', async ({ page }) => {
  page.on('dialog', (d) => d.accept());
  await page.goto('#/');
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ v: 1, xp: 77, onboarded: true })), P);
  await page.reload();
  await page.goto('#/me');
  for (const bad of [
    'UDM1.' + Buffer.from(JSON.stringify({ hello: 'world' })).toString('base64url'),
    'UDM1.' + Buffer.from(JSON.stringify([1, 2, 3])).toString('base64url'),
    'UDM1.%%%не-код%%%',
  ]) {
    await page.getByRole('textbox', { name: 'Код прогресса' }).fill(bad);
    await page.getByTestId('import-code').click();
    const xp = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{}').xp, P);
    expect(xp, bad).toBe(77);
  }
});

test('данные: игра сегодняшнего дня — битые ходы', async ({ page }) => {
  await page.goto('#/');
  await page.evaluate(() => {
    const d = new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    localStorage.setItem('udm.wordle.v1', JSON.stringify({ day, rows: [{ guess: 5, marks: 'x' }, 'zzz', { guess: 'калык', marks: [1, 2] }], done: 'да', stats: null }));
  });
  await page.goto('#/game');
  await page.reload();
  await expect(page.getByText('Что-то пошло не так')).toHaveCount(0);
  await expect(page.locator('main')).toContainText(/\S{3,}/);
});

// Скрипт сайта не загрузился (обрыв связи, блокировщик) — запасной экран вместо пустой страницы
const MAIN_JS = /\/assets\/index-[^/]+\.js$/;
test('сайт не запустился — запасной экран с «Обновить»', async ({ page }) => {
  await page.route(MAIN_JS, (r) => r.abort());
  await page.goto('#/');
  await expect(page.getByRole('heading', { name: 'Сайт не запустился' })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#boot-reload')).toBeVisible();
});
test('старый браузер — так и говорим', async ({ page }) => {
  await page.addInitScript(() => {
    delete (Array.prototype as { at?: unknown }).at;
  });
  await page.route(MAIN_JS, (r) => r.abort());
  await page.goto('#/');
  await expect(page.getByRole('heading', { name: 'Браузер устарел' })).toBeVisible({ timeout: 10_000 });
});
