<script lang="ts">
  /**
   * Узел пути: круглая «объёмная» кнопка 72px (рецепт кнопки — отчёт 04 §3.2, узла — §3.6).
   * Состояния: done (красный, ✓), perfect (золотой, ✓), current (кольцо + «Начать»), locked (серый, замок).
   */
  import type { LessonRef } from '$lib/course';
  import { lessonIcon, splitTitle } from './geometry';

  export type NodeState = 'done' | 'perfect' | 'current' | 'locked';

  let {
    ref,
    state: nodeState,
    expanded = false,
    popId,
    justUnlocked = false,
    onselect,
  }: {
    ref: LessonRef;
    state: NodeState;
    expanded?: boolean;
    popId: string;
    justUnlocked?: boolean;
    onselect: (ref: LessonRef, el: HTMLButtonElement) => void;
  } = $props();

  let el: HTMLButtonElement | undefined = $state();

  const icon = $derived(lessonIcon(ref.lesson.icon, ref.lesson.kind));
  const title = $derived(splitTitle(ref.lesson.title));
  const kindLabel = $derived(
    ({ story: 'История', review: 'Повторение', checkpoint: 'Контрольная' } as Record<string, string>)[ref.lesson.kind] ?? 'Урок',
  );
  const stateLabel = $derived(
    { done: 'пройден', perfect: 'пройден без ошибок', current: 'текущий, можно начать', locked: 'закрыт' }[nodeState],
  );
</script>

<div class="slot" class:is-current={nodeState === 'current'}>
  {#if nodeState === 'current'}
    <span class="start-tag" aria-hidden="true">Начать</span>
  {/if}
  <button
    bind:this={el}
    type="button"
    class="node node--{nodeState}"
    class:just-unlocked={justUnlocked}
    data-testid="node-{ref.lesson.id}"
    data-state={nodeState}
    data-current={nodeState === 'current' ? 'true' : undefined}
    aria-expanded={expanded}
    aria-controls={expanded ? popId : undefined}
    onclick={() => el && onselect(ref, el)}
  >
    <span class="visually-hidden">
      <!-- у историй и повторений тип уже есть в названии («История: …») — не повторяем его -->
      {#if title.prefix}{title.prefix}{:else}{kindLabel}{ref.lesson.kind === 'lesson' ? ` ${ref.lessonIndex + 1}` : ''}: {/if}<span lang="udm">{title.udm}</span> — {stateLabel}
    </span>
    <span class="icon" aria-hidden="true">{icon}</span>
    {#if nodeState === 'done' || nodeState === 'perfect'}
      <span class="badge badge--done" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12"><path d="M3.5 8.5l3 3 6-7" /></svg>
      </span>
    {:else if nodeState === 'locked'}
      <span class="badge badge--lock" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="12" height="12">
          <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
          <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
        </svg>
      </span>
    {/if}
  </button>
</div>

<style>
  .slot {
    position: relative;
    width: 72px;
    height: 72px;
  }
  .node {
    --face: var(--red);
    --edge: var(--red-edge);
    --depth: 6px;
    position: relative;
    appearance: none;
    border: 0;
    padding: 0;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    cursor: pointer;
    background: var(--face);
    box-shadow:
      0 var(--depth) 0 var(--edge),
      inset 0 -3px 0 color-mix(in srgb, var(--edge) 35%, transparent);
    transform: translateY(0);
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }
  .node:focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 6px;
    border-radius: 50%;
  }
  .node:hover {
    filter: brightness(1.06);
  }
  .node:active {
    transform: translateY(var(--depth));
    box-shadow: 0 0 0 var(--edge);
  }
  .node[aria-expanded='true'] {
    filter: brightness(1.04);
  }
  .icon {
    font-size: 30px;
    line-height: 1;
    /* Эмодзи без системной «подложки»: ровно по центру лица кнопки. */
    transform: translateY(-1px);
  }
  .node--perfect {
    --face: var(--amber);
    --edge: var(--amber-edge);
  }
  .node--locked {
    --face: var(--line);
    --edge: var(--line-strong);
    cursor: pointer;
  }
  .node--locked .icon {
    filter: grayscale(1);
    opacity: 0.45;
  }

  /* Кольцо вокруг текущего узла видно всегда — это состояние, а не украшение. */
  .node--current::before {
    content: '';
    position: absolute;
    inset: -9px -9px calc(-9px - var(--depth));
    border-radius: 999px;
    border: 4px solid color-mix(in srgb, var(--red) 28%, transparent);
    pointer-events: none;
  }

  .badge {
    position: absolute;
    right: -2px;
    bottom: -2px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--surface);
    border: 2.5px solid var(--face);
    box-shadow: 0 2px 0 var(--edge);
  }
  .badge svg {
    fill: none;
    stroke: var(--face);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .badge--lock {
    border-color: var(--line-strong);
    box-shadow: none;
  }
  .badge--lock svg {
    stroke: var(--muted);
    stroke-width: 1.8;
  }

  .start-tag {
    position: absolute;
    left: 50%;
    bottom: calc(100% + 14px);
    transform: translateX(-50%);
    padding: 7px 12px 6px;
    border-radius: 12px;
    background: var(--surface);
    border: 2px solid var(--line);
    color: var(--red);
    font: 700 0.78rem/1 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 3px 0 var(--line);
    pointer-events: none;
  }
  .start-tag::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 100%;
    width: 10px;
    height: 10px;
    background: var(--surface);
    border-right: 2px solid var(--line);
    border-bottom: 2px solid var(--line);
    transform: translate(-50%, -5px) rotate(45deg);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .node {
      transition:
        transform 600ms var(--ease-release),
        box-shadow 600ms var(--ease-release),
        filter 150ms;
    }
    :global(html:not([data-motion='reduce'])) .node:hover {
      transform: translateY(-2px);
      box-shadow:
        0 calc(var(--depth) + 2px) 0 var(--edge),
        inset 0 -3px 0 color-mix(in srgb, var(--edge) 35%, transparent);
      transition-duration: 250ms;
      transition-timing-function: var(--ease-overshoot);
    }
    :global(html:not([data-motion='reduce'])) .node:active {
      transform: translateY(var(--depth));
      box-shadow: 0 0 0 var(--edge);
      transition-duration: 34ms;
    }
    :global(html:not([data-motion='reduce'])) .node--current::after {
      content: '';
      position: absolute;
      inset: -9px -9px calc(-9px - var(--depth));
      border-radius: 999px;
      border: 3px solid var(--red);
      pointer-events: none;
      animation: ring 2s var(--ease-standard) infinite;
    }
    :global(html:not([data-motion='reduce'])) .just-unlocked {
      animation: node-pop var(--spring-pop-dur) var(--spring-pop) 1150ms both;
    }
    :global(html:not([data-motion='reduce'])) .is-current .start-tag {
      animation: bob 2.4s ease-in-out infinite;
    }
  }
  @keyframes ring {
    from {
      transform: scale(0.92);
      opacity: 0.85;
    }
    to {
      transform: scale(1.28);
      opacity: 0;
    }
  }
  @keyframes node-pop {
    0% {
      transform: scale(0.86);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes bob {
    0%,
    100% {
      transform: translate(-50%, 0);
    }
    50% {
      transform: translate(-50%, -5px);
    }
  }
</style>
