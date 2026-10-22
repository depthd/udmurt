<script lang="ts">
  /**
   * Прогресс-бар урока (отчёт 04 §3.4): пружинное заполнение, пробегающий блик при продвижении,
   * «солнечный» градиент и бейдж «N подряд!» от трёх верных ответов подряд.
   */
  let { value, max, combo = 0 }: { value: number; max: number; combo?: number } = $props();

  const p = $derived(max > 0 ? Math.min(1, Math.max(0, value / max)) : 0);
  const hot = $derived(combo >= 3);

  // Блик пробегает при каждом продвижении вперёд: перемонтируем элемент через {#key}.
  let shine = $state(0);
  let prev: number | undefined;
  $effect(() => {
    const v = value;
    if (prev !== undefined && v > prev) shine++;
    prev = v;
  });
</script>

<div class="wrap">
  <div
    class="bar"
    class:is-combo={hot}
    role="progressbar"
    aria-label="Прогресс урока"
    aria-valuemin={0}
    aria-valuemax={max}
    aria-valuenow={value}
    aria-valuetext="{value} из {max}"
    data-testid="progress"
  >
    <div class="fill" class:empty={p === 0} style:--p={p}>
      {#key shine}
        {#if shine > 0}<span class="shine" aria-hidden="true"></span>{/if}
      {/key}
    </div>
  </div>
  {#if hot}
    {#key combo}
      <span class="combo" aria-hidden="true">{combo} подряд!</span>
    {/key}
  {/if}
</div>

<style>
  .wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .bar {
    height: 16px;
    border-radius: 999px;
    background: var(--line);
    overflow: hidden;
  }
  .fill {
    position: relative;
    height: 100%;
    width: max(16px, calc(var(--p) * 100%));
    border-radius: inherit;
    background: var(--green);
    overflow: hidden;
  }
  .fill.empty {
    width: 0;
  }
  /* «глянцевая» полоска сверху */
  .fill::before {
    content: '';
    position: absolute;
    left: 8px;
    right: 8px;
    top: 3px;
    height: 4px;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.32);
  }
  .is-combo .fill {
    background: linear-gradient(90deg, var(--amber), var(--flag-red));
  }
  .shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(100deg, transparent 30%, rgb(255 255 255 / 0.6) 50%, transparent 70%);
    transform: translateX(-100%);
    opacity: 0;
  }
  .combo {
    position: absolute;
    right: 0;
    bottom: calc(100% + 4px);
    padding: 1px 8px;
    border-radius: 999px;
    font: 800 0.72rem/1.5 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--on-fill);
    background: var(--flag-red);
    white-space: nowrap;
    transform-origin: 100% 100%;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .fill {
      transition:
        width var(--spring-soft-dur) var(--spring-soft),
        background-color var(--dur-base);
    }
    :global(html:not([data-motion='reduce'])) .shine {
      opacity: 1;
      animation: shine 650ms var(--ease-standard) 120ms both;
    }
    :global(html:not([data-motion='reduce'])) .combo {
      animation: combo-pop var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
  @keyframes shine {
    to {
      transform: translateX(100%);
    }
  }
  @keyframes combo-pop {
    from {
      transform: scale(0.4) translateY(6px);
      opacity: 0;
    }
  }
</style>
