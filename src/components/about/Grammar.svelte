<script lang="ts">
  /**
   * Раздел «Грамматика» страницы «О языке». Без props — подключается хабом About.svelte.
   * Семь карточек-особенностей, у каждой — интерактив и источник.
   * Данные: src/data/lang/grammar.ts (парадигмы — по Алатыреву 1983).
   */
  import { prefs } from '$lib/prefs.svelte';
  import { NO_GENDER } from '../../data/lang/grammar';
  import CaseTable from './lang/CaseTable.svelte';
  import EvidentialDemo from './lang/EvidentialDemo.svelte';
  import MorphemeBuilder from './lang/MorphemeBuilder.svelte';
  import NegationDemo from './lang/NegationDemo.svelte';
  import PossessiveDemo from './lang/PossessiveDemo.svelte';
  import Rich from './lang/Rich.svelte';
  import Sources from './lang/Sources.svelte';
  import WordOrderDemo from './lang/WordOrderDemo.svelte';

  const CARDS = [
    { id: 'g-aggl', n: 1, title: 'Слово собирается из кусочков', short: 'Агглютинация' },
    { id: 'g-cases', n: 2, title: '15 падежей', short: 'Падежи' },
    { id: 'g-gender', n: 3, title: 'Нет рода и артиклей', short: 'Род' },
    { id: 'g-poss', n: 4, title: '«Мой» — это суффикс', short: '«Мой»' },
    { id: 'g-neg', n: 5, title: '«Не» — это глагол', short: '«Не»' },
    { id: 'g-order', n: 6, title: 'Глагол в конце и послелоги', short: 'Порядок слов' },
    { id: 'g-past', n: 7, title: 'Видел сам или «оказывается»', short: 'Прошедшее' },
  ] as const;
  const title = (id: (typeof CARDS)[number]['id']) => CARDS.find((c) => c.id === id)!;

  function jump(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefs.reduceMotion ? 'auto' : 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }

  const genders = [
    { id: 'm', ru: 'он' },
    { id: 'f', ru: 'она' },
    { id: 'n', ru: 'оно' },
  ];
  let g = $state('m');
  let bump = $state(0);
</script>

