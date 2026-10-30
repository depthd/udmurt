<script lang="ts">
  import { router, href } from '$lib/router.svelte';
  import { progress } from '$lib/progress.svelte';
  import { requestPersist } from '$lib/storage';
  import { ui } from '$lib/ui.svelte';
  import { course, personalize } from '$lib/course';
  import Home from './routes/Home.svelte';
  import Learn from './routes/Learn.svelte';
  import LessonPage from './routes/Lesson.svelte';
  import NotFound from './routes/NotFound.svelte';
  import type { Component } from 'svelte';

  // Редкие разделы грузятся отдельно, при первом открытии (первый экран — легче).
  const lazy: Record<string, () => Promise<{ default: Component<any> }>> = {
    practice: () => import('./routes/Practice.svelte'),
    about: () => import('./routes/About.svelte'),
    dict: () => import('./routes/Dict.svelte'),
    library: () => import('./routes/Library.svelte'),
    me: () => import('./routes/Me.svelte'),
    credits: () => import('./routes/Credits.svelte'),
    group: () => import('./routes/Group.svelte'),
    projector: () => import('./routes/Projector.svelte'),
    game: () => import('./routes/Game.svelte'),
    read: () => import('./routes/Read.svelte'),
    phrases: () => import('./routes/Phrases.svelte'),
    help: () => import('./routes/Help.svelte'),
  };
  const loaded = $state<Record<string, Component<any>>>({});
  let loadError = $state<string | null>(null);
  $effect(() => {
    const name = router.current.name;
    if (!lazy[name] || loaded[name]) return;
    loadError = null;
    const flag = 'udm.reload-once';
    lazy[name]()
      .then((m) => {
        loaded[name] = m.default;
        try {
          if (sessionStorage.getItem(flag) === name) sessionStorage.removeItem(flag);
        } catch {
          /* sessionStorage недоступен */
        }
      })
      .catch(() => {
        // После нового выпуска старые файлы разделов удаляются с сервера: один раз перезагружаем
        // страницу (она подтянет новую версию). Если и это не помогло (нет сети) — честно говорим.
        let reloaded = false;
        try {
          reloaded = sessionStorage.getItem(flag) === name;
          if (!reloaded && navigator.onLine) {
            sessionStorage.setItem(flag, name);
            location.reload();
            return;
          }
        } catch {
          /* sessionStorage недоступен */
        }
        loadError = name;
      });
  });
  import TopBar from './components/TopBar.svelte';
  import NavBar from './components/NavBar.svelte';

  const r = $derived(router.current);
  // «5 букв» всегда идёт без шапки и навигации — переключаем режим сразу, а не после загрузки чанка (иначе сдвиг вёрстки)
  const inLesson = $derived(r.name === 'lesson' || r.name === 'game' || ((r.name === 'practice' || r.name === 'projector') && ui.immersive));

  // Заголовок вкладки для каждого раздела (WCAG 2.4.2). У урока — свой, в Lesson.svelte.
  const SITE = 'Удмурт кыл';
  const TITLES: Record<string, string> = {
    learn: 'Уроки',
    practice: 'Повторение',
    about: 'О языке',
    dict: 'Словарь',
    library: 'Материалы',
    me: 'Профиль',
    credits: 'Источники и благодарности',
    group: 'Группа и лига недели',
    projector: 'Режим проектора',
    game: '5 букв',
    read: 'Читалка',
    phrases: 'Разговорник',
    help: 'Помочь проекту',
    notfound: 'Страница не найдена',
  };
  const pageTitle = $derived.by(() => {
    if (r.name === 'home') return `${SITE} — учим удмуртский`;
    if (r.name === 'read' && r.params.id) {
      const t = course.texts.find((x) => x.id === r.params.id);
      return `Читалка: ${t ? personalize(t.title) : 'текст не найден'} — ${SITE}`;
    }
    return `${TITLES[r.name] ?? TITLES.notfound} — ${SITE}`;
  });
  $effect(() => {
    if (r.name !== 'lesson') document.title = pageTitle;
  });

  $effect(() => {
    if (progress.data.xp > 0) void requestPersist();
  });

  // ── Предохранитель: страница упала — показываем, что делать, а не пустой экран ──
  let pageError = $state('');
  let failedPath = '';
  let resetBoundary: (() => void) | undefined;
  let copied = $state(false);
  function onPageError(error: unknown, reset: () => void) {
    console.error(error);
    pageError = String((error as Error)?.message ?? error).slice(0, 200);
    failedPath = router.current.path;
    resetBoundary = reset;
  }
  // ушли на другую страницу — пробуем показать её заново
  $effect(() => {
    const path = r.path;
    if (resetBoundary && path !== failedPath) {
      const reset = resetBoundary;
      resetBoundary = undefined;
      pageError = '';
      reset();
    }
  });
  async function copyBackup() {
    try {
      await navigator.clipboard.writeText(progress.exportCode());
      copied = true;
    } catch {
      prompt('Скопируйте код прогресса:', progress.exportCode());
    }
  }
  function resetAll() {
    if (!confirm('Удалить все данные сайта в этом браузере (прогресс, настройки, группу)?')) return;
    try {
      for (const k of Object.keys(localStorage)) if (k.startsWith('udm.')) localStorage.removeItem(k);
    } catch {
      /* нет доступа к хранилищу */
    }
    location.href = href('/');
    location.reload();
  }
