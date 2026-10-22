<script lang="ts">
  import { router, href } from '$lib/router.svelte';
  import { progress } from '$lib/progress.svelte';
  import { requestPersist } from '$lib/storage';
  import { ui } from '$lib/ui.svelte';
  import Home from './routes/Home.svelte';
  import Learn from './routes/Learn.svelte';
  import LessonPage from './routes/Lesson.svelte';
  import Practice from './routes/Practice.svelte';
  import About from './routes/About.svelte';
  import Dict from './routes/Dict.svelte';
  import Library from './routes/Library.svelte';
  import Me from './routes/Me.svelte';
  import Credits from './routes/Credits.svelte';
  import NotFound from './routes/NotFound.svelte';
  import TopBar from './components/TopBar.svelte';
  import NavBar from './components/NavBar.svelte';

  const r = $derived(router.current);
  const inLesson = $derived(r.name === 'lesson' || (r.name === 'practice' && ui.immersive));

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
  {:else if r.name === 'practice'}
    <Practice />
  {:else if r.name === 'about'}
    <About section={r.params.section} />
  {:else if r.name === 'dict'}
    <Dict q={r.params.q} />
  {:else if r.name === 'library'}
    <Library />
  {:else if r.name === 'me'}
    <Me />
  {:else if r.name === 'credits'}
    <Credits />
  {:else}
    <NotFound />
  {/if}
</main>

{#if !inLesson}
  <NavBar current={r.name} />
{/if}

<style>
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