{#snippet head(id: (typeof CARDS)[number]['id'])}
  {@const c = title(id)}
  <h3 id="{id}-h"><span class="num" aria-hidden="true">{c.n}</span>{c.title}</h3>
{/snippet}

<section class="lang-sec" aria-labelledby="grammar-h">
  <header class="intro">
    <h2 id="grammar-h">Особенности грамматики</h2>
    <p class="lead">Семь черт, которые делают удмуртский удмуртским. Всё можно потрогать: нажимайте на кнопки.</p>
    <nav aria-label="Карточки грамматики">
      <ul class="toc">
        {#each CARDS as c (c.id)}
          <li><button type="button" class="tocb" onclick={() => jump(c.id)}><span aria-hidden="true">{c.n}</span> {c.short}</button></li>
        {/each}
      </ul>
    </nav>
  </header>

  <article class="card gcard" id="g-aggl" tabindex="-1" aria-labelledby="g-aggl-h">
    {@render head('g-aggl')}
    <p>
      Удмуртский — агглютинативный язык: к корню по одному «приклеиваются» суффиксы, и у каждого одно значение.
      Соберите слово сами.
    </p>
    <MorphemeBuilder />
  </article>

  <article class="card gcard" id="g-cases" tabindex="-1" aria-labelledby="g-cases-h">
    {@render head('g-cases')}
    <p>Окончание падежа делает работу русского предлога. Нажмите на строку, чтобы увидеть, что значит падеж.</p>
    <CaseTable />
  </article>

  <article class="card gcard" id="g-gender" tabindex="-1" aria-labelledby="g-gender-h">
    {@render head('g-gender')}
    <p>Грамматического рода нет: одно слово на «он», «она» и «оно».</p>
    <div class="gender">
      <div class="g-opts" role="group" aria-label="Русское местоимение">
        {#each genders as x (x.id)}
          <button
            type="button"
            class="g-opt"
            aria-pressed={g === x.id}
            onclick={() => {
              g = x.id;
              bump++;
            }}>{x.ru}</button
          >
        {/each}
      </div>
      <span class="g-arrow" aria-hidden="true">→</span>
      {#key bump}
        <span class="g-out" lang="udm" aria-live="polite">{NO_GENDER.pronoun.udm}</span>
      {/key}
    </div>
    <ul class="g-ex">
      {#each NO_GENDER.examples as e (e.udm)}
        <li><span lang="udm" class="u">{e.udm}</span> — {e.ru}</li>
      {/each}
    </ul>
    <p class="muted"><Rich text={NO_GENDER.articleNote} /></p>
    <Sources source={NO_GENDER.source} />
  </article>

  <article class="card gcard" id="g-poss" tabindex="-1" aria-labelledby="g-poss-h">
    {@render head('g-poss')}
    <p>Вместо слов «мой, твой, наш» — суффикс на конце слова. Выберите, чей друг.</p>
    <PossessiveDemo />
  </article>

  <article class="card gcard" id="g-neg" tabindex="-1" aria-labelledby="g-neg-h">
    {@render head('g-neg')}
    <NegationDemo />
  </article>

  <article class="card gcard" id="g-order" tabindex="-1" aria-labelledby="g-order-h">
    {@render head('g-order')}
    <WordOrderDemo />
  </article>

  <article class="card gcard" id="g-past" tabindex="-1" aria-labelledby="g-past-h">
    {@render head('g-past')}
    <p>У прошедшего времени две формы: одна для того, что вы видели или точно знаете, другая — для услышанного от других.</p>
    <EvidentialDemo />
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
    margin: 0 0 10px;
    color: var(--muted);
  }
  .toc {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tocb {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 4px 12px 4px 4px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    font: 600 0.85rem/1 var(--font-text);
    cursor: pointer;
  }
  .tocb span {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--red-soft);
    color: var(--red);
    font: 700 0.75rem/1 var(--font-head);
  }
  .tocb:hover {
    border-color: var(--red);
  }
  .gcard {
    display: grid;
    gap: 10px;
    min-width: 0;
    padding: 18px 16px;
    scroll-margin-top: var(--ab-off, 16px);
  }
  @media (min-width: 560px) {
    .gcard {
      padding: 22px 24px;
    }
  }
  .gcard:focus {
    outline: none;
  }
  .gcard:focus-visible {
    outline: 3px solid var(--focus);
  }
  .gcard > p {
    margin: 0;
  }
  h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
  }
  .num {
    flex: none;
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--red);
    color: var(--on-fill);
    font: 700 0.95rem/1 var(--font-head);
  }

  .gender {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 14px;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .g-opts {
    display: flex;
    gap: 6px;
  }
  .g-opt {
    appearance: none;
    min-width: 56px;
    min-height: 44px;
    padding: 6px 12px;
    border: 2px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--surface);
    font: 700 1rem/1 var(--font-head);
    cursor: pointer;
  }
  .g-opt[aria-pressed='true'] {
    border-color: var(--ink);
    background: var(--ink);
    color: var(--bg);
  }
  .g-arrow {
    color: var(--muted);
    font-size: 1.4rem;
  }
  .g-out {
    display: inline-block;
    font: 800 2.2rem/1 var(--font-head);
    color: var(--red);
  }
  .g-ex {
    margin: 0;
    padding-left: 1.1em;
  }
  .u {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .muted {
    margin: 0;
  }
  @keyframes boing {
    0% {
      transform: scale(0.7) rotate(-6deg);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .g-out {
      animation: boing var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .tocb {
      transition: border-color var(--dur-fast);
    }
  }
</style>