</script>

<a class="skip no-print" href="#main" onclick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>К содержимому</a>

{#if !inLesson}
  <TopBar />
{/if}

<main id="main" tabindex="-1" class:lesson-mode={inLesson}>
  <svelte:boundary onerror={onPageError}>
    {#if r.name === 'home'}
      <Home />
    {:else if r.name === 'learn'}
      <Learn />
    {:else if r.name === 'lesson'}
      {#key r.params.id}
        <LessonPage id={r.params.id} />
      {/key}
    {:else if lazy[r.name]}
      {@const Page = loaded[r.name]}
      {#if Page}
        <Page {...r.params} />
      {:else if loadError === r.name}
        <div class="page oops" role="alert">
          <h1>Раздел не загрузился</h1>
          <p class="muted">{navigator.onLine ? 'Возможно, сайт только что обновился.' : 'Похоже, нет интернета, а этот раздел ещё не сохранён для работы без сети.'}</p>
          <button class="btn" onclick={() => location.reload()}>Обновить страницу</button>
          <a class="btn btn--ghost" href={href('/')}>На главную</a>
        </div>
      {:else}
        <div class="page loading" aria-busy="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
      {/if}
    {:else}
      <NotFound />
    {/if}

    {#snippet failed()}
      <div class="page oops" role="alert">
        <h1>Что-то пошло не так</h1>
        <p class="muted">Эта страница сломалась. Прогресс хранится в браузере и никуда не делся.</p>
        <div class="oops-acts">
          <button class="btn" onclick={() => location.reload()}>Обновить страницу</button>
          <a class="btn btn--ghost" href={href('/')}>На главную</a>
        </div>
        <details class="oops-more">
          <summary>Не помогает?</summary>
          <p>Сохраните код прогресса (его можно вставить потом в «Профиле»), затем сбросьте данные сайта.</p>
          <button class="btn btn--sm btn--ghost" onclick={copyBackup}>{copied ? 'Код скопирован' : 'Скопировать код прогресса'}</button>
          <button class="btn btn--sm btn--ghost" onclick={resetAll}>Сбросить данные сайта</button>
          {#if pageError}<p class="muted small">Ошибка: {pageError}</p>{/if}
        </details>
      </div>
    {/snippet}
  </svelte:boundary>
</main>

{#if !inLesson}
  <NavBar current={r.name} />
{/if}

<style>
  .oops {
    max-width: 520px;
    padding-top: 12vh;
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .oops h1 {
    margin: 0;
  }
  .oops-acts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .oops-more {
    margin-top: 8px;
  }
  .oops-more summary {
    cursor: pointer;
    font-weight: 600;
  }
  .oops-more .btn {
    margin: 6px 6px 0 0;
  }
  .small {
    font-size: 0.82rem;
  }
  .loading {
    display: flex;
    justify-content: center;
    gap: 8px;
    padding-top: 30vh;
  }
  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .dot {
      animation: blinkdot 900ms ease-in-out infinite;
    }
    :global(html:not([data-motion='reduce'])) .dot:nth-child(2) {
      animation-delay: 150ms;
    }
    :global(html:not([data-motion='reduce'])) .dot:nth-child(3) {
      animation-delay: 300ms;
    }
  }
  @keyframes blinkdot {
    50% {
      opacity: 0.3;
    }
  }
  .skip {
    position: absolute;
    left: 8px;
    top: -100px;
    z-index: 1000;
    background: var(--ink);
    color: var(--bg);
    padding: 8px 12px;
    border-radius: 8px;
  }
  .skip:focus {
    top: 8px;
  }
  main {
    outline: none;
    display: block;
  }
</style>
