<script lang="ts">
  /** Кольцо дневной цели: SVG-круг заполняется от 0 до xpToday/dailyGoal при появлении. */
  import { onMount } from 'svelte';

  let { value, goal, size = 96 }: { value: number; goal: number; size?: number } = $props();

  const p = $derived(goal > 0 ? Math.min(1, value / goal) : 0);
  const reached = $derived(goal > 0 && value >= goal);
  let shown = $state(0);
  onMount(() => {
    // Двойной кадр: сначала отрисовать пустое кольцо, потом запустить переход к цели.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => (shown = 1)));
    return () => cancelAnimationFrame(id);
  });
  const offset = $derived(1 - p * shown);
</script>

<div
  class="ring"
  class:reached
  style:width="{size}px"
  style:height="{size}px"
  role="img"
  aria-label="Цель дня: {value} из {goal} XP{reached ? ', выполнена' : ''}"
  data-testid="goal-ring"
>
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
    <circle class="track" cx="50" cy="50" r="42" />
    <circle class="fill" cx="50" cy="50" r="42" pathLength="1" style:stroke-dashoffset={offset} style:opacity={offset < 1 ? 1 : 0} />
  </svg>
  <div class="center" aria-hidden="true">
    {#if reached}
      <svg class="check" viewBox="0 0 24 24" width="30" height="30"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
    {:else}
      <span class="v">{value}</span>
      <span class="g">из {goal}</span>
    {/if}
  </div>
</div>

<style>
  .ring {
    position: relative;
    flex: none;
  }
  svg {
    display: block;
    transform: rotate(-90deg);
  }
  circle {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
  }
  .track {
    stroke: var(--surface-2);
  }
  .fill {
    stroke: var(--amber);
    stroke-dasharray: 1;
  }
  .reached .fill {
    stroke: var(--green);
  }
  .center {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;
    line-height: 1;
  }
  .v {
    font: 700 1.5rem/1 var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .g {
    margin-top: 3px;
    font: 600 0.72rem/1 var(--font-head);
    color: var(--muted);
  }
  .check {
    transform: none;
    fill: none;
    stroke: var(--green);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .fill {
      transition: stroke-dashoffset 1100ms var(--ease-enter) 200ms;
    }
    :global(html:not([data-motion='reduce'])) .reached .check {
      animation: pop var(--spring-pop-dur) var(--spring-pop) 900ms both;
    }
  }
</style>
