<script lang="ts">
  /** «Интересное»: карточки-вопросы, которые переворачиваются по нажатию. */
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { reveal } from './reveal';
  import { FACT_CARDS, FACTS_SOURCES } from '../../data/about/facts';

  let open = $state<Record<string, boolean>>({});
  const flip = (id: string) => (open[id] = !open[id]);
</script>

<Section
  id="facts"
  kicker="Интересное"
  title="Удивительное рядом"
  lead="Евровидение, Википедия, города и даже пельмени. Нажмите на карточку — она перевернётся."
  sources={FACTS_SOURCES}
>
  <ul class="cards">
    {#each FACT_CARDS as c, i (c.id)}
      <li use:reveal={{ delay: (i % 2) * 70 }}>
        <button type="button" class="flip" class:on={open[c.id]} aria-expanded={!!open[c.id]} onclick={() => flip(c.id)}>
          <span class="inner">
            <span class="face front" aria-hidden={open[c.id] ? 'true' : undefined}>
              <span class="fw" lang={c.frontLang}>{c.front}</span>
              <span class="ask">{c.ask}</span>
              <span class="turn" aria-hidden="true">
                <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8a5 5 0 0 1 8.6-3.5M13 8a5 5 0 0 1-8.6 3.5M11 2v3h-3M5 14v-3h3" /></svg>
                перевернуть
              </span>
            </span>
            <span class="face back" aria-hidden={open[c.id] ? undefined : 'true'}>
              <span class="bt">{c.title}</span>
              <span class="bx"><Rich text={c.text} /></span>
              <span class="bs">
                Источник: {c.src.map((s) => s.label).join('; ')}
              </span>
            </span>
          </span>
        </button>
      </li>
    {/each}
  </ul>
</Section>

<style>
  .cards {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr));
    gap: 12px;
  }
  .flip {
    appearance: none;
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
    color: var(--ink);
    perspective: 900px;
    -webkit-tap-highlight-color: transparent;
    border-radius: var(--radius);
  }
  .inner {
    display: grid;
    height: 100%;
    transform-style: preserve-3d;
  }
  .face {
    grid-area: 1 / 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-height: 168px;
    padding: 16px 16px 14px;
    border-radius: var(--radius);
    border: 2px solid var(--line);
    box-shadow: 0 4px 0 var(--line);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .front {
    background: var(--surface);
    justify-content: space-between;
  }
  .back {
    background: var(--red-soft);
    border-color: color-mix(in srgb, var(--red) 35%, var(--line));
    box-shadow: 0 4px 0 color-mix(in srgb, var(--red) 35%, var(--line));
    transform: rotateY(180deg);
  }
  .on .inner {
    transform: rotateY(180deg);
  }
  .fw {
    font: 800 1.9rem/1.1 var(--font-head);
    color: var(--red);
    overflow-wrap: anywhere;
  }
  .ask {
    font-weight: 600;
    line-height: 1.35;
  }
  .turn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font: 700 0.72rem/1 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .turn path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .bt {
    font: 700 1.05rem/1.2 var(--font-head);
  }
  .bx {
    font-size: 0.93rem;
    line-height: 1.45;
  }
  .bs {
    margin-top: auto;
    font-size: 0.72rem;
    color: var(--muted);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .inner {
      transition: transform 700ms var(--spring-soft);
    }
    :global(html:not([data-motion='reduce'])) .flip:hover:not(.on) .inner {
      transform: rotateY(-8deg);
    }
  }
</style>
