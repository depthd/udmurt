<script lang="ts">
  /** Наречия: схема Удмуртии (условный контур) с зонами наречий и городами-кнопками, карточки наречий. */
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { inview, reveal } from './reveal';
  import { MAP_W, MAP_H, OUTLINE, RIVERS, ZONE_Y, proj } from '../../data/about/geo';
  import { BESERM, CITIES, DIALECTS, DIALECT_SOURCES, cityPt } from '../../data/about/dialects';

  let shown = $state(false);
  let sel = $state('glazov');
  const city = $derived(CITIES.find((c) => c.id === sel) ?? CITIES[0]);

  const sw = proj(51.45, 56.3);
  const se = proj(54.35, 56.1);
</script>

<Section
  id="dialects"
  kicker="Наречия"
  title="Как говорят на севере и на юге"
  lead="Удмурты из разных районов понимают друг друга без труда: наречия различаются в основном произношением и отдельными словами."
  sources={DIALECT_SOURCES}
>
  <figure class="map card" use:reveal>
    <div class="stage" class:shown use:inview={() => (shown = true)}>
      <svg viewBox="0 0 {MAP_W} {MAP_H}" aria-hidden="true">
        <defs>
          <clipPath id="ab-udm-clip"><path d={OUTLINE} /></clipPath>
          <pattern id="ab-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="6" class="hatch" />
          </pattern>
        </defs>
        <g clip-path="url(#ab-udm-clip)" class="zones">
          <rect class="z z-north" x="0" y="0" width={MAP_W} height={ZONE_Y.northTo} />
          <rect class="z z-mid" x="0" y={ZONE_Y.northTo} width={MAP_W} height={ZONE_Y.middleTo - ZONE_Y.northTo} />
          <rect class="z z-mid-h" x="0" y={ZONE_Y.northTo} width={MAP_W} height={ZONE_Y.middleTo - ZONE_Y.northTo} fill="url(#ab-hatch)" />
          <rect class="z z-south" x="0" y={ZONE_Y.middleTo} width={MAP_W} height={MAP_H - ZONE_Y.middleTo} />
        </g>
        <path class="outline" d={OUTLINE} pathLength="1" />
        <path class="river" d={RIVERS.cheptsa} pathLength="1" />
        <path class="river" d={RIVERS.kama} pathLength="1" />
        <ellipse class="beserm" cx={BESERM.x} cy={BESERM.y} rx={BESERM.rx} ry={BESERM.ry} />
        <path class="arrow" d="M {sw.x} {sw.y} Q {sw.x - 6} {sw.y + 14} {sw.x - 18} {sw.y + 22}" />
        <path class="arrow" d="M {se.x} {se.y} Q {se.x + 8} {se.y + 12} {se.x + 20} {se.y + 18}" />

        <text class="zl" x="122" y="44">северное</text>
        <text class="zl sm" x="122" y="167">срединные говоры</text>
        <text class="zl" x="128" y="303">южное</text>
        <text class="zl sm b" x={BESERM.x} y={BESERM.y - BESERM.ry - 6}>бесермянское</text>
        <text class="rl" x="168" y="150" lang="udm">Чупчи</text>
        <text class="rl" x="219" y="168" lang="udm">Кам</text>
      </svg>

      {#each CITIES as c, i (c.id)}
        {@const p = cityPt(c)}
        <button
          type="button"
          class="city {c.side}"
          class:ours={c.id === 'glazov'}
          class:on={sel === c.id}
          style:left="{(p.x / MAP_W) * 100}%"
          style:top="{(p.y / MAP_H) * 100}%"
          style:--d="{500 + i * 90}ms"
          aria-pressed={sel === c.id}
          onclick={() => (sel = c.id)}
        >
          <span class="pin" aria-hidden="true"></span>
          <span class="nm"><span class="u" lang="udm">{c.udm}</span><span class="r">{c.ru}</span></span>
        </button>
      {/each}
    </div>

    <div class="info" aria-live="polite">
      <p class="info-h">
        {city.ru} — по-удмуртски <span lang="udm" class="w">{city.udm}</span>{#if city.alt}<span class="alt">
            (также <span lang="udm">{city.alt}</span>)</span
          >{/if}
      </p>
      <p class="info-t"><Rich text={city.info} /></p>
    </div>

    <figcaption class="cap muted">
      Схема, а не карта: контур республики и границы наречий условные. Стрелки внизу — периферийно-южные говоры за пределами республики.
    </figcaption>
  </figure>

  <ul class="dl">
    {#each DIALECTS as d, i (d.id)}
      <li class="dcard d-{d.id}" use:reveal={{ delay: i * 60 }}>
        <span class="sw" aria-hidden="true"></span>
        <h3>{d.name}</h3>
        <p class="where">{d.where}</p>
        <p class="txt"><Rich text={d.text} /></p>
      </li>
    {/each}
  </ul>

  <p class="note">
    Классификации немного различаются. В. И. Алатырев (1983) называет четыре наречия: северное, южное, периферийно-южное и бесермянское. В. К. Кельмаков
    считает периферийно-южные говоры частью южного наречия и отдельно выделяет переходные, срединные говоры. Литературный язык сложился на основе северного и
    южного наречий с учётом срединных говоров.
  </p>
</Section>

<style>
  .map {
    margin: 0 0 18px;
    padding: 12px;
    --z-north: color-mix(in srgb, var(--red) 16%, var(--surface));
    --z-south: color-mix(in srgb, var(--amber) 18%, var(--surface));
    --z-mid: color-mix(in srgb, var(--red) 8%, color-mix(in srgb, var(--amber) 10%, var(--surface)));
  }
  .stage {
    position: relative;
    max-width: 380px;
    margin: 0 auto;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }
  .z-north {
    fill: var(--z-north);
  }
  .z-mid {
    fill: var(--z-mid);
  }
  .hatch {
    stroke: color-mix(in srgb, var(--red) 25%, transparent);
    stroke-width: 1.5;
  }
  .z-south {
    fill: var(--z-south);
  }
  .outline {
    fill: none;
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-dasharray: 1;
  }
  .river {
    fill: none;
    stroke: var(--blue);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 1;
    opacity: 0.8;
  }
  .beserm {
    fill: url(#ab-hatch);
    stroke: var(--red);
    stroke-width: 1.5;
    stroke-dasharray: 4 4;
  }
  .arrow {
    fill: none;
    stroke: var(--muted);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 3 5;
  }
  .zl {
    font: 700 11px var(--font-head);
    fill: var(--ink);
    text-anchor: middle;
    letter-spacing: 0.04em;
    paint-order: stroke;
    stroke: var(--surface);
    stroke-width: 3px;
    stroke-linejoin: round;
  }
  .zl.sm {
    font-size: 9.5px;
  }
  .zl.b {
    fill: var(--red);
  }
  .rl {
    font: italic 600 9.5px var(--font-head);
    fill: var(--blue);
  }
  .city {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px 2px 0;
    margin: 0;
    border: 0;
    background: none;
    cursor: pointer;
    transform: translate(-7px, -50%);
    color: var(--ink);
    -webkit-tap-highlight-color: transparent;
    min-height: 36px;
  }
  .city.left {
    flex-direction: row-reverse;
    padding: 2px 0 2px 6px;
    transform: translate(calc(-100% + 7px), -50%);
    text-align: right;
  }
  .pin {
    flex: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--ink);
    border: 3px solid var(--surface);
    box-shadow: 0 0 0 1.5px var(--ink);
  }
  .ours .pin {
    background: var(--red);
    box-shadow: 0 0 0 1.5px var(--red);
  }
  .city.on .pin {
    box-shadow:
      0 0 0 1.5px var(--ink),
      0 0 0 5px color-mix(in srgb, var(--focus) 45%, transparent);
  }
  .nm {
    display: flex;
    flex-direction: column;
    line-height: 1.05;
    padding: 3px 5px;
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface) 82%, transparent);
  }
  .city.on .nm {
    background: var(--blue-soft);
    outline: 2px solid var(--focus);
  }
  .u {
    font: 700 0.86rem/1.1 var(--font-head);
  }
  .ours .u {
    color: var(--red);
  }
  .r {
    font-size: 0.68rem;
    color: var(--muted);
  }
  .info {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--surface-2);
    min-height: 84px;
  }
  .info p {
    margin: 0;
  }
  .info-h {
    font-weight: 700;
    margin-bottom: 4px !important;
  }
  .w {
    font-family: var(--font-head);
    color: var(--red);
  }
  .alt {
    font-weight: 500;
    color: var(--muted);
  }
  .info-t {
    font-size: 0.95rem;
  }
  .cap {
    margin-top: 10px;
    font-size: 0.8rem;
  }
  .dl {
    list-style: none;
    margin: 0 0 16px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
  }
  .dcard {
    position: relative;
    padding: 14px 16px 14px 18px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 2px solid var(--line);
    overflow: hidden;
  }
  .dcard .sw {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    background: var(--k);
  }
  .d-north {
    --k: var(--red);
  }
  .d-south {
    --k: var(--amber);
  }
  .d-periphery {
    --k: var(--muted);
  }
  .d-beserm {
    --k: repeating-linear-gradient(45deg, var(--red) 0 4px, transparent 4px 8px);
  }
  .dcard h3 {
    margin: 0 0 2px;
  }
  .where {
    margin: 0 0 6px;
    font-size: 0.85rem;
    color: var(--muted);
    font-weight: 600;
  }
  .txt {
    margin: 0;
    font-size: 0.95rem;
  }
  .note {
    font-size: 0.92rem;
    color: var(--muted);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .stage:not(.shown) .outline,
    :global(html:not([data-motion='reduce'])) .stage:not(.shown) .river {
      stroke-dashoffset: 1;
    }
    :global(html:not([data-motion='reduce'])) .outline {
      transition: stroke-dashoffset 1400ms var(--ease-enter);
    }
    :global(html:not([data-motion='reduce'])) .river {
      transition: stroke-dashoffset 1100ms var(--ease-enter) 500ms;
    }
    :global(html:not([data-motion='reduce'])) .zones,
    :global(html:not([data-motion='reduce'])) .zl,
    :global(html:not([data-motion='reduce'])) .rl,
    :global(html:not([data-motion='reduce'])) .beserm,
    :global(html:not([data-motion='reduce'])) .arrow {
      transition: opacity 600ms var(--ease-standard) 700ms;
    }
    :global(html:not([data-motion='reduce'])) .stage:not(.shown) :is(.zones, .zl, .rl, .beserm, .arrow) {
      opacity: 0;
    }
    :global(html:not([data-motion='reduce'])) .city {
      transition:
        opacity 250ms linear var(--d),
        scale var(--spring-pop-dur) var(--spring-pop) var(--d);
    }
    :global(html:not([data-motion='reduce'])) .stage:not(.shown) .city {
      opacity: 0;
      scale: 0.6;
    }
    :global(html:not([data-motion='reduce'])) .pin {
      transition: box-shadow var(--dur-fast);
    }
  }
</style>
