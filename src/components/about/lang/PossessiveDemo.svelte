<script lang="ts">
  /** Притяжательные суффиксы: выбери слово и «чей» — суффикс приклеится к основе. */
  import { PERSONS, POSSESSIVE } from '../../../data/lang/grammar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let wordId = $state(POSSESSIVE[0].id);
  let person = $state('1sg');
  const word = $derived(POSSESSIVE.find((w) => w.id === wordId) ?? POSSESSIVE[0]);
  const form = $derived(word.forms[person] ?? null);

  $effect(() => {
    // если у выбранного слова нет формы для лица — вернуться к «мой»
    if (!word.forms[person]) person = '1sg';
  });
</script>

<div class="poss">
  <Chips label="Слово" options={POSSESSIVE.map((w) => ({ id: w.id, label: `*${w.base}* «${w.ru}»` }))} bind:value={wordId} small />

  <div class="stage" aria-hidden="true">
    {#if form}
      {#key wordId + person}
        <p class="big" lang="udm"><span class="base">{word.base}</span><span class="suf">{form.suffix}</span></p>
      {/key}
      <p class="tr">{form.ru}</p>
    {/if}
  </div>
  <p class="visually-hidden" role="status" aria-live="polite">{form ? `${form.udm} — ${form.ru}` : ''}</p>

  <div class="grid" role="group" aria-label="Чей?">
    {#each PERSONS as p (p.id)}
      {@const f = word.forms[p.id]}
      <button type="button" class="cell" aria-pressed={person === p.id} disabled={!f} onclick={() => (person = p.id)}>
        <span class="who">{p.ru}</span>
        {#if f}<span class="f" lang="udm">{word.base}<b>{f.suffix}</b></span>{:else}<span class="nf">нет в наших источниках</span>{/if}
      </button>
    {/each}
  </div>
  <p class="note"><Rich text={word.note} /></p>
  <Sources source={word.source} />
</div>

<style>
  .poss {
    display: grid;
    gap: 12px;
  }
  .stage {
    display: grid;
    justify-items: center;
    padding: 16px 8px 12px;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .big {
    margin: 0;
    font: 700 2.4rem/1.1 var(--font-head);
  }
  .base {
    color: var(--ink);
  }
  .suf {
    display: inline-block;
    color: var(--green);
    border-bottom: 4px solid var(--green);
  }
  .tr {
    margin: 4px 0 0;
    color: var(--muted);
    font-weight: 600;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .cell {
    appearance: none;
    display: grid;
    gap: 2px;
    min-height: 56px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--surface);
    text-align: left;
    cursor: pointer;
  }
  .cell[aria-pressed='true'] {
    border-color: var(--green);
    background: var(--green-soft);
  }
  .cell:disabled {
    cursor: not-allowed;
    border-style: dashed;
    background: transparent;
  }
  .who {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .f {
    font: 600 1.05rem/1.2 var(--font-head);
    overflow-wrap: anywhere;
  }
  .f b {
    color: var(--green);
  }
  .nf {
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }
  .note {
    margin: 0;
    font-size: 0.95rem;
  }
  @keyframes snap {
    0% {
      opacity: 0;
      transform: translateX(22px) scale(1.2);
    }
    60% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .suf {
      animation: snap var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .cell {
      transition:
        background-color var(--dur-fast),
        border-color var(--dur-fast);
    }
  }
</style>
