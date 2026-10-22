<script lang="ts">
  /**
   * Варианты ответа для choice / listen: плитки со номером клавиши (1–9, 0) или карточки-картинки.
   * Выбор — синяя рамка и «тук»; после проверки (locked) правильный зеленеет с ✓,
   * выбранный неверный краснеет с ✗ и трясётся, остальные притухают.
   */
  import { sfx, haptic } from '$lib/sfx';
  import { E2E, isChoiceKey, keyIndex, keyLabel, type Option } from './options';

  let {
    options,
    selected,
    correctId,
    locked,
    pictures = false,
    onselect,
    label = 'Варианты ответа',
  }: {
    options: Option[];
    selected: string | null;
    correctId: string;
    locked: boolean;
    pictures?: boolean;
    onselect: (id: string) => void;
    label?: string;
  } = $props();

  const cols = $derived(options.length === 3 || options.length >= 5 ? 3 : 2);
  const withPics = $derived(pictures && options.some((o) => o.emoji));

  function pick(id: string) {
    if (locked) return;
    sfx.tap();
    haptic.tap();
    onselect(id);
  }

  function onkeydown(e: KeyboardEvent) {
    if (locked || !isChoiceKey(e)) return;
    const o = options[keyIndex(e.key)];
    if (!o) return;
    e.preventDefault();
    pick(o.id);
  }
</script>

<svelte:window {onkeydown} />

<div class="opts" class:pics={withPics} style:--cols={cols} role="group" aria-label={label}>
  {#each options as o, i (o.id)}
    {@const isSel = selected === o.id}
    {@const isRight = o.id === correctId}
    {@const k = keyLabel(i)}
    <button
      type="button"
      class="tile opt"
      class:is-selected={isSel && !locked}
      class:is-correct={locked && isRight}
      class:is-wrong={locked && isSel && !isRight}
      class:is-dim={locked && !isRight && !isSel}
      aria-pressed={isSel}
      aria-keyshortcuts={k}
      disabled={locked}
      data-testid="option-{i}"
      data-correct={E2E && isRight ? 'true' : undefined}
      onclick={() => pick(o.id)}
    >
      {#if k}<span class="key" aria-hidden="true">{k}</span>{/if}
      {#if withPics}<span class="emo" aria-hidden="true">{o.emoji ?? '❔'}</span>{/if}
      <span class="txt" class:udm={o.lang === 'udm'} lang={o.lang === 'udm' ? 'udm' : undefined}>{o.text}</span>
      {#if locked && isRight}
        <span class="mark mark--ok" aria-hidden="true">✓</span><span class="visually-hidden">— правильный ответ</span>
      {:else if locked && isSel}
        <span class="mark mark--bad" aria-hidden="true">✗</span><span class="visually-hidden">— ваш ответ, неверно</span>
      {/if}
    </button>
  {/each}
</div>

<style>
  .opts {
    display: grid;
    gap: 12px;
  }
  .opt {
    position: relative;
    min-height: 58px;
    color: var(--ink);
  }
  .txt {
    flex: 1 1 auto;
    min-width: 0;
    font: 600 1.06rem/1.3 var(--font-text);
    overflow-wrap: anywhere;
  }
  .txt.udm {
    font-family: var(--font-head);
    font-weight: 500;
    font-size: 1.12rem;
  }
  .key {
    flex: none;
  }
  .is-selected .key {
    border-color: var(--focus);
    color: var(--focus);
  }
  .is-correct .key {
    border-color: var(--green);
    color: var(--green);
  }
  .is-wrong .key {
    border-color: var(--red);
    color: var(--red);
  }
  .is-dim {
    opacity: 0.55;
  }
  .mark {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    color: var(--on-fill);
    font: 800 0.9rem/1 var(--font-head);
  }
  .mark--ok {
    background: var(--green);
  }
  .mark--bad {
    background: var(--red);
  }
  .is-correct .txt {
    color: var(--green);
  }
  .is-wrong .txt {
    color: var(--red);
  }

  /* ── картинки: карточки в сетке ── */
  .pics {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  }
  .pics .opt {
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    min-height: 148px;
    padding: 22px 8px 16px;
    text-align: center;
  }
  .pics .key {
    position: absolute;
    top: 8px;
    left: 8px;
    min-width: 24px;
    height: 24px;
  }
  .pics .mark {
    position: absolute;
    top: 8px;
    right: 8px;
  }
  .emo {
    font-size: clamp(2.6rem, 2rem + 3vw, 3.4rem);
    line-height: 1;
  }
  .pics .txt {
    flex: none;
    font-size: 0.98rem;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .opt {
      animation: opt-in var(--dur-slow) var(--ease-enter) both;
      animation-delay: calc(120ms + var(--d, 0ms));
    }
    :global(html:not([data-motion='reduce'])) .opt:nth-child(2) {
      --d: 50ms;
    }
    :global(html:not([data-motion='reduce'])) .opt:nth-child(3) {
      --d: 100ms;
    }
    :global(html:not([data-motion='reduce'])) .opt:nth-child(4) {
      --d: 150ms;
    }
    :global(html:not([data-motion='reduce'])) .opt:nth-child(n + 5) {
      --d: 200ms;
    }
    /* после проверки — пружинка/тряска из app.css (они перекрывают вход) */
    :global(html:not([data-motion='reduce'])) .opt.is-correct {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .opt.is-wrong {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .opt.is-dim {
      animation: none;
      transition: opacity var(--dur-base) var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .is-selected .emo {
      animation: emo-bounce var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .mark {
      animation: mark-in var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
  @keyframes opt-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @keyframes emo-bounce {
    from {
      transform: scale(0.8);
    }
  }
  @keyframes mark-in {
    from {
      transform: scale(0);
    }
  }
</style>
