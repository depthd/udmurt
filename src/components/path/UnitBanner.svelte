<script lang="ts">
  /** Баннер юнита на пути: номер, название (рус. + удм.), описание, прогресс и кнопка «Шпаргалка». */
  import type { Unit } from '$lib/content/schema';
  import { personalize } from '$lib/course';
  import Octagram from '../Octagram.svelte';

  let {
    unit,
    index,
    done,
    total,
    locked = false,
    onguide,
  }: {
    unit: Unit;
    index: number;
    done: number;
    total: number;
    locked?: boolean;
    onguide?: (unit: Unit, opener: HTMLButtonElement) => void;
  } = $props();

  const complete = $derived(done >= total);
</script>

<header class="banner" class:banner--locked={locked} aria-labelledby="unit-{unit.id}-title">
  <div class="text">
    <p class="eyebrow">
      Юнит {index + 1}
      <span class="dot" aria-hidden="true">·</span>
      {#if complete}<Octagram size={13} color="currentColor" />{/if}
      <span class="count">{complete ? 'пройден' : `${done} из ${total}`}</span>
    </p>
    <h2 id="unit-{unit.id}-title" class="title">
      {unit.title}
      {#if unit.title_udm}
        <span class="udm-title udm" lang="udm">{unit.title_udm}</span>
      {/if}
    </h2>
    <p class="desc">{personalize(unit.description)}</p>
  </div>
  {#if unit.guide}
    <button
      type="button"
      class="guide-btn"
      data-testid="guide-{unit.id}"
      aria-haspopup="dialog"
      onclick={(e) => onguide?.(unit, e.currentTarget)}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5z" />
        <path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" />
      </svg>
      <span>Шпаргалка</span>
    </button>
  {/if}
  <div class="bar" aria-hidden="true"><span style:width="{total ? (done / total) * 100 : 0}%"></span></div>
</header>

<style>
  .banner {
    position: relative;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: start;
    gap: 12px 14px;
    padding: 18px 18px 22px;
    border-radius: var(--radius-l);
    background: var(--red);
    color: var(--on-fill);
    box-shadow: 0 5px 0 var(--red-edge);
    overflow: hidden;
  }
  /* Тонкий «стежок» по краю — как кайма на холсте. */
  .banner::before {
    content: '';
    position: absolute;
    inset: 6px;
    border-radius: calc(var(--radius-l) - 5px);
    border: 1.5px dashed color-mix(in srgb, var(--on-fill) 32%, transparent);
    pointer-events: none;
  }
  .banner--locked {
    background: var(--surface-2);
    color: var(--ink);
    box-shadow: 0 5px 0 var(--line);
  }
  .banner--locked::before {
    border-color: var(--line-strong);
  }
  .text {
    min-width: 0;
  }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 6px;
    font: 700 0.78rem/1.2 var(--font-head);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    opacity: 0.88;
  }
  .dot {
    margin: 0 -2px;
  }
  .count {
    letter-spacing: 0.04em;
  }
  .title {
    margin: 0 0 6px;
    font-size: 1.45rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .udm-title {
    display: block;
    margin-top: 2px;
    font-size: 1rem;
    font-weight: 500;
    opacity: 0.9;
  }
  .desc {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.4;
    opacity: 0.94;
  }
  .guide-btn {
    position: relative;
    z-index: 1;
    appearance: none;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    min-width: 64px;
    min-height: 64px;
    padding: 8px 8px 6px;
    border-radius: var(--radius);
    border: 2px solid color-mix(in srgb, var(--on-fill) 45%, transparent);
    background: color-mix(in srgb, var(--on-fill) 12%, transparent);
    color: inherit;
    font: 700 0.68rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    box-shadow: 0 3px 0 color-mix(in srgb, var(--red-edge) 80%, transparent);
    -webkit-tap-highlight-color: transparent;
  }
  .guide-btn:hover {
    background: color-mix(in srgb, var(--on-fill) 20%, transparent);
  }
  .guide-btn:active {
    transform: translateY(3px);
    box-shadow: none;
  }
  .guide-btn:focus-visible {
    outline-color: var(--on-fill);
  }
  .banner--locked .guide-btn {
    border-color: var(--line-strong);
    background: var(--surface);
    box-shadow: 0 3px 0 var(--line);
  }
  .guide-btn svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linejoin: round;
  }
  .bar {
    grid-column: 1 / -1;
    height: 8px;
    border-radius: 99px;
    background: color-mix(in srgb, var(--on-fill) 22%, transparent);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--on-fill);
  }
  .banner--locked .bar {
    background: var(--line);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .bar span {
      transition: width var(--dur-slow) var(--ease-enter);
    }
    :global(html:not([data-motion='reduce'])) .guide-btn {
      transition:
        transform 400ms var(--ease-release),
        box-shadow 400ms var(--ease-release),
        background-color 150ms;
    }
    :global(html:not([data-motion='reduce'])) .guide-btn:active {
      transition-duration: 34ms;
    }
  }
</style>
