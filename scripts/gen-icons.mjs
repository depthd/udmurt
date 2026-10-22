#!/usr/bin/env node
/** Генерация PNG-иконок PWA и картинки для соцсетей: node scripts/gen-icons.mjs */
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const star = (fill) => `<polygon points="50,0 150,100 0,100 100,0 100,150 0,50 150,50 50,150" fill="${fill}"/>`;
const icon = (size, pad, bg = '#FBF7F0') => `<!doctype html><html><body style="margin:0">
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${pad} ${pad}) scale(${(size - 2 * pad) / 150})">${star('#DD2211')}</g>
</svg></body></html>`;

const font = (f) => `data:font/woff2;base64,${fs.readFileSync(`public/fonts/${f}`).toString('base64')}`;
const og = `<!doctype html><html><head><style>
@font-face{font-family:Rubik;src:url(${font('Rubik-VF.woff2')});font-weight:300 900}
@font-face{font-family:Nunito;src:url(${font('Nunito-VF.woff2')});font-weight:200 1000}
body{margin:0;width:1200px;height:630px;background:#FBF7F0;font-family:Nunito;color:#1F1A17;position:relative;overflow:hidden}
h1{font:800 120px/1 Rubik;margin:0;letter-spacing:-2px}
p{font:600 40px/1.3 Nunito;margin:24px 0 0;color:#5E5650}
.wrap{position:absolute;left:90px;top:150px}
.band{position:absolute;left:0;right:0;bottom:0;height:46px;background:repeating-linear-gradient(45deg,#DD2211 0 16px,#FBF7F0 16px 32px,#1F1A17 32px 40px,#FBF7F0 40px 56px)}
.star{position:absolute;right:90px;top:170px}
.chip{display:inline-block;margin-top:36px;padding:12px 26px;border-radius:999px;background:#1F1A17;color:#FBF7F0;font:700 30px Rubik}
</style></head><body>
<div class="wrap"><h1>Удмурт кыл</h1><p>Учим удмуртский по 5 минут в день:<br>уроки, повторение, словарь</p><span class="chip">depthd.github.io/udmurt</span></div>
<svg class="star" width="240" height="240" viewBox="0 0 150 150">${star('#DD2211')}</svg>
<div class="band"></div></body></html>`;

const exe = fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined;
const browser = await chromium.launch({ executablePath: exe });
async function shot(html, w, h, out) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: out, omitBackground: false });
  await page.close();
  console.log(out);
}
await shot(icon(192, 26), 192, 192, 'public/icons/icon-192.png');
await shot(icon(512, 70), 512, 512, 'public/icons/icon-512.png');
await shot(icon(512, 120), 512, 512, 'public/icons/icon-maskable-512.png');
await shot(icon(180, 24), 180, 180, 'public/icons/apple-touch-icon.png');
await shot(og, 1200, 630, 'public/og.png');
await browser.close();
