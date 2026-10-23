<script lang="ts">
  /**
   * История — лента событий с плавной «нитью»: нить проходит через точки-события
   * S-образными стежками и «прошивается» красным по мере прокрутки.
   */
  import { onMount } from 'svelte';
  import { prefs } from '$lib/prefs.svelte';
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { reveal } from './reveal';
  import { HISTORY, HISTORY_SOURCES, KIND_LABEL, type EventKind } from '../../data/about/history';

  const CX = 14; // центр нити по x
  const AMP = 9; // размах «стежка»

  let listEl: HTMLOListElement;
  let dots = $state<number[]>([]);
  let height = $state(0);
  let progress = $state(0);

  const pathD = $derived.by(() => {
    if (!dots.length) return '';
    let d = `M ${CX} 0 L ${CX} ${dots[0].toFixed(1)}`;
    for (let i = 0; i < dots.length - 1; i++) {
      const a = dots[i],
        b = dots[i + 1],
        h = b - a,
        s = i % 2 ? -AMP : AMP;
      d += ` C ${CX + s} ${(a + h / 3).toFixed(1)}, ${CX - s} ${(a + (2 * h) / 3).toFixed(1)}, ${CX} ${b.toFixed(1)}`;
    }
    return d + ` L ${CX} ${height.toFixed(1)}`;
  });

  const full = $derived(prefs.reduceMotion);
  const shownP = $derived(full ? 1 : progress);

  function measure() {
    if (!listEl) return;
    // offsetTop, а не getBoundingClientRect: на событиях висит анимация появления (transform),
    // а нить должна совпадать с точками в итоговом положении.
    dots = [...listEl.querySelectorAll<HTMLElement>('[data-dot]')].map((el) => {
      const li = el.offsetParent as HTMLElement | null;
      return (li?.offsetTop ?? 0) + el.offsetTop + el.offsetHeight / 2;
    });
    height = listEl.offsetHeight;
  }

  let raf = 0;
  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      if (!listEl) return;
      const r = listEl.getBoundingClientRect();
      const line = innerHeight * 0.62;
      progress = Math.max(0, Math.min(1, (line - r.top) / Math.max(1, r.height)));
    });
  }

  onMount(() => {
    measure();
    onScroll();
    const ro = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    ro.observe(listEl);
    void document.fonts?.ready.then(measure);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  });

  const lit = (i: number) => full || (height > 0 && dots[i] !== undefined && dots[i] / height <= shownP + 0.001);
  const KINDS: EventKind[] = ['people', 'words', 'writing'];
</script>

<svelte:window onscroll={onScroll} onresize={onScroll} />

<Section
  id="history"
  kicker="История"
  title="От Прикамья до наших дней"
  lead="Предки удмуртов жили в Прикамье ещё до нашей эры. Соседи менялись — иранцы, тюрки, русские, — и каждый оставил в языке свои слова."
  sources={HISTORY_SOURCES}
>
  <p>
    Когда «началась» удмуртская письменность, спорят. Считают от первой записи слов (1726), первого стихотворения (1769), первой грамматики (1775) или
    первых книг (1847–1849). Поэтому вместо одной даты — лента.
  </p>

  <ul class="legend" aria-label="Типы событий">
    {#each KINDS as k (k)}
      <li><span class="sw sw-{k}" aria-hidden="true"></span>{KIND_LABEL[k]}</li>
    {/each}
  </ul>

  <div class="tl-wrap">
    <svg class="thread" width="28" height={height} aria-hidden="true">
      <path class="base" d={pathD} />
      <path class="done" d={pathD} pathLength="1" style:stroke-dashoffset={1 - shownP} />
    </svg>
    <ol class="tl" bind:this={listEl}>
      {#each HISTORY as ev, i (ev.when + ev.title)}
        <li class="ev" use:reveal>
          <span class="dot dot-{ev.kind}" class:lit={lit(i)} data-dot aria-hidden="true"></span>
          <p class="when">{ev.when}</p>
          <h3>{ev.title}</h3>
          <p class="txt"><Rich text={ev.text} /></p>
          <p class="meta">
            <span class="tag tag-{ev.kind}">{KIND_LABEL[ev.kind]}</span>
            <span class="src">
              Источник:
              {#each ev.src as s, j (s.label)}
                {#if s.url}<a href={s.url} target="_blank" rel="noopener">{s.label}<span class="visually-hidden"> (откроется в новой вкладке)</span></a
                  >{:else}{s.label}{/if}{j < ev.src.length - 1 ? '; ' : ''}
              {/each}
            </span>
          </p>
        </li>
      {/each}
    </ol>
  </div>
</Section>

<style>
  .legend {
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 0 0 18px;
    padding: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .legend li {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .sw {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 3px solid var(--k);
    background: var(--surface);
  }
  .sw-people,
  .dot-people,
  .tag-people {
    --k: var(--red);
  }
  .sw-words,
  .dot-words,
  .tag-words {
    --k: var(--amber);
  }
  .sw-writing,
  .dot-writing,
  .tag-writing {
    --k: var(--blue);
  }
  .tl-wrap {
    position: relative;
    padding-left: 40px;
  }
  .thread {
    position: absolute;
    left: 0;
    top: 0;
    overflow: visible;
  }
  .thread path {
    fill: none;
    stroke-linecap: round;
  }
  .base {
    stroke: var(--line-strong);
    stroke-width: 2;
    stroke-dasharray: 6 7;
  }
  .done {
    stroke: var(--red);
    stroke-width: 3;
    stroke-dasharray: 1;
  }
  .tl {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 22px;
  }
  .ev {
    position: relative;
  }
  .dot {
    position: absolute;
    left: -35px;
    top: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid var(--k);
    background: var(--surface);
  }
  .dot.lit {
    background: var(--k);
    box-shadow: 0 0 0 4px var(--bg);
  }
  .when {
    margin: 0 0 2px;
    font: 700 0.85rem/1.4 var(--font-head);
    letter-spacing: 0.02em;
    color: var(--red);
  }
  h3 {
    margin: 0 0 4px;
    font-size: 1.12rem;
  }
  .txt {
    margin: 0 0 6px;
  }
  .meta {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 10px;
    font-size: 0.76rem;
    color: var(--muted);
  }
  .tag {
    font: 700 0.7rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 7px;
    border-radius: 999px;
    border: 1.5px solid var(--k);
    color: var(--ink);
  }
  .src {
    overflow-wrap: anywhere;
  }
  .src a {
    color: var(--muted);
  }
  .src a:hover {
    color: var(--blue);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .dot {
      transition:
        background-color 250ms var(--ease-standard),
        scale var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .dot.lit {
      scale: 1.12;
    }
  }
</style>
