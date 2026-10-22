<script lang="ts">
  /** Носители и статус: столбчатая диаграмма переписей (SVG, без библиотек), выводы и статус языка. */
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { inview, reveal } from './reveal';
  import { CENSUS, SPEAKERS_SOURCES } from '../../data/about/speakers';

  const W = 340,
    HC = 232,
    L = 40,
    R = 8,
    T = 24,
    B = 200,
    MAX = 750000;
  const GW = (W - L - R) / CENSUS.length;
  const BW = 24,
    GAP = 3,
    OFF = (GW - (2 * BW + GAP)) / 2;
  const y = (v: number) => B - (v / MAX) * (B - T);
  const ticks = [250000, 500000, 750000];
  const k = (v: number) => Math.round(v / 1000).toLocaleString('ru-RU');
  const n = (v: number) => v.toLocaleString('ru-RU');

  /** Столбик со скруглённым верхом (4px), прижатый к базовой линии. */
  function bar(x: number, v: number) {
    const top = y(v),
      r = Math.min(4, B - top);
    return `M ${x} ${B} V ${top + r} Q ${x} ${top} ${x + r} ${top} H ${x + BW - r} Q ${x + BW} ${top} ${x + BW} ${top + r} V ${B} Z`;
  }

  let shown = $state(false);
  let sel = $state(CENSUS.length - 1);
  const cur = $derived(CENSUS[sel]);
</script>

<Section
  id="speakers"
  kicker="Носители"
  title="Кто говорит по-удмуртски"
  lead="Удмуртским владеют около 256 тысяч человек. Это немало, но за двадцать лет таких людей стало почти вдвое меньше."
  sources={SPEAKERS_SOURCES}
