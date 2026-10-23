<script lang="ts">
  /** Герой страницы «О языке»: название, подзаголовок и «цифры-факты» со счётчиками. */
  import Mascot from '../Mascot.svelte';
  import CountUp from './CountUp.svelte';
  import Sources from './Sources.svelte';
  import { reveal } from './reveal';
  import { INTRO_FACTS, INTRO_SOURCES } from '../../data/about/intro';
</script>

<section id="intro" class="ab-sec hero" aria-labelledby="intro-title" tabindex="-1">
  <div class="top">
    <p class="kicker">Раздел «О языке»</p>
    <div class="mascot"><Mascot mood="wave" size={76} label="Юсь, лебедёнок-помощник, машет крылом" /></div>
  </div>

  <h1 id="intro-title"><span lang="udm">Удмурт кыл</span></h1>
  <svg class="thread" viewBox="0 0 320 22" preserveAspectRatio="none" aria-hidden="true">
    <path d="M3 13 C 40 2, 66 21, 104 12 S 170 3, 208 12 S 280 20, 317 8" pathLength="1" />
  </svg>
  <p class="sub">
    Удмуртский — язык удмуртов (и их соседей бесермян). <span lang="udm" class="w">Удмурт кыл</span> так и переводится: «удмуртский язык», а
    <span lang="udm" class="w">кыл</span> — это и «язык», и «слово».
  </p>
  <p class="sub2 muted">
    Здесь коротко и без зубрёжки: откуда язык взялся, кто на нём говорит, как он устроен и чем удивляет. Каждый факт — со ссылкой на источник.
  </p>

  <ul class="facts">
    {#each INTRO_FACTS as f, i (f.label)}
      <li class="fact" class:wide={f.wide} use:reveal={{ delay: i * 70 }}>
        <span class="num"><CountUp value={f.value} from={f.from} plain={f.plain} /></span>
        <span class="label">{f.label}</span>
        {#if f.letters}
          <span class="letters" lang="udm">{f.letters}</span>
        {/if}
        <span class="note">{f.note}</span>
      </li>
    {/each}
  </ul>

  <Sources items={INTRO_SOURCES} />
</section>

<style>
  .hero {
    padding-top: 8px;
  }
  .top {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: -6px;
  }
  .kicker {
    margin: 0 0 10px;
    font: 700 0.78rem/1 var(--font-head);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--red);
  }
  .mascot {
    flex: none;
  }
  h1 {
    margin: 0;
    font-size: clamp(2.7rem, 1.6rem + 6vw, 4.4rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  .thread {
    display: block;
    width: min(100%, 340px);
    height: 22px;
    margin: 6px 0 18px;
    overflow: visible;
  }
  .thread path {
    fill: none;
    stroke: var(--red);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .sub {
    font-size: 1.15rem;
    margin-bottom: 0.6em;
    text-wrap: pretty;
  }
  .w {
    font-family: var(--font-head);
    font-weight: 600;
    color: var(--red);
  }
  .sub2 {
    margin-bottom: 24px;
  }
  .facts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .fact {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px 14px 16px;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    min-width: 0;
  }
  .fact.wide {
    grid-column: 1 / -1;
  }
  .num {
    font: 800 clamp(1.7rem, 1.2rem + 2.4vw, 2.4rem) / 1.1 var(--font-head);
    color: var(--red);
    letter-spacing: -0.01em;
  }
  .wide .num {
    font-size: clamp(2.2rem, 1.4rem + 4vw, 3rem);
  }
  .label {
    font-weight: 700;
    line-height: 1.25;
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  .letters {
    font: 700 1.5rem/1.2 var(--font-head);
    letter-spacing: 0.12em;
    margin-top: 2px;
  }
  .note {
    font-size: 0.85rem;
    line-height: 1.35;
    color: var(--muted);
    overflow-wrap: anywhere;
    hyphens: auto;
  }
  @media (min-width: 640px) {
    .facts {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .fact.wide {
      grid-column: span 2;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .thread path {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
      animation: ab-draw 1300ms var(--ease-enter) 200ms forwards;
    }
    :global(html:not([data-motion='reduce'])) h1 {
      animation: rise var(--dur-slow) var(--ease-enter) both;
    }
  }
  @keyframes ab-draw {
    to {
      stroke-dashoffset: 0;
    }
  }
</style>
