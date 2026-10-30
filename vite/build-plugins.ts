/**
 * Плагины сборки, которые делают сайт устойчивее и безопаснее:
 *   • bootGuard — «сторож запуска»: если приложение не отрисовалось (ошибка при старте, не скачался скрипт),
 *     вместо пустой страницы показываем запасной экран с «Обновить» и «Сбросить данные сайта»;
 *   • csp — политика безопасности (Content-Security-Policy) в <meta>: скрипты только свои и встроенные
 *     с точным хэшем. Даже если в страницу когда-нибудь попадёт чужой <script>, браузер его не выполнит.
 *     GitHub Pages не даёт задать заголовки, поэтому — meta (frame-ancestors так не задать);
 *   • serviceWorker — подставляет в public/sw.js версию выпуска и список файлов сборки для офлайна;
 *   • pruneAudio — не публикует отбракованный синтез (не прошёл проверку распознаванием) и служебный
 *     manifest.json: в репозитории они нужны конвейеру озвучки, на сайте — лишний вес.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { usableAudio } from './load-content.ts';

const BOOT_GUARD = `
      // Сторож запуска: приложение не отрисовалось — показываем запасной экран вместо пустой страницы
      window.addEventListener('load', function () {
        setTimeout(function () {
          var app = document.getElementById('app');
          if (!app || app.childElementCount) return;
          // сайт собран под браузеры 2022 года и новее: в старом скрипты просто не запускаются
          var old = !Array.prototype.at || !Object.hasOwn;
          app.innerHTML =
            '<div style="max-width:520px;margin:12vh auto 0;padding:0 20px;font:16px/1.5 system-ui,sans-serif">' +
            (old
              ? '<h1 style="font-size:1.5rem">Браузер устарел</h1>' +
                '<p>Сайту нужен браузер посвежее: обновите Chrome, Safari или Firefox либо откройте ссылку в другом браузере.</p>'
              : '<h1 style="font-size:1.5rem">Сайт не запустился</h1>' +
                '<p>Возможно, пропал интернет или сайт только что обновился. Прогресс хранится в браузере.</p>') +
            '<p><button id="boot-reload" style="font:inherit;padding:10px 16px">Обновить страницу</button></p>' +
            '<p style="color:#5e5650;font-size:.9rem">Не помогает? <button id="boot-reset" style="font:inherit;font-size:.9rem">Сбросить данные сайта</button></p></div>';
          document.getElementById('boot-reload').onclick = function () {
            location.reload();
          };
          document.getElementById('boot-reset').onclick = function () {
            if (!confirm('Удалить прогресс и настройки сайта в этом браузере?')) return;
            try {
              Object.keys(localStorage).forEach(function (k) {
                if (k.indexOf('udm.') === 0) localStorage.removeItem(k);
              });
            } catch (e) {}
            location.reload();
          };
        }, 1500);
      });
    `;

export function bootGuard(): Plugin {
  return {
    name: 'udm-boot-guard',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replace('</body>', `  <script>${BOOT_GUARD}</script>\n  </body>`),
    },
  };
}

/** Хэши всех встроенных (без src) скриптов страницы — для script-src. */
export function inlineScriptHashes(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    out.push(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  }
  return out;
}

export function cspContent(hashes: string[]): string {
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`.trim(),
    // Svelte ставит style="…" (анимации, отступы) — встроенные стили нужны; чужих скриптов это не открывает
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // свои записи на «Помочь проекту» проигрываются из blob:
    "media-src 'self' blob:",
    "connect-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

export function csp(): Plugin {
  return {
    name: 'udm-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: (html) => {
        const meta =
          `<meta http-equiv="Content-Security-Policy" content="${cspContent(inlineScriptHashes(html))}" />\n` +
          `    <meta name="referrer" content="strict-origin-when-cross-origin" />`;
        // политика должна стоять раньше любого скрипта
        return html.replace(/(<meta charset="UTF-8" \/>)/, `$1\n    ${meta}`);
      },
    },
  };
}

export function serviceWorker(): Plugin {
  let outDir = 'dist';
  return {
    name: 'udm-sw',
    apply: 'build',
    configResolved(c) {
      outDir = path.resolve(c.root, c.build.outDir);
    },
    writeBundle(_opts, bundle) {
      const file = path.join(outDir, 'sw.js');
      if (!fs.existsSync(file)) return;
      const files = Object.keys(bundle)
        .filter((f) => /\.(js|css)$/.test(f))
        .sort();
      const version = createHash('sha1').update(files.join('\n')).digest('hex').slice(0, 10);
      const src = fs.readFileSync(file, 'utf8');
      const out = src
        .replace("/*VERSION*/ 'dev'", JSON.stringify(version))
        .replace('/*PRECACHE*/ []', JSON.stringify(files.map((f) => './' + f)));
      if (out === src) throw new Error('sw.js: не найдены метки /*VERSION*/ и /*PRECACHE*/');
      fs.writeFileSync(file, out);
    },
  };
}

export function pruneAudio(): Plugin {
  let root = '.';
  let outDir = 'dist';
  return {
    name: 'udm-prune-audio',
    apply: 'build',
    configResolved(c) {
      root = c.root;
      outDir = path.resolve(c.root, c.build.outDir);
    },
    writeBundle() {
      const man = path.join(root, 'public', 'audio', 'manifest.json');
      if (!fs.existsSync(man)) return;
      const items = (JSON.parse(fs.readFileSync(man, 'utf8')) as { items: Record<string, { cer?: number; native?: boolean }> }).items;
      for (const [id, it] of Object.entries(items)) {
        if (usableAudio(it)) continue;
        fs.rmSync(path.join(outDir, 'audio', `${id}.mp3`), { force: true });
      }
      fs.rmSync(path.join(outDir, 'audio', 'manifest.json'), { force: true });
    },
  };
}
