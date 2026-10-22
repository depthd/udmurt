<script lang="ts">
  /**
   * Плашка обратной связи снизу (отчёт 04 §2.4, §3.3): верно — зелёная, почти — янтарная,
   * неверно — красная с правильным ответом. Кнопка «Продолжить» получает фокус при появлении.
   */
  import type { Morpheme } from '$lib/content/schema';
  import type { Outcome } from '$lib/lesson';

  let {
    kind,
    title,
    expected = '',
    meaning,
    note,
    explain,
    lang,
    morphemes = [],
    oncontinue,
    reportUrl,
  }: {
    kind: Outcome;
    title: string;
    expected?: string;
    meaning?: string;
    note?: string;
    explain?: string;
    /** Язык правильного ответа (для lang="udm"). */
    lang?: 'udm' | 'ru';
    morphemes?: Morpheme[];
    oncontinue: () => void;
    reportUrl?: string;
  } = $props();

  let btn = $state<HTMLButtonElement>();
  $effect(() => {
    btn?.focus({ preventScroll: true });
  });

  const showMeaning = $derived(!!meaning && meaning.trim() !== expected.trim());
</script>

<section class="sheet is-{kind}" data-testid="feedback" data-kind={kind} aria-labelledby="fb-title">
  <div class="inner">
    <div class="msg">
      <div class="head">
        <span class="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            {#if kind === 'correct'}
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            {:else if kind === 'almost'}
              <path d="M12 6v7.5M12 18v.01" />
            {:else}
              <path d="M7 7l10 10M17 7L7 17" />
            {/if}
          </svg>
        </span>
        <h2 id="fb-title">{title}</h2>
      </div>

      {#if kind === 'correct'}
        {#if meaning}<p class="answer">{meaning}</p>{/if}
      {:else}
        {#if kind === 'almost' && note}<p class="note">{note}</p>{/if}
        {#if expected}
          <p class="answer">
            {#if kind === 'almost'}<span class="label">Правильно:</span>{/if}
            <span lang={lang} class:udm={lang === 'udm'}>{expected}</span>
          </p>
        {/if}
        {#if showMeaning}<p class="meaning">{meaning}</p>{/if}
        {#if kind === 'wrong' && note}<p class="note">{note}</p>{/if}
      {/if}

      {#if morphemes.length > 1}
        <p class="morph" aria-label="Разбор слова">
          {#each morphemes as m, i (i)}
            {#if i > 0}<span class="plus" aria-hidden="true">+</span>{/if}
            <span class="m"><b lang="udm" class="udm">{m.form}</b> <span class="mm">{m.meaning}</span></span>
          {/each}
        </p>
      {/if}

      {#if explain}<p class="explain">{explain}</p>{/if}
      {#if reportUrl}<a class="report" href={reportUrl} target="_blank" rel="noopener">⚑ Сообщить об ошибке</a>{/if}
    </div>

    <button bind:this={btn} class="btn go" type="button" data-testid="continue" onclick={oncontinue}>Продолжить</button>
  </div>
</section>

<style>
  .sheet {
    --tone: var(--green);
    --tone-edge: var(--green-edge);
    --tone-soft: var(--green-soft);
    background: var(--tone-soft);
    color: var(--ink);
    border-top: 2px solid color-mix(in oklab, var(--tone) 35%, transparent);
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
  }
  .is-almost {
    --tone: var(--amber);
    --tone-edge: var(--amber-edge);
    --tone-soft: var(--amber-soft);
  }
  .is-wrong {
    --tone: var(--red);
    --tone-edge: var(--red-edge);
    --tone-soft: var(--red-soft);
  }
  .inner {
    max-width: var(--page-max);
    margin: 0 auto;
    display: grid;
    gap: 14px;
  }
  .msg {
    min-width: 0;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 6px;
  }
  .icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--tone);
  }
  .icon svg {
    fill: none;
    stroke: var(--on-fill);
    stroke-width: 3.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  h2 {
    margin: 0;
    font-size: 1.35rem;
    color: var(--tone);
  }
  p {
    margin: 0 0 4px;
  }
  .answer {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--tone);
    overflow-wrap: anywhere;
  }
  .label {
    font-weight: 600;
    margin-right: 4px;
  }
  .meaning,
  .note {
    color: var(--ink);
  }
  .report {
    display: inline-block;
    margin-top: 6px;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .explain {
    margin-top: 6px;
    font-size: 0.95rem;
    color: var(--muted);
  }
  .morph {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 6px;
    margin-top: 6px;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .morph b {
    color: var(--ink);
  }
  .plus {
    color: var(--line-strong);
    font-weight: 700;
  }
  .go {
    --face: var(--tone);
    --edge: var(--tone-edge);
    width: 100%;
  }

  @media (min-width: 640px) {
    .inner {
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 24px;
    }
    .go {
      width: auto;
      min-width: 200px;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .sheet {
      animation: sheet-in var(--spring-soft-dur) var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .icon {
      animation: pop var(--spring-pop-dur) var(--spring-pop) 80ms both;
    }
    :global(html:not([data-motion='reduce'])) .is-wrong .icon {
      animation: shake 400ms var(--ease-standard) 60ms both;
    }
  }
  @keyframes sheet-in {
    from {
      transform: translateY(100%);
    }
  }
</style>
