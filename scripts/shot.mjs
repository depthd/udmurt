#!/usr/bin/env node
/**
 * Скриншот страницы для визуальной проверки.
 *   node scripts/shot.mjs <url> <out.png> [width=375] [height=812] [--dark] [--full] [--wait=ms] [--click=selector]...
 * Использует системный Chromium (/opt/pw-browsers/chromium), если playwright-браузер не установлен.
 */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const [url, out, w = '375', h = '812', ...rest] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node scripts/shot.mjs <url> <out.png> [w] [h] [--dark] [--full] [--wait=ms] [--click=sel]');
  process.exit(1);
}
const flags = rest.filter((a) => a.startsWith('--'));
const dark = flags.includes('--dark');
const full = flags.includes('--full');
const wait = Number((flags.find((f) => f.startsWith('--wait=')) ?? '--wait=600').split('=')[1]);
const clicks = flags.filter((f) => f.startsWith('--click=')).map((f) => f.slice(8));
const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: +w, height: +h }, colorScheme: dark ? 'dark' : 'light', deviceScaleFactor: 2 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(url, { waitUntil: 'networkidle' });
for (const sel of clicks) {
  await page.click(sel);
  await page.waitForTimeout(400);
}
await page.waitForTimeout(wait);
await page.screenshot({ path: out, fullPage: full });
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
await browser.close();
console.log(JSON.stringify({ out, errors, horizontalOverflow: overflow }));
