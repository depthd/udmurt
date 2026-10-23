<script lang="ts">
  /**
   * «Дерево» уральских языков: строки-кнопки поверх SVG с плавными ветками.
   * Ветки «прорисовываются» (stroke-dashoffset), когда дерево появляется на экране.
   * Красная нить ведёт от общего предка к удмуртскому.
   */
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { inview } from './reveal';
  import { FAMILY, FAMILY_SOURCES } from '../../data/about/family';

  const H = 46; // высота строки
  const IND = 22; // отступ уровня
  const DOT = 9; // x центра точки уровня 0

  const byId = new Map(FAMILY.map((n) => [n.id, n]));
  const depthOf = (id: string): number => {
    const p = byId.get(id)?.parent;
    return p ? depthOf(p) + 1 : 0;
  };
  const rows = FAMILY.map((n, row) => ({ ...n, row, depth: depthOf(n.id) }));
  const rowById = new Map(rows.map((r) => [r.id, r]));

  // Цепочка предков удмуртского — «красная нить».
  const thread = new Set<string>();
  for (let id: string | undefined = 'udm'; id; id = byId.get(id)?.parent) thread.add(id);

  const cx = (depth: number) => DOT + depth * IND;
  const cy = (row: number) => row * H + H / 2;

  const links = rows
    .filter((r) => r.parent)
    .map((r) => {
      const p = rowById.get(r.parent!)!;
      const x1 = cx(p.depth),
        y1 = cy(p.row),
        x2 = cx(r.depth),
        y2 = cy(r.row);
      return {
        id: r.id,
        red: thread.has(r.id),
        delay: p.row * 90 + (r.row - p.row) * 40,
        d: `M ${x1} ${y1 + 7} V ${y2 - 10} Q ${x1} ${y2} ${x1 + 10} ${y2} H ${x2 - 6}`,
      };
    });
  // Красные ветки рисуем поверх серых.
  const ordered = [...links.filter((l) => !l.red), ...links.filter((l) => l.red)];

  let drawn = $state(false);
  let sel = $state<string | null>(null);
  let treeEl: HTMLDivElement;

  const selRow = $derived(sel ? rowById.get(sel) : undefined);
  const popBelow = $derived(selRow ? selRow.row < rows.length - 4 : true);

  function toggle(id: string) {
    sel = sel === id ? null : id;
  }
  function onWindowClick(e: MouseEvent) {
    if (sel && treeEl && !treeEl.contains(e.target as Node)) sel = null;
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && sel) {
      const id = sel;
      sel = null;
      treeEl?.querySelector<HTMLButtonElement>(`[data-node="${id}"]`)?.focus();
    }
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKey} />

<Section
  id="family"
  kicker="Родство"
  title="Семья языков"
  lead="Удмуртский — из большой уральской семьи. Его ближайшая родня — два коми языка, а финский и венгерский — родственники очень дальние."
  sources={FAMILY_SOURCES}
