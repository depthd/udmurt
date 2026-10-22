<script lang="ts">
  /**
   * Fill — вставить пропуск: предложение с «ячейкой» ___, варианты-чипы ниже.
   * Выбранный вариант «впрыгивает» в пропуск (FLIP), повторное нажатие на него — возвращает.
   * Если пропуск приклеен к слову (Ижкар___), это окончание: чипы показываются с дефисом (-ысь),
   * а в предложении окончание прирастает к основе.
   * Оценка SRS (если есть item): верно — 3, неверно — 1. Клавиши 1–9 выбирают вариант.
   */
  import type { Exercise } from '$lib/content/schema';
  import type { AnswerResult, ExerciseProps } from './types';
  import { seededShuffle } from './types';
  import { lexicon, personalize } from '$lib/course';
  import { normalize } from '$lib/answer';
  import { sfx, haptic } from '$lib/sfx';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import { flip } from '../components/exercise2/flip';
  import { E2E, digitIndex, fillParts, fillSentence } from '../components/exercise2/logic';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'fill' }>> = $props();

  const parts = $derived(fillParts(personalize(ex.text)));
  const answer = $derived(personalize(ex.answer));
  const options = $derived(
    seededShuffle(
      ex.options.map((o) => personalize(o)),
      `${ex.id ?? ''}|fill|${ex.text}`,
    ),
  );
  const isRight = (o: string) => normalize(o) === normalize(answer);
  const label = (o: string) => (parts.suffix ? `-${o}` : o);

  let picked = $state<number | null>(null);
  let verdict = $state<boolean | null>(null);
  let root = $state<HTMLElement>();

  function choose(i: number) {
    if (locked) return;
    sfx.tap();
    haptic.tap();
    flip(root, () => (picked = picked === i ? null : i), { lift: true });
  }

  function clear() {
    if (locked || picked === null) return;
    sfx.tap();
    haptic.tap();
    flip(root, () => (picked = null));
  }

  function check(): AnswerResult {
    const ok = picked !== null && isRight(options[picked]);
    verdict = ok;
    const full = fillSentence(personalize(ex.text), answer);
    return {
      correct: ok,
      expected: full,
      meaning: `${full} — ${personalize(ex.ru)}`,
      grades: ex.item && lexicon.has(ex.item) ? { [ex.item]: ok ? 3 : 1 } : {},
    };
  }

  $effect(() => api.setReady(picked !== null));
  $effect(() => api.setChecker(check));

  function onkeydown(e: KeyboardEvent) {
    if (locked) return;
    const i = digitIndex(e);
    if (i < 0 || i >= options.length) return;
    e.preventDefault();
    choose(i);
  }
</script>

<svelte:window {onkeydown} />

