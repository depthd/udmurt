<script lang="ts">
  /**
   * «О языке» — лонгрид с липким оглавлением-чипами.
   * Адрес #/about/<раздел> плавно прокручивает к разделу; чипы меняют адрес без перезагрузки экрана.
   */
  import { onMount, tick } from 'svelte';
  import { href, router } from '$lib/router.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { SECTIONS, SECTION_IDS } from '../data/about/sections';
  import Intro from '../components/about/Intro.svelte';
  import Family from '../components/about/Family.svelte';
  import History from '../components/about/History.svelte';
  import Speakers from '../components/about/Speakers.svelte';
  import Dialects from '../components/about/Dialects.svelte';
  import Glazov from '../components/about/Glazov.svelte';
  import Facts from '../components/about/Facts.svelte';
  import LearnMore from '../components/about/LearnMore.svelte';
  import Stitch from '../components/about/Stitch.svelte';
  import Alphabet from '../components/about/Alphabet.svelte';
  import Grammar from '../components/about/Grammar.svelte';
  import Compare from '../components/about/Compare.svelte';

  let { section }: { section?: string } = $props();

  let active = $state('intro');
  let topH = $state(50);
  let tocH = $state(56);
  let stripEl: HTMLUListElement;
  let userMoved = false;

  const offset = () => topH + tocH + 8;

  function scrollToId(id: string, smooth: boolean) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - offset();
    window.scrollTo({ top: Math.max(0, y), behavior: smooth ? 'smooth' : 'auto' });
    el.focus({ preventScroll: true });
    active = id;
  }

  /** Чип оглавления: прокрутить к разделу и обновить адрес (без события hashchange). */
  function onChip(e: MouseEvent, id: string) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    userMoved = true;
    scrollToId(id, !prefs.reduceMotion);
    history.replaceState(history.state, '', href(`/about/${id}`));
  }

  // Открыли #/about/<раздел> (или перешли на него ещё раз) — едем к разделу.
  $effect(() => {
    void router.current; // перезапуск при каждом переходе, даже на тот же раздел
    const id = section;
    if (!id || !SECTION_IDS.includes(id)) return;
    userMoved = false;
    let alive = true;
    void tick().then(() =>
      requestAnimationFrame(() => {
        if (alive) scrollToId(id, !prefs.reduceMotion);
      }),
    );
    // Если выше что-то догрузилось и сдвинуло раздел — поправляем, пока пользователь не начал листать сам.
    const fix = setTimeout(() => {
      const el = document.getElementById(id);
      if (!alive || !el || userMoved) return;
      if (Math.abs(el.getBoundingClientRect().top - offset()) > 24) scrollToId(id, false);
    }, 1100);
    return () => {
      alive = false;
      clearTimeout(fix);
    };
  });

  // Подсветка текущего раздела в оглавлении.
  let raf = 0;
  function spy() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const line = offset() + Math.min(180, innerHeight * 0.25);
      let cur = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      }
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = SECTION_IDS[SECTION_IDS.length - 1];
      active = cur;
    });
  }

  // Активный чип — в видимую часть полосы (только по горизонтали).
  $effect(() => {
    const id = active;
    const chip = stripEl?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!chip || !stripEl) return;
    const left = chip.offsetLeft - (stripEl.clientWidth - chip.offsetWidth) / 2;
    stripEl.scrollTo({ left: Math.max(0, left), behavior: prefs.reduceMotion ? 'auto' : 'smooth' });
  });

  function measureTop() {
    topH = document.querySelector<HTMLElement>('header.top')?.offsetHeight ?? 0;
  }

  onMount(() => {
    measureTop();
    spy();
    const moved = () => (userMoved = true);
    addEventListener('wheel', moved, { passive: true });
    addEventListener('touchstart', moved, { passive: true });
    addEventListener('keydown', moved);
    return () => {
      removeEventListener('wheel', moved);
      removeEventListener('touchstart', moved);
      removeEventListener('keydown', moved);
      cancelAnimationFrame(raf);
    };
  });
</script>

<svelte:window onscroll={spy} onresize={measureTop} />

<div class="about" style:--ab-top="{topH}px" style:--ab-off="{topH + tocH + 8}px">
  <nav class="toc" aria-label="Разделы страницы «О языке»" bind:offsetHeight={tocH}>
    <ul bind:this={stripEl}>
      {#each SECTIONS as s (s.id)}
        <li>
          <a
            href={href(`/about/${s.id}`)}
            data-id={s.id}
            class:active={active === s.id}
            aria-current={active === s.id ? 'location' : undefined}
            onclick={(e) => onChip(e, s.id)}>{s.label}</a
          >
        </li>
      {/each}
    </ul>
  </nav>

  <div class="page body">
    <Intro />
    <Stitch />
    <Family />
    <Stitch />
    <History />
    <Stitch />
    <Speakers />
    <Stitch />
    <Dialects />
    <Stitch />
    <Glazov />
    <Stitch />
    <div id="alphabet" class="ab-sec ab-slot" tabindex="-1"><Alphabet /></div>
    <Stitch />
    <div id="grammar" class="ab-sec ab-slot" tabindex="-1"><Grammar /></div>
    <Stitch />
    <div id="compare" class="ab-sec ab-slot" tabindex="-1"><Compare /></div>
    <Stitch />
    <Facts />
    <Stitch />
    <LearnMore />
  </div>
</div>

<style>
  .about {
    --ab-top: 50px;
    --ab-off: 114px;
  }
  .toc {
    position: sticky;
    top: var(--ab-top);
    z-index: 15;
    background: color-mix(in srgb, var(--bg) 90%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .toc ul {
    list-style: none;
    margin: 0 auto;
    max-width: var(--page-max);
    padding: 10px var(--gutter);
    display: flex;
    gap: 6px;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    scroll-padding-inline: var(--gutter);
    scrollbar-width: none;
    -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
    mask-image: linear-gradient(90deg, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
  }
  .toc ul::-webkit-scrollbar {
    display: none;
  }
  .toc li {
    flex: none;
  }
  .toc a {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 6px 14px;
    border-radius: 999px;
    border: 2px solid var(--line);
    background: var(--surface);
    color: var(--ink);
    font: 600 0.9rem/1 var(--font-head);
    text-decoration: none;
    white-space: nowrap;
    -webkit-tap-highlight-color: transparent;
  }
  .toc a:hover {
    border-color: var(--line-strong);
  }
  .toc a.active {
    background: var(--red);
    border-color: var(--red);
    color: var(--on-fill);
  }
  .body {
    padding-top: 20px;
  }
  .about :global(.ab-sec) {
    scroll-margin-top: var(--ab-off);
  }
  .about :global(.ab-sec:focus) {
    outline: none;
  }
  .ab-slot {
    min-height: 40px;
  }

  /* Появление блоков при прокрутке (классы ставит действие reveal). */
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce']) .rv) {
      opacity: 0;
      translate: 0 18px;
      transition:
        opacity 500ms var(--ease-enter) var(--rv-delay, 0ms),
        translate var(--spring-soft-dur) var(--spring-soft) var(--rv-delay, 0ms);
    }
    :global(html:not([data-motion='reduce']) .rv.rv-in) {
      opacity: 1;
      translate: 0 0;
    }
    :global(html:not([data-motion='reduce'])) .toc a {
      transition:
        background-color var(--dur-fast) var(--ease-standard),
        border-color var(--dur-fast) var(--ease-standard),
        color var(--dur-fast) var(--ease-standard);
    }
  }
  @media print {
    :global(.rv) {
      opacity: 1 !important;
      translate: none !important;
    }
    .toc {
      display: none;
    }
  }
</style>
