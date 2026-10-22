// Массовый прогон: маршруты × вьюпорты × темы. Ошибки, переполнение, мелкие цели, обрезанный текст, CLS, перекрытия, axe.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const S = '/tmp/claude-0/-home-user-udmurt/52fab1af-918f-5c7c-94b9-e066c76c2887/scratchpad/qa';
const BASE = 'http://localhost:5400/udmurt/';
const AXE = fs.readFileSync('/root/.npm/_npx/8003d8991b0d346b/node_modules/axe-core/axe.min.js', 'utf8');
const only = process.argv[2] ? process.argv[2].split(',') : null;

const done = {};
for (const id of ['u1-l1', 'u1-l2', 'u1-l3', 'u1-l4', 'u1-l5', 'u1-l6', 'u1-story', 'u2-l1', 'u2-l2', 'u2-l3', 'u2-l4', 'u2-l5', 'u2-l6', 'u2-story', 'u3-l1'])
  done[id] = { done: 1, best: 1, last: Date.now() - 86400000 };
const today = new Date().toISOString().slice(0, 10);
const SEED = JSON.stringify({ v: 1, name: 'Алексей', xp: 100, onboarded: true, lessons: done, days: { [today]: 20 }, streak: { current: 3, best: 5, last: today, freezes: 1, frozen: [] } });

const ROUTES = ['', 'learn', 'lesson/u1-l1', 'lesson/u3-l2', 'practice', 'about', 'about/grammar', 'dict', 'dict/вуэ', 'library', 'me', 'credits', 'group', 'projector', 'game', 'read', 'read/t1-mon', 'phrases', 'nonexistent'];
const FRESH = ['', 'learn', 'lesson/u1-l1'];
const VPS = [[320, 640], [375, 812], [768, 1024], [1280, 800]];
const THEMES = ['light', 'dark'];