<div class="fill" bind:this={root}>
  <PromptBubble big>
    <p class="sentence udm" lang="udm" data-testid="fill-sentence">
      {#if parts.before.trim()}<span>{parts.before}</span>{/if}<span
        class="gap"
        class:suffix={parts.suffix}
        class:filled={picked !== null}
        class:ok={locked && verdict === true}
        class:bad={locked && verdict === false}
        >{#if picked !== null}<button
            type="button"
            class="word"
            data-flip="o{picked}"
            data-testid="fill-gap"
            disabled={locked}
            aria-label="Убрать «{options[picked]}» из пропуска"
            onclick={clear}>{options[picked]}</button
          >{:else}<span class="blank"><span class="visually-hidden">пропуск</span></span>{/if}</span
      >{#if parts.after}<span>{parts.after}</span>{/if}
    </p>
    <p class="ru" lang="ru">{personalize(ex.ru)}</p>
  </PromptBubble>

  <div class="opts" role="group" aria-label={parts.suffix ? 'Варианты окончания' : 'Варианты'}>
    {#each options as o, i (o + i)}
      {@const sel = picked === i}
      <span class="slot">
        {#if sel && !locked}
          <span class="opt shadow" class:sfx={parts.suffix} aria-hidden="true">{label(o)}</span>
        {:else}
          <button
            type="button"
            class="opt udm"
            class:sfx={parts.suffix}
            class:is-correct={locked && isRight(o)}
            class:is-wrong={locked && sel && !isRight(o)}
            class:is-dim={locked && !sel && !isRight(o)}
            lang="udm"
            data-flip={sel ? undefined : `o${i}`}
            data-testid="fill-option-{i}"
            data-correct={E2E && isRight(o) ? 'true' : undefined}
            disabled={locked}
            aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
            onclick={() => choose(i)}>{label(o)}</button
          >
        {/if}
      </span>
    {/each}
  </div>
</div>

<style>
  .fill {
    display: flex;
    flex-direction: column;
    gap: 32px;
    min-width: 0;
  }
  .sentence {
    margin: 0;
    line-height: 1.9;
  }
  .ru {
    margin: 6px 0 0;
    font: 500 0.95rem/1.4 var(--font-text);
    color: var(--muted);
  }

  /* ─── ячейка-пропуск ─── */
  .gap {
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
    min-width: 2.6em;
    height: 1.55em;
    margin: 0 0.12em;
    vertical-align: -0.38em;
    border-bottom: 3px solid var(--line-strong);
    border-radius: 6px 6px 0 0;
    background: var(--surface-2);
  }
  .gap.suffix {
    min-width: 2em;
    margin-left: 0.04em;
  }
  .gap.filled {
    background: transparent;
    border-bottom-color: transparent;
  }
  .blank {
    display: block;
    width: 100%;
  }
  .word {
    --wc: var(--focus);
    --wbg: var(--blue-soft);
    appearance: none;
    position: relative;
    height: 100%;
    padding: 0 0.3em;
    border: 2px solid var(--wc);
    border-radius: 10px;
    background: var(--wbg);
    color: var(--ink);
    box-shadow: 0 3px 0 var(--wc);
    font: inherit;
    line-height: 1;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .suffix .word {
    color: var(--blue);
  }
  .ok .word {
    --wc: var(--green);
    --wbg: var(--green-soft);
    color: var(--green);
  }
  .bad .word {
    --wc: var(--red);
    --wbg: var(--red-soft);
    color: var(--red);
    text-decoration: line-through;
    text-decoration-thickness: 2px;
  }
  .word:disabled {
    cursor: default;
  }

  /* ─── варианты ─── */
  .opts {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px 10px;
  }
  .slot {
    display: inline-flex;
  }
  .opt {
    --oc: var(--line);
    --obg: var(--surface);
    --ofg: var(--ink);
    appearance: none;
    position: relative;
    min-width: 72px;
    min-height: 52px;
    padding: 10px 18px;
    border: 2px solid var(--oc);
    border-radius: 14px;
    background: var(--obg);
    color: var(--ofg);
    box-shadow: 0 4px 0 var(--oc);
    font: 500 1.25rem/1.1 var(--font-head);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .opt.sfx:not(.shadow) {
    --ofg: var(--blue);
  }
  .opt:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--oc);
  }
  .opt:disabled {
    cursor: default;
  }
  .opt.is-correct {
    --oc: var(--green);
    --obg: var(--green-soft);
    --ofg: var(--green);
  }
  .opt.is-wrong {
    --oc: var(--red);
    --obg: var(--red-soft);
    --ofg: var(--red);
  }
  .opt.is-dim {
    opacity: 0.5;
  }
  .shadow {
    border-color: transparent;
    background: var(--surface-2);
    color: transparent;
    box-shadow: none;
    cursor: default;
  }
  .fill :global(.is-flying) {
    z-index: 3;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .opt,
    :global(html:not([data-motion='reduce'])) .word {
      transition:
        transform 120ms var(--ease-standard),
        box-shadow 120ms var(--ease-standard),
        background-color var(--dur-fast),
        border-color var(--dur-fast),
        color var(--dur-fast),
        opacity var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .ok .word {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .bad .word {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .opt.is-correct {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .shadow {
      animation: fade-in var(--dur-fast) var(--ease-standard);
    }
  }
</style>
