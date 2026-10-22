<script lang="ts">
  /** Отрицательный глагол: переключатель «утверждение / отрицание», время, глагол. */
  import { NEGATION_INFO, PERSONS, TENSES, VERBS, type Tense } from '../../../data/lang/grammar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let verbId = $state(VERBS[0].id);
  let tense = $state<Tense>('pres');
  let mode = $state<'aff' | 'neg'>('neg');
  const verb = $derived(VERBS.find((v) => v.id === verbId) ?? VERBS[0]);
</script>

<div class="neg">
  <p class="sum">{NEGATION_INFO.summary}</p>

  <div class="ctrls">
    <Chips label="Глагол" options={VERBS.map((v) => ({ id: v.id, label: `*${v.inf}* «${v.ru}»` }))} bind:value={verbId} small />
    <Chips label="Время" options={TENSES.map((t) => ({ id: t.id, label: t.ru }))} bind:value={tense} small />
    <div class="switch" role="group" aria-label="Форма">
      <button type="button" aria-pressed={mode === 'aff'} onclick={() => (mode = 'aff')}>Утверждение</button>
      <button type="button" aria-pressed={mode === 'neg'} onclick={() => (mode = 'neg')}>Отрицание</button>
    </div>
  </div>

  <table class="tbl">
    <caption class="visually-hidden">
      {verb.inf}: {TENSES.find((t) => t.id === tense)?.ru} время, {mode === 'neg' ? 'отрицание' : 'утверждение'}
    </caption>
    <thead>
      <tr><th scope="col">Кто</th><th scope="col">Форма</th><th scope="col">Перевод</th></tr>
    </thead>
    <tbody>
      {#each PERSONS as p, i (p.id)}
        <tr>
          <th scope="row"><span lang="udm" class="pr">{p.pronoun}</span></th>
          <td>
            {#key mode + tense + verbId}
              <span class="form" lang="udm" style="--i: {i}">
                {#if mode === 'neg'}<span class="aux">{verb.neg[tense][i].neg}</span> <span class="v">{verb.neg[tense][i].verb}</span>{:else}<span class="v">{verb.aff[tense][i]}</span>{/if}
              </span>
            {/key}
          </td>
          <td class="gl">{verb.gloss[tense][i][mode === 'neg' ? 1 : 0]}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="foot">
    {verb.conj}.{#if mode === 'neg' && verbId === 'gyryny' && tense !== 'pres'}
      Скобки — необязательная часть: <span lang="udm" class="u">гыре(лэ)</span> = <span lang="udm" class="u">гыре</span> или
      <span lang="udm" class="u">гырелэ</span>.{/if}
  </p>
  <p class="extra">
    Запрет: <span lang="udm" class="u">{NEGATION_INFO.imperative.udm}</span> «{NEGATION_INFO.imperative.ru}». «Не» с существительным:
    <span lang="udm" class="u">{NEGATION_INFO.noun.udm}</span> «{NEGATION_INFO.noun.ru}» — <Rich text="*ӧвӧл* ставится в конце." />
  </p>
  <Sources source={[...verb.source, ...NEGATION_INFO.source.slice(1)]} />
</div>

<style>
  .neg {
    display: grid;
    gap: 12px;
    min-width: 0;
  }
  .sum,
  .foot,
  .extra {
    margin: 0;
  }
  .foot {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .ctrls {
    display: grid;
    gap: 8px;
  }
  .switch {
    display: inline-flex;
    width: fit-content;
    max-width: 100%;
    padding: 4px;
    border-radius: 999px;
    background: var(--surface-2);
  }
  .switch button {
    appearance: none;
    min-height: 40px;
    padding: 6px 14px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font: 700 0.9rem/1 var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  .switch button[aria-pressed='true'] {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 1px 0 var(--line-strong), 0 2px 8px rgb(0 0 0 / 0.08);
  }
  .switch button:last-child[aria-pressed='true'] {
    color: var(--red);
  }
  .tbl {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }
  .tbl th,
  .tbl td {
    padding: 8px 6px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: baseline;
  }
  .tbl thead th {
    font: 700 0.75rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .tbl th:first-child {
    width: 18%;
  }
  .tbl td:nth-child(2) {
    width: 44%;
  }
  .pr {
    font: 600 0.95rem/1.2 var(--font-head);
    color: var(--muted);
  }
  .form {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 2px 6px;
    font: 700 1.05rem/1.3 var(--font-head);
  }
  .aux {
    display: inline-block;
    padding: 0 6px;
    border-radius: 6px;
    background: var(--red);
    color: var(--on-fill);
  }
  .gl {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .u {
    font-family: var(--font-head);
    font-weight: 600;
  }
  @keyframes aux-in {
    from {
      opacity: 0;
      transform: translateX(-14px) scale(0.8);
    }
  }
  @keyframes v-in {
    from {
      opacity: 0.2;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .aux {
      animation: aux-in var(--spring-pop-dur) var(--spring-pop) both;
      animation-delay: calc(var(--i, 0) * 40ms);
    }
    :global(html:not([data-motion='reduce'])) .v {
      animation: v-in 300ms var(--ease-standard) both;
    }
    :global(html:not([data-motion='reduce'])) .switch button {
      transition:
        background-color var(--dur-fast),
        color var(--dur-fast),
        box-shadow var(--dur-fast);
    }
  }
</style>