const results = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function audit(state, route, [w, h], theme) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: 1, hasTouch: w < 900, isMobile: w < 900 });
  await ctx.addInitScript(
    ([seed, st]) => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      localStorage.clear();
      if (st === 'seeded') localStorage.setItem('udm.progress.v1', seed);
      // накапливаем layout-shift
      window.__cls = 0;
      window.__shifts = [];
      try {
        new PerformanceObserver((l) => {
          for (const e of l.getEntries()) {
            if (!e.hadRecentInput) {
              window.__cls += e.value;
              window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), src: (e.sources || []).map((s) => s.node && s.node.nodeName + '.' + (s.node.className || '')).slice(0, 3) });
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    },
    [SEED, state],
  );
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errors.push('console: ' + m.text().slice(0, 200)));
  page.on('requestfailed', (r) => errors.push('reqfail: ' + r.url() + ' ' + (r.failure()?.errorText || '')));
  page.on('response', (r) => r.status() >= 400 && errors.push('http ' + r.status() + ' ' + r.url()));
  const url = BASE + '#/' + route;
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    errors.push('goto: ' + e.message.slice(0, 100));
  }
  await page.waitForTimeout(900);
  const loadMs = Date.now() - t0;
  const data = await page.evaluate(() => {
    const W = document.documentElement.clientWidth;
    const H = window.innerHeight;
    const vis = (el) => {
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const desc = (el) => {
      const cls = [...el.classList].filter((c) => !c.startsWith('svelte-')).join('.');
      const t = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('placeholder') || '').replace(/\s+/g, ' ').trim().slice(0, 40);
      return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${el.id ? '#' + el.id : ''} «${t}»`;
    };
    const out = { W, H, sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight };
    // переполнение
    out.overflow = [];
    if (out.sw > W) {
      for (const el of document.querySelectorAll('body *')) {
        const rc = el.getBoundingClientRect();
        if (rc.right > W + 1 && rc.width > 0) {
          let clipped = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const s = getComputedStyle(a);
            if (/(auto|scroll|hidden|clip)/.test(s.overflowX)) { clipped = true; break; }
          }
          if (!clipped) out.overflow.push(desc(el) + ` right=${Math.round(rc.right)}`);
        }
      }
      out.overflow = out.overflow.slice(0, 8);
    }
    // цели касания
    const SEL = 'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=link], [role=tab], [role=radio], [role=checkbox], [role=switch], [role=option], [tabindex]:not([tabindex="-1"])';
    out.small = [];
    out.covered = [];
    for (const el of document.querySelectorAll(SEL)) {
      if (!vis(el)) continue;
      if (el.closest('[inert], [aria-hidden="true"]') || el.classList.contains('skip')) continue;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      const inline = el.tagName === 'A' && s.display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 3;
      if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) {
        // проверяем label
        const lab = el.closest('label');
        if (lab) {
          const lr = lab.getBoundingClientRect();
          if (Math.min(lr.width, lr.height) >= 44) continue;
        }
      }
      if (Math.min(r.width, r.height) < 44) out.small.push({ d: desc(el), w: Math.round(r.width), h: Math.round(r.height), inline });
      // перекрытие (только для видимых в окне)
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      if (cx > 0 && cx < W && cy > 0 && cy < H) {
        const hit = document.elementFromPoint(cx, cy);
        if (hit && hit !== el && !el.contains(hit) && !hit.contains(el)) {
          const fixedAnc = (n) => { for (let a = n; a && a !== document.body; a = a.parentElement) { const p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') return a; } return null; };
          const fa = fixedAnc(hit);
          out.covered.push({ d: desc(el), by: desc(hit), byFixed: fa ? desc(fa).slice(0, 50) : null, y: Math.round(cy) });
        }
      }
    }
    // обрезанный текст
    out.clipped = [];
    for (const el of document.querySelectorAll('body *')) {
      if (!el.childNodes.length || !vis(el) || el.closest('.visually-hidden')) continue;
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!hasText) continue;
      const s = getComputedStyle(el);
      const ox = /(hidden|clip)/.test(s.overflowX) || s.textOverflow === 'ellipsis';
      const oy = /(hidden|clip)/.test(s.overflowY) || +s.webkitLineClamp > 0;
      if ((ox && el.scrollWidth > el.clientWidth + 1) || (oy && el.scrollHeight > el.clientHeight + 2)) out.clipped.push(desc(el) + ` sw=${el.scrollWidth}/${el.clientWidth} sh=${el.scrollHeight}/${el.clientHeight}`);
    }
    out.clipped = out.clipped.slice(0, 12);
    // мелкий шрифт
    const tiny = new Map();
    for (const el of document.querySelectorAll('body *')) {
      const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
      if (!hasText || !vis(el)) continue;
      if (el.closest('.visually-hidden, [aria-hidden="true"]')) continue;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      if (fs < 12) {
        const k = desc(el).slice(0, 60) + ' ' + fs.toFixed(1) + 'px';
        tiny.set(k, (tiny.get(k) || 0) + 1);
      }
    }
    out.tiny = [...tiny.entries()].slice(0, 10).map(([k, n]) => (n > 1 ? `${k} ×${n}` : k));
    out.cls = +(window.__cls || 0).toFixed(4);
    out.shifts = (window.__shifts || []).slice(0, 5);
    out.title = document.title;
    out.h1 = [...document.querySelectorAll('h1')].map((h) => h.textContent.trim().slice(0, 50));
    out.lang = document.documentElement.lang;
    return out;
  });
  let axe = null;
  if ((w === 375 || w === 1280) && state === 'seeded' || (w === 375 && state === 'fresh')) {
    await page.addScriptTag({ content: AXE });
    axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] });
      const pick = (v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map((n) => ({ t: n.target.join(' '), s: (n.failureSummary || '').split('\n').slice(1, 2).join(' ').slice(0, 160), html: n.html.slice(0, 120) })) });
      return { violations: r.violations.map(pick), incomplete: r.incomplete.filter((v) => v.id === 'color-contrast').map(pick) };
    });
  }
  const slug = (route || 'home').replace(/[\/]/g, '_');
  const shot = `${S}/shots/${slug}-${w}-${theme}${state === 'fresh' ? '-fresh' : ''}.png`;
  await page.screenshot({ path: shot, fullPage: w === 375 });
  results.push({ state, route, w, h, theme, loadMs, errors: [...new Set(errors)], ...data, axe, shot });
  await ctx.close();
}

for (const [w, h] of VPS)
  for (const theme of THEMES) {
    for (const route of ROUTES) if (!only || only.includes(route)) await audit('seeded', route, [w, h], theme);
    for (const route of FRESH) if (!only || only.includes(route)) await audit('fresh', route, [w, h], theme);
    process.stdout.write(`done ${w} ${theme}\n`);
  }
await browser.close();
fs.writeFileSync(`${S}/sweep.json`, JSON.stringify(results, null, 1));
console.log('total', results.length);
