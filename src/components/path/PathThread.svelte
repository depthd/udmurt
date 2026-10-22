<script lang="ts">
  /**
   * «Нить» пути (отчёт 04 §3.6): вся кривая — пунктирный «стежок», пройденная часть — красная нить.
   * Новый отрезок (от того, что ученик видел в прошлый раз, до текущего узла) прорисовывается
   * через stroke-dashoffset. Декоративная: aria-hidden, узлы — отдельные кнопки поверх.
   */
  import { NODE, smoothPath, type Pt } from './geometry';

  let {
    points,
    height,
    amp,
    doneTo,
    seenTo = doneTo,
    animate = false,
  }: {
    /** Точки кривой: старт, узлы, финиш. */
    points: Pt[];
    height: number;
    amp: number;
    /** Индекс точки, до которой дошла нить (0 — нити нет). */
    doneTo: number;
    /** Докуда нить была видна раньше: отрезок seenTo→doneTo прорисуется. */
    seenTo?: number;
    animate?: boolean;
  } = $props();

  const width = $derived(2 * (amp + NODE / 2 + 12));
  const all = $derived(smoothPath(points));
  const from = $derived(Math.min(seenTo, doneTo));
  const old = $derived(smoothPath(points, 0, from));
  const fresh = $derived(smoothPath(points, from, doneTo));
</script>

<svg
  class="thread"
  width={width}
  height={height}
  viewBox="{-width / 2} 0 {width} {height}"
  aria-hidden="true"
  focusable="false"
>
  <path class="todo" d={all} />
  {#if old}
    <path class="done" d={old} />
    <path class="twist" d={old} />
  {/if}
  {#if fresh}
    <path class="done" class:grow={animate} d={fresh} pathLength="1" />
    <path class="twist" class:grow-twist={animate} d={fresh} />
  {/if}
</svg>

<style>
  .thread {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    overflow: visible;
    pointer-events: none;
    max-width: none;
  }
  path {
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .todo {
    stroke: var(--line-strong);
    stroke-width: 6;
    stroke-dasharray: 10 12;
  }
  .done {
    stroke: var(--red);
    stroke-width: 7;
  }
  /* Блик-«скрутка» нити: тонкий светлый пунктир поверх красного. */
  .twist {
    stroke: color-mix(in srgb, var(--red) 55%, var(--surface));
    stroke-width: 2;
    stroke-dasharray: 3 9;
    opacity: 0.9;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .grow {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: draw 900ms var(--ease-enter) 350ms forwards;
    }
    :global(html:not([data-motion='reduce'])) .grow-twist {
      opacity: 0;
      animation: twist-in 300ms var(--ease-standard) 1150ms forwards;
    }
  }
  @keyframes draw {
    to {
      stroke-dashoffset: 0;
    }
  }
  @keyframes twist-in {
    to {
      opacity: 0.9;
    }
  }
</style>
