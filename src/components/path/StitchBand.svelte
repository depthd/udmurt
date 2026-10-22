<script lang="ts">
  /**
   * Полоса-«вышивка» под юнитом (отчёт 04 §3.6, §5.5): по мотиву-ромбу на каждый урок.
   * Пройденный урок «вышивает» свой мотив красной нитью, непройденный — бледный пунктир-разметка.
   * Новые мотивы прошиваются по очереди (stroke-dashoffset). Строгая сетка 45°/90°, модуль 4px.
   * Декоративная: aria-hidden; прогресс текстом есть в баннере юнита.
   */
  let {
    total,
    done,
    seen = done,
    animate = false,
  }: { total: number; done: number; seen?: number; animate?: boolean } = $props();

  const W = 40; // ширина мотива
  const H = 40;
  const width = $derived(total * W);
  const motifs = $derived(Array.from({ length: total }, (_, i) => ({ i, cx: i * W + W / 2 })));

  // Ромб с ромбом внутри и «усиками» по горизонтали — счётный узор на сетке 4px.
  const outer = (cx: number) => `M ${cx} 6 L ${cx + 14} 20 L ${cx} 34 L ${cx - 14} 20 Z`;
  const inner = (cx: number) => `M ${cx} 14 L ${cx + 6} 20 L ${cx} 26 L ${cx - 6} 20 Z`;
  const ticks = (cx: number) =>
    `M ${cx - 20} 20 L ${cx - 16} 20 M ${cx + 16} 20 L ${cx + 20} 20 M ${cx} 2 L ${cx} 4 M ${cx} 36 L ${cx} 38`;
</script>

<div class="band" aria-hidden="true">
  <svg viewBox="0 0 {width} {H}" width={width} height={H} preserveAspectRatio="xMidYMid meet" focusable="false">
    <path class="rail" d="M 2 20 H {width - 2}" />
    {#each motifs as m (m.i)}
      {@const isDone = m.i < done}
      {@const isNew = animate && isDone && m.i >= seen}
      <g
        class="motif"
        class:done={isDone}
        class:new={isNew}
        style:--delay="{1200 + (m.i - seen) * 280}ms"
      >
        <path class="base" d={outer(m.cx)} />
        {#if isDone}
          <path class="stitch" d={outer(m.cx)} pathLength="1" />
          <path class="stitch fill" d={inner(m.cx)} pathLength="1" />
          <path class="stitch ticks" d={ticks(m.cx)} />
        {:else}
          <path class="base" d={inner(m.cx)} />
        {/if}
      </g>
    {/each}
  </svg>
</div>

<style>
  .band {
    display: flex;
    justify-content: center;
    padding: 8px 0 28px;
  }
  svg {
    width: min(100%, 320px);
    height: auto;
    overflow: visible;
  }
  path {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .rail {
    stroke: var(--line-strong);
    stroke-width: 2;
    stroke-dasharray: 4 6;
  }
  .base {
    stroke: var(--line-strong);
    stroke-width: 2;
    stroke-dasharray: 3 4;
    fill: var(--bg);
  }
  .stitch {
    stroke: var(--red);
    stroke-width: 3;
  }
  .stitch.fill {
    fill: var(--red);
  }
  .stitch.ticks {
    stroke-width: 3;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .new .stitch:not(.ticks) {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: stitch 420ms var(--ease-enter) var(--delay) forwards;
    }
    :global(html:not([data-motion='reduce'])) .new .stitch.fill {
      fill-opacity: 0;
      animation:
        stitch 300ms var(--ease-enter) calc(var(--delay) + 200ms) forwards,
        fill-in 200ms var(--ease-standard) calc(var(--delay) + 420ms) forwards;
    }
    :global(html:not([data-motion='reduce'])) .new .ticks {
      opacity: 0;
      animation: fill-in 200ms var(--ease-standard) calc(var(--delay) + 380ms) forwards;
    }
  }
  @keyframes stitch {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes fill-in {
    to {
      fill-opacity: 1;
      opacity: 1;
    }
  }
</style>
