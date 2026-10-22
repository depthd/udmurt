<script lang="ts">
  import { router, href } from '$lib/router.svelte';
  import { progress } from '$lib/progress.svelte';
  import { requestPersist } from '$lib/storage';
  import { ui } from '$lib/ui.svelte';
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
  };
  const loaded = $state<Record<string, Component<any>>>({});
  $effect(() => {
    const name = router.current.name;
    if (lazy[name] && !loaded[name]) lazy[name]().then((m) => (loaded[name] = m.default));
  });
  import TopBar from './components/TopBar.svelte';
  import NavBar from './components/NavBar.svelte';

  const r = $derived(router.current);
  const inLesson = $derived(r.name === 'lesson' || ((r.name === 'practice' || r.name === 'projector' || r.name === 'game') && ui.immersive));

  $effect(() => {
    if (progress.data.xp > 0) void requestPersist();
  });
</script>

<a class="skip" href="#main" onclick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>К содержимому</a>

{#if !inLesson}
  <TopBar />
{/if}

<main id="main" tabindex="-1" class:lesson-mode={inLesson}>
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
    {:else}
      <div class="page loading" aria-busy="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
    {/if}
  {:else}
    <NotFound />
  {/if}
</main>

{#if !inLesson}
  <NavBar current={r.name} />
{/if}

<style>
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
    animation: blinkdot 900ms ease-in-out infinite;
  }
  .dot:nth-child(2) {
    animation-delay: 150ms;
  }
  .dot:nth-child(3) {
    animation-delay: 300ms;
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
