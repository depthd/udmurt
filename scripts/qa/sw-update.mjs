#!/usr/bin/env node
/**
 * Репетиция выпуска для офлайн-режима (service worker): как ученик со старой версией переходит на новую.
 *
 *   git archive <старый-коммит> | tar -x -C /tmp/old && (cd /tmp/old && ln -s "$PWD/node_modules" . && npx vite build --outDir /tmp/old-dist)
 *   npm run build
 *   node scripts/qa/sw-update.mjs /tmp/old-dist dist
 *
 * Сервер повторяет GitHub Pages: Cache-Control: max-age=600, ETag, 404.html. Проверяем:
 *   1) сразу после выпуска новая вкладка получает новую страницу, хотя HTTP-кэш ещё «свежий»;
 *   2) новый service worker забирает страницу, старые кэши удалены;
 *   3) вкладка, открытая до выпуска, продолжает открывать разделы — до и после смены service worker;
 *   4) все разделы открываются, без сети страница загружается; ошибок в консоли нет.
 * Браузер: PW_CHROMIUM=/путь/к/chromium, если Playwright не нашёл свой.
 *
 * Переход со старого service worker (кэш «udm-v1», до 30.10.2026) проходит не все проверки, и это ожидаемо:
 * он брал страницу из HTTP-кэша (до 10 минут после выпуска — старая версия), а старое приложение не умело
 * перезагружаться, если файл раздела уже удалён с сервера. Лечится одной перезагрузкой; с новым service
 * worker обе проблемы закрыты (пункты 1 и 3).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const [oldDir, newDir] = process.argv.slice(2).map((d) => path.resolve(d));
if (!oldDir || !newDir) {
  console.error('использование: node scripts/qa/sw-update.mjs <старая-сборка> <новая-сборка>');
  process.exit(2);
}
const PORT = 5430;
const base = `http://localhost:${PORT}/udmurt/`;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };

let root = oldDir;
const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (!u.pathname.startsWith('/udmurt/')) return void res.writeHead(404).end();
  let p = decodeURIComponent(u.pathname.slice('/udmurt'.length));
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(root, p);
  const ok = f.startsWith(root) && fs.existsSync(f) && fs.statSync(f).isFile();
  const file = ok ? f : path.join(root, fs.existsSync(path.join(root, '404.html')) ? '404.html' : 'index.html');
  const body = fs.readFileSync(file);
  const etag = `"${crypto.createHash('sha1').update(body).digest('hex').slice(0, 16)}"`;
  const headers = { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'max-age=600', etag };
  if (ok && req.headers['if-none-match'] === etag) return void res.writeHead(304, headers).end();
  res.writeHead(ok ? 200 : 404, headers).end(body);
});
await new Promise((r) => server.listen(PORT, r));

const entry = (dir) => /<script type="module"[^>]*src="([^"]+)"/.exec(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'))?.[1];
const want = { old: entry(oldDir), new: entry(newDir) };
const fails = [];
const check = (ok, what) => {
  console.log(`${ok ? '✓' : '✗'} ${what}`);
  if (!ok) fails.push(what);
};

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
const ctx = await browser.newContext();
const errors = [];
const watch = (p, name) => {
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errors.push(`${name}: ${m.text().slice(0, 200)}`));
};
const until = async (p, fn, ms = 20_000) => {
  for (const t = Date.now(); Date.now() - t < ms; await p.waitForTimeout(300)) if (await p.evaluate(fn)) return true;
  return false;
};
const page = async (name) => {
  const p = await ctx.newPage();
  watch(p, name);
  return p;
};
const version = (p) => p.evaluate(() => document.querySelector('script[type="module"]')?.getAttribute('src'));
const mainText = (p) => p.evaluate(() => document.querySelector('main')?.innerText ?? '');
const broken = (t) => t.trim().length < 3 || /Раздел не загрузился|Что-то пошло не так/.test(t);

try {
  // ── до выпуска: ученик на старой версии, service worker уже работает
  const a = await page('A');
  await a.goto(base + '#/');
  check(await until(a, () => !!navigator.serviceWorker.controller), 'старая версия: service worker управляет страницей');
  await a.goto(base + '#/dict');
  await a.waitForTimeout(1500);
  const stale = await page('B'); // вкладка, открытая до выпуска и не перезагружаемая
  await stale.goto(base + '#/learn');
  await stale.waitForTimeout(1000);

  // ── выпуск
  root = newDir;
  const t = await page('C');
  await t.goto(base + '#/learn');
  check((await version(t)) === want.new, 'новая вкладка сразу после выпуска получает новую версию');

  // открытая до выпуска вкладка переходит в раздел, где ещё не была
  await stale.evaluate(() => (location.hash = '#/credits'));
  await stale.waitForTimeout(1500);
  check(!broken(await mainText(stale)), 'старая вкладка: новый раздел открывается до смены service worker');

  const swapped = await until(t, async () => {
    const k = await caches.keys();
    return k.some((x) => x.startsWith('udm-static-')) && k.filter((x) => x.startsWith('udm-') && x !== 'udm-runtime').length === 1;
  });
  check(swapped, 'новый service worker активен, старые кэши удалены');

  await stale.evaluate(() => (location.hash = '#/game'));
  await stale.waitForTimeout(3000);
  check(!broken(await mainText(stale)), 'старая вкладка: раздел открывается и после смены service worker');

  await t.reload();
  check((await version(t)) === want.new, 'после перезагрузки — новая версия');
  for (const h of ['#/learn', '#/practice', '#/dict', '#/about', '#/read', '#/phrases', '#/game', '#/group', '#/help', '#/me', '#/library', '#/credits']) {
    await t.goto(base + h);
    await t.waitForTimeout(600);
    check(!broken(await mainText(t)), `раздел ${h}`);
  }

  await ctx.setOffline(true);
  await t.goto(base + '#/read');
  await t.reload();
  await t.waitForTimeout(1500);
  check(!broken(await mainText(t)) && (await version(t)) === want.new, 'без сети: новая версия из кэша');
  await ctx.setOffline(false);

  check(errors.length === 0, `ошибок в консоли нет${errors.length ? ':\n  ' + errors.join('\n  ') : ''}`);
} finally {
  await browser.close();
  server.close();
}
console.log(fails.length ? `\nНЕ ПРОШЛО: ${fails.length}` : '\nВсё в порядке');
process.exit(fails.length ? 1 : 0);
