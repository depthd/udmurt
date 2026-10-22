<script lang="ts">
  /** Агглютинация: слово собирается по шагам, суффиксы «приклеиваются» с подписями. */
  import { MORPH_CHAINS } from '../../../data/lang/grammar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let chainId = $state(MORPH_CHAINS[0].id);
  let step = $state(0);
  const chain = $derived(MORPH_CHAINS.find((c) => c.id === chainId) ?? MORPH_CHAINS[0]);
  const done = $derived(chain.steps.slice(0, step + 1));
  const cur = $derived(chain.steps[step]);
  const last = $derived(step === chain.steps.length - 1);

  $effect(() => {
    void chainId;
    step = 0;
  });

  /** Цвет суффикса по его роли (по подписи). */
  function tone(label: string, i: number) {
    if (i === 0) return 'root';
    if (/падеж/.test(label)) return 'case';
    if (/«наш»|«мой»|«твой»/.test(label)) return 'poss';
    if (/множествен/.test(label)) return 'pl';
    return 'deriv';
  }
</script>

<div class="mb">
  <Chips label="Пример слова" options={MORPH_CHAINS.map((c) => ({ id: c.id, label: c.title.replace(/^(\S+)/, '*$1*') }))} bind:value={chainId} small />

  <div class="stage" aria-hidden="true">
    <p class="word" lang="udm">
      {#each done as s, i (chain.id + i)}<span class="seg {tone(s.label, i)}" class:fresh={i === step && i > 0}>{i === 0 ? s.udm : s.add}</span>{/each}
    </p>
    <p class="gloss">«{cur.ru}»</p>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite">
    Шаг {step + 1} из {chain.steps.length}: {cur.udm} — {cur.ru}
  </p>

  <ol class="steps">
    {#each done as s, i (chain.id + i)}
      <li class="st {tone(s.label, i)}" class:fresh={i === step}>
        <span class="plus" aria-hidden="true">{i === 0 ? '' : '+'}</span>
        <span class="chunk" lang="udm">{i === 0 ? s.udm : '-' + s.add}</span>
        <span class="arrow" aria-hidden="true">→</span>
        <span class="res"><span lang="udm" class="rw">{s.udm}</span> «{s.ru}»</span>
        <span class="lbl"><Rich text={s.label} /></span>
      </li>
    {/each}
  </ol>

  <div class="ctrl">
    <button type="button" class="btn btn--ghost btn--sm" disabled={step === 0} onclick={() => (step = Math.max(0, step - 1))}>Назад</button>
    {#if last}
      <button type="button" class="btn btn--sm" onclick={() => (step = 0)}>Собрать заново</button>
    {:else}
      <button type="button" class="btn btn--sm" onclick={() => (step = step + 1)}>
        Приклеить <span lang="udm" class="nx">-{chain.steps[step + 1].add}</span>
      </button>
    {/if}
    <span class="count" aria-hidden="true">{step + 1} / {chain.steps.length}</span>
  </div>
  {#if chain.note}<p class="note">{chain.note}</p>{/if}
  <Sources source={chain.source} />
</div>

<style>
  .mb {
    display: grid;
    gap: 12px;
  }
  .stage {
    display: grid;
    justify-items: center;
    gap: 2px;
    padding: 18px 8px 14px;
    border-radius: var(--radius);
    background: var(--surface-2);
    overflow: hidden;
  }
  .word {
    margin: 0;
    max-width: 100%;
    font: 700 clamp(1.5rem, 1rem + 4vw, 2.3rem)/1.2 var(--font-head);
    overflow-wrap: anywhere;
    text-align: center;
  }
  .seg {
    display: inline-block;
    padding-bottom: 3px;
    border-bottom: 4px solid transparent;
  }
  .seg.root {
    color: var(--ink);
    border-color: var(--line-strong);
  }
  .seg.deriv {
    color: var(--blue);
    border-color: var(--blue);
  }
  .seg.pl {
    color: var(--amber);
    border-color: var(--amber);
  }
  .seg.poss {
    color: var(--green);
    border-color: var(--green);
  }
  .seg.case {
    color: var(--red);
    border-color: var(--red);
  }
  .gloss {
    margin: 0;
    color: var(--muted);
    font-weight: 600;
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .st {
    display: grid;
    grid-template-columns: 14px auto auto 1fr;
    align-items: baseline;
    gap: 2px 8px;
    padding: 6px 10px;
    border-left: 4px solid var(--line-strong);
    border-radius: 0 10px 10px 0;
    background: var(--surface);
  }
  .st.deriv {
    border-color: var(--blue);
  }
  .st.pl {
    border-color: var(--amber);
  }
  .st.poss {
    border-color: var(--green);
  }
  .st.case {
    border-color: var(--red);
  }
  .plus {
    color: var(--muted);
    font-weight: 700;
  }
  .chunk {
    font: 700 1rem/1.3 var(--font-head);
  }
  .arrow {
    color: var(--muted);
  }
  .res {
    min-width: 0;
  }
  .rw {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .lbl {
    grid-column: 2 / -1;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .ctrl {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .nx {
    text-transform: none;
    letter-spacing: 0;
  }
  .count {
    margin-left: auto;
    color: var(--muted);
    font: 600 0.9rem/1 var(--font-head);
  }
  .note {
    margin: 0;
    font-size: 0.95rem;
  }

  @keyframes glue {
    0% {
      opacity: 0;
      transform: translateX(28px) scaleX(1.25);
    }
    55% {
      opacity: 1;
      transform: translateX(-3px) scaleX(0.92);
    }
    100% {
      transform: none;
    }
  }
  @keyframes thread {
    from {
      border-bottom-color: transparent;
    }
  }
  @keyframes slide {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .seg.fresh {
      transform-origin: left center;
      animation:
        glue var(--spring-pop-dur) var(--spring-pop) both,
        thread 500ms var(--ease-enter) 200ms both;
    }
    :global(html:not([data-motion='reduce'])) .st.fresh {
      animation: slide var(--spring-soft-dur) var(--spring-soft) both;
    }
  }
</style>
