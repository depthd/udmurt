/* Офлайн-режим «Удмурт кыл».
 * Страница — сначала сеть (сразу видно обновления), без сети — из кэша.
 * Файлы сборки (JS, CSS) — кэшируются заранее при установке, поэтому без сети открываются все разделы.
 * Озвучка, словарь, шрифты — из кэша с фоновым обновлением; живут между выпусками.
 * Аудио Safari запрашивает кусками (Range) — отвечаем 206 из полного файла в кэше.
 * VERSION и PRECACHE подставляет сборка (vite/build-plugins.ts); при новом выпуске старый кэш удаляется.
 */
const VERSION = /*VERSION*/ 'dev';
const PRECACHE = /*PRECACHE*/ [];
const STATIC = 'udm-static-' + VERSION;
const RUNTIME = 'udm-runtime';
const CORE = ['./', './index.html', './manifest.webmanifest', './favicon.svg', './fonts/Nunito-VF.woff2', './fonts/Rubik-VF.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(STATIC)
      // по одному: отсутствие одного файла не должно срывать установку. Страницу и прочие файлы без хэша
      // в имени берём с сервера мимо HTTP-кэша: GitHub Pages разрешает хранить их 10 минут, и сразу после
      // выпуска в кэш могла бы попасть старая страница со ссылками на уже удалённые файлы.
      .then((c) =>
        Promise.allSettled([...CORE.map((u) => new Request(u, { cache: 'reload' })), ...PRECACHE].map((r) => c.add(r))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('udm-') && k !== STATIC && k !== RUNTIME).map((k) => caches.delete(k))))
      // файлы прошлых сборок (assets/…-хэш.js), случайно осевшие в общем кэше, больше не нужны
      .then(() => caches.open(RUNTIME))
      .then((c) => c.keys().then((reqs) => Promise.all(reqs.filter((r) => r.url.includes('/assets/')).map((r) => c.delete(r)))))
      .then(() => self.clients.claim()),
  );
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

// Сама страница приложения: /udmurt/ или /udmurt/index.html (раздел — после #, на сервер не уходит)
const SHELL = [new URL('./', self.registration.scope).pathname, new URL('./index.html', self.registration.scope).pathname];

async function page(req) {
  const c = await caches.open(STATIC);
  const shell = SHELL.includes(new URL(req.url).pathname);
  try {
    // страницу приложения сверяем с сервером (обычно ответ «не изменилась» — пара сотен байт), чтобы
    // после выпуска сразу получить новую, а не 10 минут держать старую из HTTP-кэша
    const res = await withTimeout(shell ? fetch(req.url, { cache: 'no-cache' }) : fetch(req), 6000);
    // в кэш как страницу приложения — только её саму и только удачный HTML-ответ
    // (не ошибку сервера и не mp3, открытый по прямой ссылке в отдельной вкладке)
    if (shell && res.ok && (res.headers.get('content-type') || '').includes('text/html')) await c.put('./index.html', res.clone()).catch(() => {});
    return res;
  } catch {
    return (shell ? null : await caches.match(req)) || (await c.match('./index.html')) || (await c.match('./')) || Response.error();
  }
}

async function ranged(req) {
  const url = req.url;
  const cache = await caches.open(RUNTIME);
  let full = await cache.match(url);
  if (!full) {
    try {
      const res = await fetch(url);
      if (res.status !== 200) return res;
      await cache.put(url, res.clone()).catch(() => {}); // нет места в кэше — всё равно отдаём
      full = res;
    } catch {
      return new Response('', { status: 504 });
    }
  }
  const buf = await full.arrayBuffer();
  const size = buf.byteLength;
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
  let start = 0;
  let end = size - 1;
  if (m && m[1]) {
    start = Number(m[1]);
    if (m[2]) end = Math.min(Number(m[2]), size - 1);
  } else if (m && m[2]) {
    start = Math.max(0, size - Number(m[2])); // «последние N байт»
  }
  if (start > end) return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${size}` } });
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}

async function asset(req, e) {
  const st = await caches.open(STATIC);
  const pre = await st.match(req);
  if (pre) return pre; // файлы сборки с хэшем в имени не меняются
  const c = await caches.open(RUNTIME);
  const hit = await c.match(req);
  const net = fetch(req)
    .then(async (res) => {
      if (res.status === 200) await c.put(req, res.clone()).catch(() => {}); // 206 и ошибки в кэш не кладём
      return res;
    })
    .catch(() => hit || Response.error());
  // ответ из кэша сразу, свежая версия докачивается в фоне (браузер не должен прервать её на полпути)
  if (hit) e.waitUntil(net);
  return hit || net;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') return e.respondWith(page(req));
  if (req.headers.has('range')) return e.respondWith(ranged(req));
  e.respondWith(asset(req, e));
});
