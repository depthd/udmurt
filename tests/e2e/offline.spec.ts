/**
 * Офлайн-режим на боевой сборке (с service worker): после первого визита без сети открываются
 * все разделы — даже те, где ученик ещё не был, — а аудио отдаётся кусками (Range), как просит Safari.
 */
import { test, expect } from './fixtures';

test('без сети открываются все разделы, аудио отдаётся кусками', async ({ page, context }) => {
  test.setTimeout(120_000);
  await page.goto('#/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // страница должна оказаться под управлением service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 }).toBe(true);

  // кэш новой версии, без старого «udm-v1»
  const keys = await page.evaluate(() => caches.keys());
  expect(keys.some((k) => k.startsWith('udm-static-'))).toBe(true);
  expect(keys).not.toContain('udm-v1');

  // аудио: запрос куска → 206 с нужной длиной
  const part = await page.evaluate(async () => {
    const r = await fetch('audio/zechbures.mp3', { headers: { Range: 'bytes=0-99' } });
    return { status: r.status, len: (await r.arrayBuffer()).byteLength, range: r.headers.get('content-range') };
  });
  expect(part.status).toBe(206);
  expect(part.len).toBe(100);
  expect(part.range).toMatch(/^bytes 0-99\/\d+$/);

  // mp3, открытый по прямой ссылке в отдельной вкладке, не должен подменить собой страницу приложения
  await page.goto('audio/zechbures.mp3');

  await context.setOffline(true);
  // без сети не должно быть сетевых запросов — убеждаемся, что эмуляция действует
  const online = await page.evaluate(() => fetch('data/never-cached.json?x=' + Date.now()).then(() => true, () => false));
  expect(online, 'эмуляция офлайна не действует на service worker').toBe(false);

  // разделы, в которых ученик ещё не был
  for (const [hash, text] of [
    ['#/dict', 'Словарь'],
    ['#/read/t1-mon', 'Мон'],
    ['#/about', 'Кратко'],
    ['#/phrases', 'Разговорник'],
    ['#/help', 'Помочь проекту'],
  ] as const) {
    await page.goto(hash);
    await expect(page.locator('main'), hash).toContainText(text, { timeout: 10_000 });
    await expect(page.getByText('Раздел не загрузился')).toHaveCount(0);
  }
  // перезагрузка страницы без сети — из кэша
  await page.reload();
  await expect(page.locator('main')).toContainText('Помочь проекту');
  // кусок аудио без сети — из кэша
  const offlinePart = await page.evaluate(async () => {
    const r = await fetch('audio/zechbures.mp3', { headers: { Range: 'bytes=10-19' } });
    return { status: r.status, len: (await r.arrayBuffer()).byteLength };
  });
  expect(offlinePart).toEqual({ status: 206, len: 10 });
  await context.setOffline(false);
});
