<script lang="ts">
  /**
   * Раздел «Алфавит» страницы «О языке». Без props — подключается хабом About.svelte.
   * 38 букв сеткой; пять особых (Ӝ Ӟ Ӥ Ӧ Ӵ) — красные кнопки, раскрывают карточку с описанием звука,
   * примерами и способом набора. Ниже — ударение и как набирать удмуртские буквы.
   * Данные и источники: src/data/lang/alphabet.ts.
   */
  import { ALPHABET, SPECIAL_LETTERS, TYPING_TIPS } from '../../data/lang/alphabet';
  import LetterCard from './lang/LetterCard.svelte';
  import Rich from './lang/Rich.svelte';
  import Sources from './lang/Sources.svelte';
  import StressDemo from './lang/StressDemo.svelte';

  const CARD_ID = 'alphabet-letter-card';
  let selected = $state<string>('Ӧ');
  const current = $derived(SPECIAL_LETTERS.find((l) => l.upper === selected));

  function pick(u: string) {
    selected = u;
  }
</script>

<section class="lang-sec" aria-labelledby="alphabet-h">
  <header class="intro">
    <h2 id="alphabet-h">Алфавит</h2>
    <p class="lead">
      38 букв на основе русской кириллицы: все 33 русские и ещё пять со знаком «две точки» —
      <span lang="udm" class="udm five">Ӝ Ӟ Ӥ Ӧ Ӵ</span>. Нажмите на красную букву.
    </p>
  </header>

  <ul class="abc" aria-label="Удмуртский алфавит, 38 букв">
    {#each ALPHABET.letters as l, i (l.upper)}
      <li style="--i: {i}">
        {#if l.special}
          <button
            type="button"
            class="lt special"
            class:on={selected === l.upper}
            aria-pressed={selected === l.upper}
            aria-controls={CARD_ID}
            aria-label="Буква {l.upper}: показать, как звучит"
            onclick={() => pick(l.upper)}
          >
            <span lang="udm" class="u">{l.upper}</span><span lang="udm" class="l">{l.lower}</span>
          </button>
        {:else}
          <span class="lt" class:loan={l.loanOnly} title={l.loanOnly ? 'Только в заимствованиях' : undefined}>
            <span lang="udm" class="u">{l.upper}</span><span lang="udm" class="l">{l.lower}</span>
          </span>
        {/if}
      </li>
    {/each}
  </ul>

  <p class="legend">
    <span class="sw sw-red" aria-hidden="true"></span> удмуртские буквы
    <span class="sw sw-loan" aria-hidden="true"></span> <Rich text={ALPHABET.loanNote} />
  </p>
  <Sources source={ALPHABET.source} />

  <div class="card-slot">
    {#if current}
      {#key current.upper}
        <LetterCard letter={current} id={CARD_ID} />
      {/key}
    {/if}
  </div>

  <StressDemo />

  <section class="typing card" aria-labelledby="typing-h">
    <h3 id="typing-h">Как набирать <span lang="udm">ӝ ӟ ӥ ӧ ӵ</span></h3>
    <ul>
      {#each TYPING_TIPS as t (t.title)}
        <li>
          <b>{t.title}.</b>
          <Rich text={t.text} />
          <Sources source={t.source} compact />
        </li>
      {/each}
    </ul>
  </section>
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
  .five {
    color: var(--red);
    font-weight: 700;
    white-space: nowrap;
  }

  .abc {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(44px, 1fr));
    gap: 6px;
  }
  @media (min-width: 480px) {
    .abc {
      grid-template-columns: repeat(auto-fill, minmax(54px, 1fr));
      gap: 8px;
    }
  }
  .abc li {
    min-width: 0;
  }
  .lt {
    appearance: none;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    aspect-ratio: 1 / 1.08;
    padding: 0;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
    line-height: 1;
  }
  .u {
    display: inline-block;
    font: 700 1.25rem/1 var(--font-head);
  }
  .l {
    margin-top: 3px;
    font: 500 0.8rem/1 var(--font-head);
    color: var(--muted);
  }
  .loan {
    border-style: dashed;
    background: transparent;
  }
  .loan .u {
    color: var(--muted);
  }
  .special {
    cursor: pointer;
    border-color: var(--red);
    background: var(--red-soft);
    box-shadow: 0 3px 0 var(--red-edge);
    -webkit-tap-highlight-color: transparent;
  }
  .special .u,
  .special .l {
    color: var(--red);
  }
  .special.on {
    background: var(--red);
    border-color: var(--red);
  }
  .special.on .u,
  .special.on .l {
    color: var(--on-fill);
  }
  .special:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--red-edge);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 8px;
    margin: 0;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .sw {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 4px;
    margin-left: 4px;
  }
  .sw-red {
    background: var(--red-soft);
    border: 2px solid var(--red);
  }
  .sw-loan {
    border: 2px dashed var(--line-strong);
  }

  .card-slot {
    display: grid;
  }

  .typing h3 {
    margin-top: 0;
  }
  .typing ul {
    margin: 0;
    padding-left: 1.1em;
    display: grid;
    gap: 10px;
  }

  @keyframes tile-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.9);
    }
  }
  @keyframes wiggle {
    0%,
    100% {
      transform: none;
    }
    30% {
      transform: rotate(-7deg) scale(1.12);
    }
    60% {
      transform: rotate(5deg) scale(1.05);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .abc li {
      animation: tile-in var(--spring-soft-dur) var(--spring-soft) both;
      animation-delay: calc(var(--i) * 14ms);
    }
    :global(html:not([data-motion='reduce'])) .special {
      transition:
        transform 500ms var(--ease-release),
        box-shadow 500ms var(--ease-release),
        background-color var(--dur-fast),
        border-color var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .special:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 0 var(--red-edge);
      transition-duration: 250ms;
      transition-timing-function: var(--ease-overshoot);
    }
    :global(html:not([data-motion='reduce'])) .special:hover .u {
      animation: wiggle 520ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .special:active {
      transform: translateY(3px);
      box-shadow: 0 0 0 var(--red-edge);
      transition-duration: 40ms;
    }
  }
</style>