>
  <figure class="chart card" use:reveal>
    <figcaption class="cap">
      <span class="cap-t">Переписи населения России</span>
      <ul class="legend">
        <li><span class="sw sw-eth" aria-hidden="true"></span>удмуртов по национальности</li>
        <li><span class="sw sw-spk" aria-hidden="true"></span>владеют удмуртским языком</li>
      </ul>
    </figcaption>

    <div class="plot" use:inview={() => (shown = true)}>
      <svg
        class:shown
        viewBox="0 0 {W} {HC}"
        role="img"
        aria-label="Столбчатая диаграмма. Удмуртов по национальности: 1989 — 714 833, 2002 — 636 906, 2010 — 552 299, 2021 — 386 465. Владеют удмуртским: 2002 — 463 837, 2010 — 324 338, 2021 — 255 877; за 1989 год сопоставимых данных нет."
      >
        {#each ticks as t (t)}
          <line class="grid" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
          <text class="ytick" x={L - 6} y={y(t) + 4} text-anchor="end">{k(t)}</text>
        {/each}
        <text class="ytick" x={L - 6} y={T - 10} text-anchor="end">тыс.</text>
        <line class="base" x1={L} x2={W - R} y1={B} y2={B} />

        {#each CENSUS as c, i (c.year)}
          {@const gx = L + i * GW + OFF}
          <g class="grp" class:sel={sel === i}>
            <rect class="hit" x={L + i * GW + 2} y={T - 14} width={GW - 4} height={B - T + 14} rx="10" />
            <path class="bar eth" d={bar(gx, c.ethnic)} style:--d="{i * 110}ms" />
            <text class="val" x={gx + BW / 2} y={y(c.ethnic) - 6} text-anchor="middle" style:--d="{i * 110 + 380}ms">{k(c.ethnic)}</text>
            {#if c.speakers !== null}
              <path class="bar spk" d={bar(gx + BW + GAP, c.speakers)} style:--d="{i * 110 + 60}ms" />
              <text class="val strong" x={gx + BW + GAP + BW / 2} y={y(c.speakers) - 6} text-anchor="middle" style:--d="{i * 110 + 440}ms"
                >{k(c.speakers)}</text
              >
            {:else}
              <text class="na" x={gx + BW + GAP + BW / 2} y={B - 8} text-anchor="middle">н/д</text>
            {/if}
          </g>
        {/each}
      </svg>

      <div class="years" style:padding-left="{(L / W) * 100}%" style:padding-right="{(R / W) * 100}%">
        {#each CENSUS as c, i (c.year)}
          <button type="button" class="yr" aria-pressed={sel === i} onclick={() => (sel = i)}>{c.label}</button>
        {/each}
      </div>
    </div>

    <div class="detail" aria-live="polite">
      <p class="d-y">{cur.year === 2021 ? 'Перепись 2020–2021' : `Перепись ${cur.year}`}</p>
      <p class="d-row"><span class="sw sw-eth" aria-hidden="true"></span>удмуртов: <b>{n(cur.ethnic)}</b></p>
      <p class="d-row">
        <span class="sw sw-spk" aria-hidden="true"></span>владеют языком: <b>{cur.speakers === null ? 'нет сопоставимых данных' : n(cur.speakers)}</b>
      </p>
      {#if cur.note}<p class="d-note">{cur.note}</p>{/if}
    </div>

    <details class="tbl">
      <summary>Таблица с точными цифрами</summary>
      <table>
        <thead>
          <tr><th scope="col">Перепись</th><th scope="col">Удмуртов</th><th scope="col">Владеют языком</th></tr>
        </thead>
        <tbody>
          {#each CENSUS as c (c.year)}
            <tr><th scope="row">{c.year === 2021 ? '2020–2021' : c.year}</th><td>{n(c.ethnic)}</td><td>{c.speakers === null ? '—' : n(c.speakers)}</td></tr>
          {/each}
        </tbody>
      </table>
    </details>
  </figure>

  <p class="how">
    <b>Как читать цифры.</b> Перепись задаёт разные вопросы: кто вы по национальности, какими языками владеете, какой язык для вас родной. Это три разные
    цифры, и путать их нельзя: не каждый удмурт говорит по-удмуртски.
  </p>

  <ul class="insights">
    <li class="ins" use:reveal>
      <span class="big">−45 %</span>
      <span>владеющих языком с 2002 по 2021 год: было 463 837, стало 255 877.</span>
    </li>
    <li class="ins" use:reveal={{ delay: 60 }}>
      <span class="big">32 %</span>
      <span>сельских жителей Удмуртии владеют удмуртским, а в городах — около 6 % (из ответивших о языках). Язык держится прежде всего в деревне.</span>
    </li>
    <li class="ins" use:reveal={{ delay: 120 }}>
      <span class="big">92,8 %</span>
      <span>носителей говорят и по-русски: почти все двуязычны.</span>
    </li>
    <li class="ins" use:reveal={{ delay: 180 }}>
      <span class="big">предмет</span>
      <span>В школах Удмуртии язык изучают как отдельный урок. Школ, где на удмуртском ведут обучение, по данным 2022 года не осталось.</span>
    </li>
  </ul>

  <h3 class="h3">Статус</h3>
  <ul class="status">
    <li>
      <b>Государственный язык</b> Удмуртской Республики — наравне с русским (Конституция УР, статья 8).
    </li>
    <li>
      <b>ЮНЕСКО:</b> в «Атласе языков мира, находящихся под угрозой» (2010) удмуртский отнесён к категории «определённо под угрозой» (definitely
      endangered). Так называют языки, которые дети уже не усваивают дома как родной.
    </li>
  </ul>

  <div class="why" use:reveal>
    <h3>Почему это важно</h3>
    <p>
      <Rich
        text={'Язык живёт, пока на нём говорят. Не обязательно сразу становиться знатоком: {udm:Ӟечбур!} — «здравствуй», {udm:Тау!} — «спасибо», пара фраз с бабушкой или соседкой — это уже поддержка.'}
      />
    </p>
    <p>В Глазове удмурты — больше чем каждый пятый житель (22,4 %). Поговорить есть с кем, а начать можно с пяти минут в день.</p>
  </div>
</Section>

<style>
  .chart {
    margin: 0 0 16px;
    padding: 14px 14px 12px;
    --bar-ctx: #9c8f80;
  }
  :global(:root[data-theme='dark']) .chart {
    --bar-ctx: #7a6d63;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) .chart {
      --bar-ctx: #7a6d63;
    }
  }
  .cap {
    margin-bottom: 6px;
  }
  .cap-t {
    display: block;
    font: 700 1rem/1.3 var(--font-head);
    margin-bottom: 6px;
  }
  .legend {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 0.85rem;
    color: var(--muted);
  }
  .legend li,
  .d-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sw {
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 3px;
  }
  .sw-eth {
    background: var(--bar-ctx);
  }
  .sw-spk {
    background: var(--red);
  }
  .plot svg {
    display: block;
    width: 100%;
    height: auto;
  }
  .grid {
    stroke: var(--line);
    stroke-width: 1;
  }
  .base {
    stroke: var(--line-strong);
    stroke-width: 1.5;
  }
  .ytick {
    font: 500 10px var(--font-text);
    fill: var(--muted);
  }
  .bar {
    transform-box: fill-box;
    transform-origin: 50% 100%;
  }
  .eth {
    fill: var(--bar-ctx);
  }
  .spk {
    fill: var(--red);
  }
  .val {
    font: 600 11px var(--font-head);
    fill: var(--muted);
  }
  .val.strong {
    font-weight: 800;
    fill: var(--ink);
  }
  .na {
    font: 600 10px var(--font-text);
    fill: var(--muted);
  }
  .hit {
    fill: transparent;
  }
  .grp.sel .hit {
    fill: var(--surface-2);
  }
  .years {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin-top: 2px;
  }
  .yr {
    appearance: none;
    border: 2px solid transparent;
    background: none;
    border-radius: 10px;
    min-height: 40px;
    font: 700 0.9rem/1 var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  .yr[aria-pressed='true'] {
    color: var(--ink);
    border-color: var(--line-strong);
    background: var(--surface-2);
  }
  .detail {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    background: var(--surface-2);
    font-size: 0.92rem;
  }
  .detail p {
    margin: 0;
  }
  .d-y {
    font: 700 0.9rem/1.4 var(--font-head);
  }
  .d-note {
    margin-top: 4px !important;
    color: var(--muted);
    font-size: 0.82rem;
  }
  .tbl {
    margin-top: 10px;
    font-size: 0.9rem;
  }
  .tbl summary {
    cursor: pointer;
    color: var(--blue);
    font-weight: 600;
    padding: 6px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-variant-numeric: tabular-nums;
  }
  th,
  td {
    text-align: right;
    padding: 6px 4px;
    border-bottom: 1px solid var(--line);
  }
  th:first-child {
    text-align: left;
  }
  .how {
    font-size: 0.95rem;
  }
  .insights {
    list-style: none;
    padding: 0;
    margin: 0 0 24px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
  }
  .ins {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 2px solid var(--line);
    font-size: 0.92rem;
    line-height: 1.4;
  }
  .big {
    font: 800 1.7rem/1.1 var(--font-head);
    color: var(--red);
  }
  .h3 {
    margin-top: 8px;
  }
  .status {
    margin: 0 0 20px;
    padding-left: 1.2em;
  }
  .status li {
    margin-bottom: 8px;
  }
  .why {
    padding: 16px 18px;
    border-radius: var(--radius-l);
    background: var(--red-soft);
    border: 2px solid color-mix(in srgb, var(--red) 30%, transparent);
  }
  .why h3 {
    color: var(--red);
  }
  .why p:last-child {
    margin: 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) svg:not(.shown) .bar {
      scale: 1 0;
    }
    :global(html:not([data-motion='reduce'])) .bar {
      transition: scale 900ms var(--spring-soft) var(--d);
    }
    :global(html:not([data-motion='reduce'])) svg:not(.shown) .val {
      opacity: 0;
    }
    :global(html:not([data-motion='reduce'])) .val {
      transition: opacity 300ms linear var(--d);
    }
    :global(html:not([data-motion='reduce'])) .hit,
    :global(html:not([data-motion='reduce'])) .yr {
      transition:
        fill var(--dur-fast),
        background-color var(--dur-fast),
        border-color var(--dur-fast);
    }
  }
</style>
