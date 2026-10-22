<script lang="ts">
  /**
   * Строка ответа + банк плиток (общая часть tiles и build).
   *
   * Нажатие на плитку в банке — она плавно перелетает в строку ответа (FLIP), а в банке
   * остаётся «тень» того же размера, чтобы банк не прыгал. Нажатие на плитку в ответе —
   * возвращается на своё место в банке. Backspace убирает последнюю плитку.
   *
   *   pieces  — плитки в порядке банка (уже перемешаны)
   *   chosen  — индексы pieces в порядке ответа ($bindable)
   *   verdict — после проверки: подсветка строки ответа
   *   variant — words (линованная строка, слова) | morphs (лоток, кубики-морфемы)
   *   notes   — подписи-значения под кубиками в ответе (после проверки)
   */
  import { sfx, haptic } from '$lib/sfx';
  import { flip } from './flip';
  import { E2E, pieceLabel, type Piece } from './logic';

  let {
    pieces,
    chosen = $bindable([]),
    locked,
    verdict = null,
    lang,
    variant = 'words',
    notes = false,
    bankTestId,
    answerTestId,
    answerLabel = 'Ваш ответ',
    bankLabel = 'Слова',
    placeholder = '',
  }: {
    pieces: Piece[];
    chosen?: number[];
    locked: boolean;
    verdict?: 'correct' | 'almost' | 'wrong' | null;
    lang: 'udm' | 'ru';
    variant?: 'words' | 'morphs';
    notes?: boolean;
    bankTestId: (i: number) => string;
    answerTestId: (i: number) => string;
    answerLabel?: string;
    bankLabel?: string;
    placeholder?: string;
  } = $props();

  let root = $state<HTMLElement>();
  const used = $derived(new Set(chosen));
  const label = (p: Piece) => (variant === 'morphs' ? pieceLabel(p) : p.text);
  const said = $derived(chosen.map((i) => label(pieces[i])).join(' '));

  function feel() {
    sfx.tap();
    haptic.tap();
  }

  /** Клавиатура: после перелёта фокус остаётся рядом, а не теряется на body. */
  function focusAfter(sel: string[]) {
    for (const s of sel) {
      const el = root?.querySelector<HTMLElement>(s);
      if (el) return el.focus({ preventScroll: true });
    }
  }

  function add(i: number, e?: MouseEvent) {
    if (locked || used.has(i)) return;
    feel();
    flip(root, () => (chosen = [...chosen, i]));
    if (e && e.detail === 0) {
      const next = pieces.findIndex((_, k) => k > i && !chosen.includes(k));
      const prev = pieces.findLastIndex((_, k) => k < i && !chosen.includes(k));
      focusAfter([`[data-bank="${next}"]`, `[data-bank="${prev}"]`, `[data-pos="${chosen.length - 1}"]`]);
    }
  }

  function remove(pos: number, e?: MouseEvent) {
    if (locked) return;
    const i = chosen[pos];
    if (i === undefined) return;
    feel();
    flip(root, () => (chosen = chosen.filter((_, k) => k !== pos)));
    if (e && e.detail === 0) focusAfter([`[data-pos="${pos}"]`, `[data-pos="${pos - 1}"]`, `[data-bank="${i}"]`]);
  }

  function onkeydown(e: KeyboardEvent) {
    if (locked || e.key !== 'Backspace' || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (!chosen.length) return;
    e.preventDefault();
    remove(chosen.length - 1);
  }
</script>

<svelte:window {onkeydown} />

<div class="board board--{variant}" bind:this={root}>
  <div
    class="answer"
    class:is-correct={verdict === 'correct'}
    class:is-almost={verdict === 'almost'}
    class:is-wrong={verdict === 'wrong'}
    class:is-empty={!chosen.length}
    role="group"
    aria-label={answerLabel}
    data-testid="answer-row"
  >
    {#each chosen as pi, pos (pieces[pi].key)}
      {@const p = pieces[pi]}
      <span class="cell" style:--i={pos}>
        <button
          type="button"
          class="piece piece--{p.kind}"
          lang={lang}
          class:udm={lang === 'udm'}
          data-flip={p.key}
          data-pos={pos}
          data-testid={answerTestId(pos)}
          data-word={E2E ? p.text : undefined}
          disabled={locked}
          aria-label="Убрать «{label(p)}»"
          onclick={(e) => remove(pos, e)}>{label(p)}</button
        >
        {#if notes}
          <span class="note" class:note--extra={p.correctAt < 0} class:note--off={p.correctAt >= 0 && p.correctAt !== pos}
            >{p.correctAt >= 0 ? p.note || '—' : 'лишняя'}</span
          >
        {/if}
      </span>
    {/each}
    {#if !chosen.length && placeholder}<span class="ph" aria-hidden="true">{placeholder}</span>{/if}
  </div>

  <div class="bank" class:is-locked={locked} role="group" aria-label={bankLabel}>
    {#each pieces as p, i (p.key)}
      <span class="slot">
        {#if used.has(i)}
          <span class="piece piece--{p.kind} shadow" lang={lang} class:udm={lang === 'udm'} aria-hidden="true">{label(p)}</span>
        {:else}
          <button
            type="button"
            class="piece piece--{p.kind}"
            lang={lang}
            class:udm={lang === 'udm'}
            data-flip={p.key}
            data-bank={i}
            data-testid={bankTestId(i)}
            data-word={E2E ? p.text : undefined}
            data-correct={E2E && p.correctAt >= 0 ? 'true' : undefined}
            data-order={E2E && p.correctAt >= 0 ? p.correctAt : undefined}
            disabled={locked}
            onclick={(e) => add(i, e)}>{label(p)}</button
          >
        {/if}
      </span>
    {/each}
  </div>

  <p class="visually-hidden" role="status" aria-live="polite">{said ? `Ответ: ${said}` : ''}</p>
</div>

<style>
  .board {
    --row: 58px;
    display: flex;
    flex-direction: column;
    gap: 28px;
    min-width: 0;
  }

  /* ─── плитка ─── */
  .piece {
    --pc: var(--line);
    --pbg: var(--surface);
    --pfg: var(--ink);
    position: relative;
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 46px;
    min-width: 44px;
    max-width: 100%;
    padding: 8px 14px;
    border: 2px solid var(--pc);
    border-radius: 12px;
    background: var(--pbg);
    color: var(--pfg);
    box-shadow: 0 3px 0 var(--pc);
    font: 600 1.1rem/1.2 var(--font-text);
    white-space: nowrap;
    overflow-wrap: anywhere;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .piece.udm {
    font-family: var(--font-head);
    font-weight: 500;
  }
  .piece:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--pc);
  }
  .piece:disabled {
    cursor: default;
  }
  .piece:global(.is-flying) {
    z-index: 3;
  }
  .shadow {
    --pc: transparent;
    background: var(--surface-2);
    color: transparent;
    box-shadow: none;
    border-color: transparent;
    cursor: default;
  }

  /* ─── строка ответа: линованная, как в тетради ─── */
  .answer {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    align-content: flex-start;
    gap: 12px 6px;
    min-height: calc(var(--row) * 2);
    padding: 4px 0 4px;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--row) - 2px),
      var(--line) calc(var(--row) - 2px) var(--row)
    );
  }
  .cell {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    max-width: 100%;
  }
  .ph {
    position: absolute;
    inset: 4px 0 auto;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 46px;
    pointer-events: none;
  }

  .answer.is-correct .piece {
    --pc: var(--green);
    --pbg: var(--green-soft);
    --pfg: var(--green);
  }
  .answer.is-almost .piece {
    --pc: var(--amber);
    --pbg: var(--amber-soft);
    --pfg: var(--amber);
  }
  .answer.is-wrong .piece {
    --pc: var(--red);
    --pbg: var(--red-soft);
    --pfg: var(--red);
  }

  /* ─── банк ─── */
  .bank {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 10px 8px;
  }
  .slot {
    display: inline-flex;
    max-width: 100%;
  }
  .bank.is-locked .piece:not(.shadow) {
    opacity: 0.55;
  }

  /* ─── морфемы: кубики и лоток ─── */
  .board--morphs .piece {
    min-width: 54px;
    min-height: 54px;
    padding: 8px 14px;
    font-size: 1.3rem;
  }
  .board--morphs .piece--suffix:not(.shadow) {
    --pc: color-mix(in srgb, var(--blue) 55%, var(--line));
    --pbg: var(--blue-soft);
    --pfg: var(--blue);
  }
  .board--morphs .piece--particle:not(.shadow) {
    --pc: color-mix(in srgb, var(--amber) 55%, var(--line));
    --pbg: var(--amber-soft);
  }
  .board--morphs .answer {
    justify-content: center;
    align-items: flex-start;
    gap: 10px 6px;
    min-height: 92px;
    padding: 16px 12px;
    border: 2px dashed var(--line-strong);
    border-radius: var(--radius);
    background: none;
  }
  .board--morphs .answer.is-correct {
    border-color: var(--green);
    border-style: solid;
  }
  .board--morphs .answer.is-wrong {
    border-color: var(--red);
    border-style: solid;
  }
  .board--morphs .ph {
    inset: 0;
    display: grid;
    place-items: center;
    line-height: 1.3;
    text-align: center;
  }
  .note {
    max-width: 9em;
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    color: var(--muted);
    white-space: normal;
  }
  .note--extra,
  .note--off {
    color: var(--red);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .piece {
      transition:
        transform 120ms var(--ease-standard),
        box-shadow 120ms var(--ease-standard),
        background-color var(--dur-fast),
        border-color var(--dur-fast),
        color var(--dur-fast),
        opacity var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .shadow {
      animation: fade-in var(--dur-fast) var(--ease-standard);
    }
    /* верно — плитки «подпрыгивают» волной слева направо */
    :global(html:not([data-motion='reduce'])) .answer.is-correct .cell,
    :global(html:not([data-motion='reduce'])) .answer.is-almost .cell {
      animation: hop 520ms var(--ease-overshoot) both;
      animation-delay: calc(var(--i) * 55ms);
    }
    :global(html:not([data-motion='reduce'])) .answer.is-wrong {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .note {
      animation: rise var(--dur-slow) var(--ease-enter) both;
      animation-delay: calc(120ms + var(--i) * 80ms);
    }
  }
  @keyframes hop {
    0%,
    100% {
      transform: none;
    }
    35% {
      transform: translateY(-8px) scale(1.04);
    }
    65% {
      transform: translateY(1px);
    }
  }
</style>
