<script lang="ts">
  /**
   * Раздел «Сравнение с другими языками» страницы «О языке». Без props — подключается хабом About.svelte.
   * (а) родственные слова; (б) таблица грамматики; (в) что будет легко русскоязычному, а что непривычно.
   * Данные: src/data/lang/cognates.ts, src/data/lang/compare.ts.
   */
  import { COGNATES_INFO } from '../../data/lang/cognates';
  import { EASY, HARD } from '../../data/lang/compare';
  import CognateTable from './lang/CognateTable.svelte';
  import GrammarCompareTable from './lang/GrammarCompareTable.svelte';
  import Rich from './lang/Rich.svelte';
  import Sources from './lang/Sources.svelte';

  const cols = [
    { id: 'easy', title: 'Будет легко', icon: 'M5 12.5l4.5 4.5L19 7.5', items: EASY },
    { id: 'hard', title: 'Будет непривычно', icon: 'M12 6v7.5M12 18v.01', items: HARD },
  ] as const;
</script>

<section class="lang-sec" aria-labelledby="compare-h">
  <header class="intro">
    <h2 id="compare-h">Сравнение с другими языками</h2>
    <p class="lead">
      Удмуртский — родственник финского, венгерского, коми и марийского, а сосед — русского и татарского.
      Посмотрим, что общего у родственников и что досталось от соседей.
    </p>
  </header>

  <article class="card block" aria-labelledby="cmp-cog-h">
    <h3 id="cmp-cog-h">Родственные слова</h3>
    <p>{COGNATES_INFO.summary}</p>
    <p class="myth"><b>Миф:</b> {COGNATES_INFO.myth}</p>
    <CognateTable />
  </article>

  <article class="card block" aria-labelledby="cmp-gr-h">
    <h3 id="cmp-gr-h">Грамматика: удмуртский и пять языков</h3>
    <p>Зелёным отмечено то, что устроено так же, как в удмуртском.</p>
    <GrammarCompareTable />
  </article>

  <article class="block plain" aria-labelledby="cmp-ru-h">
    <h3 id="cmp-ru-h">Русскоязычному: что легко, а что непривычно</h3>
    <div class="two">
      {#each cols as col (col.id)}
        <section class="col col-{col.id}" aria-labelledby="col-{col.id}-h">
          <h4 id="col-{col.id}-h">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={col.icon} /></svg>
            {col.title}
          </h4>
          <ul>
            {#each col.items as p, i (p.title)}
              <li style="--i: {i}">
                <b>{p.title}</b>
                <span><Rich text={p.text} /></span>
                <Sources source={p.source} compact />
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  </article>
</section>

<style>
  .lang-sec {
    display: grid;
    gap: 16px;
    min-width: 0;
  }
  .intro h2 {
    margin-bottom: 6px;
  }
  .lead {
    margin: 0;
    color: var(--muted);
  }
  .block {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 18px 16px;
  }
  @media (min-width: 560px) {
    .block {
      padding: 22px 24px;
    }
  }
  .block.plain {
    padding: 0;
  }
  .block > p {
    margin: 0;
  }
  h3 {
    margin: 0;
  }
  .myth {
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--amber-soft);
    font-size: 0.95rem;
  }
  .two {
    display: grid;
    gap: 12px;
  }
  @media (min-width: 640px) {
    .two {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
  .col {
    padding: 16px;
    border-radius: var(--radius);
    border: 2px solid var(--line);
    background: var(--surface);
  }
  .col-easy {
    border-top: 6px solid var(--green);
  }
  .col-hard {
    border-top: 6px solid var(--amber);
  }
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    font-size: 1.05rem;
  }
  h4 svg {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .col-easy h4 svg {
    stroke: var(--green);
  }
  .col-hard h4 svg {
    stroke: var(--amber);
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }
  li {
    display: grid;
    gap: 2px;
  }
  li b {
    font-family: var(--font-head);
  }
  @keyframes item-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) li {
      animation: item-in var(--spring-soft-dur) var(--spring-soft) both;
      animation-delay: calc(var(--i) * 40ms);
    }
  }
</style>