>
  <p class="hint">Нажмите на язык или группу — появится короткая подсказка. Красная нить ведёт от общего предка к удмуртскому.</p>

  <div class="tree" class:drawn bind:this={treeEl} use:inview={() => (drawn = true)} style:height="{rows.length * H}px">
    <svg class="lines" width="100%" height={rows.length * H} aria-hidden="true">
      {#each ordered as l (l.id)}
        <path class="ln" class:red={l.red} d={l.d} pathLength="1" style:--d="{l.delay}ms" />
      {/each}
      {#each rows as r (r.id)}
        <g class="dot" class:grp={r.kind === 'group'} class:red={thread.has(r.id)} class:ours={r.ours} style:--d="{r.row * 90}ms">
          {#if r.ours}<circle class="ring" cx={cx(r.depth)} cy={cy(r.row)} r="11" />{/if}
          <circle cx={cx(r.depth)} cy={cy(r.row)} r={r.ours ? 7 : r.kind === 'group' ? 6 : 4.5} />
        </g>
      {/each}
    </svg>

    <ul class="rows">
      {#each rows as r (r.id)}
        <li style:top="{r.row * H}px" style:left="{cx(r.depth) + 12}px" style:height="{H}px" style:--d="{r.row * 90}ms">
          <button
            type="button"
            class="node"
            class:grp={r.kind === 'group'}
            class:ours={r.ours}
            class:on={sel === r.id}
            data-node={r.id}
            aria-expanded={sel === r.id}
            aria-controls={sel === r.id ? 'family-pop' : undefined}
            onclick={() => toggle(r.id)}
          >
            {r.label}
            {#if r.ours}<span class="self" lang="udm">удмурт кыл</span>{/if}
          </button>
        </li>
      {/each}
    </ul>

    {#if selRow}
      {#key selRow.id}
        <div
          id="family-pop"
          class="pop"
          class:above={!popBelow}
          role="region"
          aria-label="Подсказка: {selRow.label}"
          style:left="{Math.max(0, cx(selRow.depth) - 4)}px"
          style:top={popBelow ? `${(selRow.row + 1) * H - 4}px` : undefined}
          style:bottom={popBelow ? undefined : `${(rows.length - selRow.row) * H - 4}px`}
        >
          <p class="pop-t">{selRow.label}</p>
          <p class="pop-x"><Rich text={selRow.info} /></p>
          <button type="button" class="close" aria-label="Закрыть подсказку" onclick={() => (sel = null)}>
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 3 13 13 M13 3 3 13" /></svg>
          </button>
        </div>
      {/key}
    {/if}
  </div>

  <div class="myth card">
    <p class="myth-h">Частый миф</p>
    <p>
      «Финны и венгры понимают удмуртов». Нет: общие корни видны, но понимания текста нет. По оценке В. В. Напольских, разница примерно как
      между польским и немецким. А вот с коми удмурт иногда может понять простой текст.
    </p>
  </div>
  <p class="note muted">
    Схема упрощена: как именно ветвятся средние группы, лингвисты спорят. Угорские и самодийские языки показаны без подробностей.
  </p>
</Section>

<style>
  .hint {
    margin: 0 0 14px;
    color: var(--muted);
    font-size: 0.95rem;
  }
  .tree {
    position: relative;
    margin: 0 0 20px;
  }
  .lines {
    position: absolute;
    inset: 0;
    overflow: visible;
    pointer-events: none;
  }
  .ln {
    fill: none;
    stroke: var(--line-strong);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 0;
  }
  .ln.red {
    stroke: var(--red);
    stroke-width: 3.5;
  }
  .dot circle {
    fill: var(--surface);
    stroke: var(--line-strong);
    stroke-width: 2.5;
  }
  .dot:not(.grp) circle {
    fill: var(--line-strong);
    stroke: none;
  }
  .dot.red circle {
    stroke: var(--red);
  }
  .dot.ours circle {
    fill: var(--red);
    stroke: none;
  }
  .dot .ring {
    fill: none !important;
    stroke: var(--red) !important;
    stroke-width: 2 !important;
    opacity: 0.35;
  }
  .rows {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .rows li {
    position: absolute;
    right: 0;
    display: flex;
    align-items: center;
  }
  .node {
    appearance: none;
    border: 2px solid transparent;
    background: none;
    border-radius: 12px;
    padding: 6px 10px;
    min-height: 38px;
    font: 500 1rem/1.15 var(--font-text);
    text-align: left;
    cursor: pointer;
    color: var(--ink);
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    column-gap: 8px;
    -webkit-tap-highlight-color: transparent;
  }
  .node:hover {
    background: var(--surface-2);
  }
  .node.grp {
    font: 700 0.98rem/1.15 var(--font-head);
  }
  .node.ours {
    color: var(--red);
    font: 800 1.08rem/1.15 var(--font-head);
    background: var(--red-soft);
  }
  .node.on {
    border-color: var(--focus);
    background: var(--blue-soft);
  }
  .self {
    font: 600 0.8rem/1 var(--font-head);
    color: var(--red-edge);
  }
  .pop {
    position: absolute;
    right: 0;
    z-index: 3;
    padding: 12px 40px 12px 14px;
    background: var(--surface);
    border: 2px solid var(--ink);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    transform-origin: 24px 0;
  }
  .pop.above {
    transform-origin: 24px 100%;
  }
  .pop-t {
    margin: 0 0 4px;
    font: 700 0.95rem/1.2 var(--font-head);
  }
  .pop-x {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.45;
  }
  .close {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 50%;
    background: var(--surface-2);
    cursor: pointer;
  }
  .close path {
    stroke: var(--ink);
    stroke-width: 2;
    stroke-linecap: round;
  }
  .myth {
    border-left: 6px solid var(--red);
  }
  .myth-h {
    margin: 0 0 4px;
    font: 700 0.8rem/1 var(--font-head);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--red);
  }
  .myth p:last-child {
    margin: 0;
  }
  .note {
    margin: 12px 0 0;
    font-size: 0.9rem;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .tree:not(.drawn) .ln {
      stroke-dashoffset: 1;
    }
    :global(html:not([data-motion='reduce'])) .ln {
      transition: stroke-dashoffset 800ms var(--ease-enter) var(--d);
    }
    :global(html:not([data-motion='reduce'])) .dot {
      transform-box: fill-box;
      transform-origin: center;
      transition:
        scale var(--spring-pop-dur) var(--spring-pop) var(--d),
        opacity 200ms linear var(--d);
    }
    :global(html:not([data-motion='reduce'])) .tree:not(.drawn) .dot {
      scale: 0;
      opacity: 0;
    }
    :global(html:not([data-motion='reduce'])) .rows li {
      transition:
        opacity 400ms var(--ease-enter) var(--d),
        translate 500ms var(--spring-soft) var(--d);
    }
    :global(html:not([data-motion='reduce'])) .tree:not(.drawn) .rows li {
      opacity: 0;
      translate: -8px 0;
    }
    :global(html:not([data-motion='reduce'])) .dot.ours .ring {
      transform-box: fill-box;
      transform-origin: center;
      animation: ab-ring 2.4s var(--ease-standard) 1.8s infinite;
    }
    :global(html:not([data-motion='reduce'])) .pop {
      animation: ab-pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .node {
      transition:
        background-color var(--dur-fast),
        border-color var(--dur-fast);
    }
  }
  @keyframes ab-ring {
    0% {
      scale: 0.7;
      opacity: 0.6;
    }
    100% {
      scale: 1.8;
      opacity: 0;
    }
  }
  @keyframes ab-pop {
    from {
      opacity: 0;
      scale: 0.9;
    }
  }
</style>
