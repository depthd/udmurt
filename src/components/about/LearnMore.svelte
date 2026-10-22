<script lang="ts">
  /** «Куда дальше»: ссылки на уроки, словарь, материалы и источники. */
  import { href } from '$lib/router.svelte';
  import Mascot from '../Mascot.svelte';
  import { reveal } from './reveal';

  const LINKS = [
    { path: '/learn', title: 'Учиться', text: 'Короткие уроки по пять минут в день: от «здравствуй» до «я из Глазова».', icon: 'M4 19V8l8-5 8 5v11h-5v-6H9v6z' },
    {
      path: '/dict',
      title: 'Словарь',
      text: '38 842 слова и тысячи фраз с переводом. Поиск понимает и слова без точек над буквами.',
      icon: 'M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 3v2h9V6zm0 4v2h9v-2zm0 4v2h6v-2z',
    },
    {
      path: '/library',
      title: 'Материалы',
      text: 'Учебники, словари, курсы и каналы — с пометкой о правах на каждый.',
      icon: 'M4 4h4v16H4zm6 0h4v16h-4zm6.2.6 3.8-1 4.1 15.4-3.8 1z',
    },
    {
      path: '/credits',
      title: 'Источники',
      text: 'Чьи данные и тексты помогли собрать этот сайт.',
      icon: 'M12 2 2 7l10 5 10-5zm-8 8v5c0 2 3.6 4 8 4s8-2 8-4v-5l-8 4z',
    },
  ];
</script>

<section id="learn-more" class="ab-sec" aria-labelledby="learn-more-title" tabindex="-1">
  <div class="hello" use:reveal>
    <Mascot mood="happy" size={84} label="Юсь, лебедёнок-помощник, радуется" />
    <div>
      <p class="kicker">Куда дальше</p>
      <h2 id="learn-more-title">Знать — хорошо, говорить — лучше</h2>
      <p class="lead">
        Начните с приветствия: <span lang="udm" class="w">Ӟечбур!</span> — «Здравствуй!». А дальше — по шагу в день.
      </p>
    </div>
  </div>

  <ul class="go">
    {#each LINKS as l, i (l.path)}
      <li use:reveal={{ delay: i * 60 }}>
        <a class="tile go-t" href={href(l.path)}>
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d={l.icon} /></svg>
          <span class="tx">
            <span class="tt">{l.title}</span>
            <span class="td">{l.text}</span>
          </span>
          <svg class="arr" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .hello {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }
  .hello > :global(*:first-child) {
    flex: none;
  }
  .kicker {
    margin: 0 0 6px;
    font: 700 0.78rem/1 var(--font-head);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--red);
  }
  h2 {
    margin-bottom: 6px;
    text-wrap: balance;
  }
  .lead {
    margin: 0;
  }
  .w {
    font-family: var(--font-head);
    font-weight: 700;
    color: var(--red);
  }
  .go {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
    gap: 12px;
  }
  .go-t {
    text-decoration: none;
    color: var(--ink);
    height: 100%;
  }
  .go-t > svg:first-child path {
    fill: var(--red);
  }
  .tx {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
  }
  .tt {
    font: 700 1.05rem/1.2 var(--font-head);
  }
  .td {
    font-size: 0.9rem;
    color: var(--muted);
    line-height: 1.35;
  }
  .arr {
    flex: none;
  }
  .arr path {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .arr {
      transition: translate 300ms var(--spring-snappy);
    }
    :global(html:not([data-motion='reduce'])) .go-t:hover .arr {
      translate: 4px 0;
    }
  }
</style>
