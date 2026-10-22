<script lang="ts">
  /**
   * Всплывашка под узлом: название урока, цель и «Начать»/«Повторить».
   * Для закрытого узла — мягкая подсказка, без кнопки. Стрелка указывает на узел.
   */
  import { onMount } from 'svelte';
  import { personalize, type LessonRef } from '$lib/course';
  import { progress } from '$lib/progress.svelte';
  import { router } from '$lib/router.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { prefs } from '$lib/prefs.svelte';
  import { plural, splitTitle } from './geometry';
  import type { NodeState } from './LessonNode.svelte';

  let {
    ref,
    state: nodeState,
    id,
    top,
    x,
    total,
    onclose,
  }: {
    ref: LessonRef;
    state: NodeState;
    id: string;
    /** Верх всплывашки внутри колонки пути, px. */
    top: number;
    /** Смещение узла от центральной оси, px (для стрелки). */
    x: number;
    /** Уроков в юните. */
    total: number;
    onclose: (refocus: boolean) => void;
  } = $props();

  let box: HTMLDivElement | undefined = $state();
  let primary: HTMLButtonElement | undefined = $state();

  const title = $derived(splitTitle(ref.lesson.title));
  const st = $derived(progress.lesson(ref.lesson.id));
  const locked = $derived(nodeState === 'locked');
  const done = $derived(nodeState === 'done' || nodeState === 'perfect');
  const eyebrow = $derived(
    ref.lesson.kind === 'story'
      ? 'История'
      : ref.lesson.kind === 'review'
        ? 'Повторение'
        : ref.lesson.kind === 'checkpoint'
          ? 'Контрольная'
          : `Урок ${ref.lessonIndex + 1} из ${total}`,
  );

  onMount(() => {
    // Фокус — на главную кнопку (клавиатура/скринридер сразу у цели), всплывашка — в видимую область.
    (primary ?? box)?.focus({ preventScroll: true });
    box?.scrollIntoView({ block: 'nearest', behavior: prefs.reduceMotion ? 'auto' : 'smooth' });
  });

  function start() {
    sfx.tap();
    haptic.tap();
    router.go('/lesson/' + ref.lesson.id, 'lesson');
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onclose(true);
    }
  }
</script>

<div
  bind:this={box}
  {id}
  class="pop"
  class:pop--locked={locked}
  style:top="{top}px"
  style:--ax="{x}px"
  role="dialog"
  aria-labelledby="{id}-title"
  tabindex="-1"
  data-testid="start-popover"
  {onkeydown}
>
  <span class="arrow" aria-hidden="true"></span>
  <div class="row">
    <p class="eyebrow">{eyebrow}</p>
    {#if !locked}
      <span class="xp">{done ? 'до +10 XP' : 'до +20 XP'}</span>
    {/if}
  </div>
  <h3 id="{id}-title" class="title">
    {#if title.prefix}<span class="prefix">{title.prefix}</span>{/if}<span lang="udm" class="udm">{title.udm}</span>
  </h3>
  <p class="goal">{personalize(ref.lesson.goal)}</p>

  {#if locked}
    <p class="hint" role="status" data-testid="locked-hint">
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
        <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
        <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
      </svg>
      Сначала пройдите предыдущий урок
    </p>
  {:else}
    {#if done && st}
      <p class="meta">
        <span class="ok" aria-hidden="true">✓</span>
        Пройден{st.done > 1 ? ` ${st.done} ${plural(st.done, ['раз', 'раза', 'раз'])}` : ''} · лучший результат {Math.round(st.best * 100)} %
      </p>
    {/if}
    <button bind:this={primary} type="button" class="btn btn--block" data-testid="start-lesson" onclick={start}>
      {done ? 'Повторить' : 'Начать'}
    </button>
  {/if}
</div>

<style>
  .pop {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 5;
    margin: 0 auto;
    width: min(100%, 360px);
    padding: 16px 18px 18px;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius-l);
    box-shadow: 0 4px 0 var(--line), var(--shadow);
    text-align: left;
    outline: none;
    transform-origin: calc(50% + var(--ax)) -12px;
  }
  .arrow {
    position: absolute;
    top: -10px;
    left: calc(50% + var(--ax));
    width: 18px;
    height: 18px;
    background: var(--surface);
    border-left: 2px solid var(--line);
    border-top: 2px solid var(--line);
    border-radius: 4px 0 0 0;
    transform: translateX(-50%) rotate(45deg);
  }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .eyebrow {
    margin: 0;
    font: 700 0.75rem/1.2 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--red);
  }
  .pop--locked .eyebrow {
    color: var(--muted);
  }
  .xp {
    font: 700 0.75rem/1 var(--font-head);
    color: var(--amber);
    background: var(--amber-soft);
    padding: 5px 8px;
    border-radius: 999px;
    white-space: nowrap;
  }
  .title {
    margin: 0 0 4px;
    font-size: 1.3rem;
    font-weight: 700;
    overflow-wrap: anywhere;
  }
  .prefix {
    font-weight: 500;
    color: var(--muted);
  }
  .title .udm {
    font-weight: 700;
  }
  .goal {
    margin: 0 0 14px;
    color: var(--muted);
    line-height: 1.4;
  }
  .meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: -4px 0 14px;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink);
  }
  .ok {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--green-soft);
    color: var(--green);
    font-weight: 800;
    font-size: 0.8rem;
  }
  .hint {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--ink);
    font-weight: 600;
    line-height: 1.3;
  }
  .hint svg {
    flex: none;
    fill: none;
    stroke: var(--muted);
    stroke-width: 1.8;
    stroke-linecap: round;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .pop {
      animation: pop-in var(--spring-snappy-dur) var(--spring-snappy) both;
    }
  }
  @keyframes pop-in {
    from {
      opacity: 0;
      transform: translateY(-6px) scale(0.94);
    }
  }
</style>
