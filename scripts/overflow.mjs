import { chromium } from '@playwright/test';
const [url, w = '375'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: +w, height: 800 } });
await p.goto(url, { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const r = await p.evaluate(() => {
  const W = document.documentElement.clientWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const rc = el.getBoundingClientRect();
    if (rc.right > W + 1 && rc.width > 0) {
      let hidden = false;
      for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { hidden = true; break; } }
      out.push((hidden?"(clipped) ":"")+`${el.tagName}.${[...el.classList].join('.')} right=${Math.round(rc.right)} w=${Math.round(rc.width)}`);
    }
  }
  return { W, sw: document.documentElement.scrollWidth, out: out.slice(0, 12) };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
