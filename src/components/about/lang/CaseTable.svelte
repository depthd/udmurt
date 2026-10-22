<script lang="ts">
  /** 15 падежей: аккордеон. На широком экране строки — таблица, на узком — карточки. */
  import { CASES, CASES_INFO } from '../../../data/lang/grammar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let noun = $state<'shur' | 'val'>('shur');
  let open = $state<number | null>(9);
  const groups = [
    { id: 'grammar', title: 'Грамматические падежи', hint: 'кто, кого, чей, кому…' },
    { id: 'place', title: 'Местные падежи', hint: 'где, куда, откуда — вместо предлогов' },
  ] as const;

  const toggle = (n: number) => (open = open === n ? null : n);
</script>

<div class="cases">
  <p class="sum">{CASES_INFO.summary}</p>
  <Chips
    label="Слово для примеров"
    options={[
      { id: 'shur', label: '*шур* «река» — неодушевлённое' },
      { id: 'val', label: '*вал* «лошадь» — одушевлённое' },
    ]}
    bind:value={noun}
    small
  />
  {#if noun === 'val'}<p class="anim-note" role="status"><Rich text={CASES_INFO.animateNote} /></p>{/if}

  {#each groups as g (g.id)}
    <h4 class="gh">{g.title} <span class="cnt">{CASES.filter((c) => c.group === g.id).length}</span> <span class="gsub">{g.hint}</span></h4>
    <ul class="list">
      {#each CASES.filter((c) => c.group === g.id) as c (c.n)}
        {@const form = noun === 'shur' ? c.udm : c.animate}
        <li class="row" class:open={open === c.n} class:none={!form}>
          <button type="button" class="head" aria-expanded={open === c.n} aria-controls="case-{c.n}" onclick={() => toggle(c.n)}>
            <span class="n" aria-hidden="true">{c.n}</span>
            <span class="name">{c.name}<span class="q">{c.question}</span></span>
            <span class="end"><Rich text={c.ending} /></span>
            <span class="form">
              {#if form}<span lang="udm" class="fw">{form}</span>{#if noun === 'shur'}<span class="tr">{c.ru}</span>{/if}{:else}<span class="no">нет формы</span>{/if}
            </span>
            <svg class="chev" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
          </button>
          <div class="panel" id="case-{c.n}" hidden={open !== c.n}>
            <p><b>Что значит.</b> {c.meaning}</p>
            <p class="lat">Термин: {c.name.toLowerCase()} падеж ({c.latin}).</p>
            {#if c.example}
              <p class="ex"><span lang="udm" class="exu">{c.example.udm}</span> — {c.example.ru}</p>
            {/if}
            <Sources source={c.source} compact />
          </div>
        </li>
      {/each}
    </ul>
  {/each}
  <Sources source={CASES_INFO.source} />
</div>

<style>
  .cases {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .sum,
  .anim-note {
    margin: 0;
  }
  .anim-note {
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--amber-soft);
    font-size: 0.95rem;
  }
  .gh {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 8px;
    margin: 10px 0 0;
    font-size: 1rem;
  }
  .cnt {
    display: inline-grid;
    place-items: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font-size: 0.8rem;
  }
  .gsub {
    font: 400 0.85rem/1.3 var(--font-text);
    color: var(--muted);
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--surface);
  }
  .row + .row {
    border-top: 1px solid var(--line);
  }
  .head {
    appearance: none;
    display: grid;
    grid-template-columns: 26px minmax(0, 1fr) 20px;
    grid-template-areas:
      'n name chev'
      'n end chev'
      'n form chev';
    align-items: center;
    gap: 2px 10px;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }
  @media (min-width: 620px) {
    .head {
      grid-template-columns: 26px minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1.2fr) 20px;
      grid-template-areas: 'n name end form chev';
    }
  }
  .head:hover {
    background: var(--surface-2);
  }
  .n {
    grid-area: n;
    align-self: start;
    display: inline-grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--surface-2);
    font: 700 0.8rem/1 var(--font-head);
    color: var(--muted);
  }
  .open .n {
    background: var(--red);
    color: var(--on-fill);
  }
  .name {
    grid-area: name;
    display: flex;
    flex-direction: column;
    font: 600 1rem/1.25 var(--font-head);
  }
  .q {
    font: 400 0.85rem/1.3 var(--font-text);
    color: var(--muted);
  }
  .end {
    grid-area: end;
    font-size: 0.9rem;
  }
  .form {
    grid-area: form;
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0 8px;
  }
  .fw {
    font: 700 1.1rem/1.3 var(--font-head);
    color: var(--red);
  }
  .tr {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .no {
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
  }
  .none .name {
    color: var(--muted);
  }
  .chev {
    grid-area: chev;
    fill: none;
    stroke: var(--muted);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .open .chev {
    transform: rotate(180deg);
  }
  .panel {
    padding: 0 14px 12px 48px;
    font-size: 0.95rem;
  }
  .panel p {
    margin: 0 0 4px;
  }
  .lat {
    color: var(--muted);
    font-size: 0.85rem;
  }
  .ex {
    padding: 8px 10px;
    border-radius: var(--radius-s);
    background: var(--surface-2);
  }
  .exu {
    font-family: var(--font-head);
    font-weight: 600;
  }
  @keyframes open-in {
    from {
      opacity: 0;
      transform: translateY(-6px);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .chev {
      transition: transform var(--spring-snappy-dur) var(--spring-snappy);
    }
    :global(html:not([data-motion='reduce'])) .panel:not([hidden]) {
      animation: open-in var(--spring-soft-dur) var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .head {
      transition: background-color var(--dur-fast);
    }
  }
</style>
