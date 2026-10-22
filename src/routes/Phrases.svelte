<script lang="ts">
  /**
   * Разговорник: все фразы курса по юнитам (с озвучкой и разбором) и все шпаргалки юнитов на одной странице.
   * Удобно открыть перед парой. Поиск — по-удмуртски (можно без ӧ/ӥ) и по-русски.
   */
  import { course, lexicon, personalize } from '$lib/course';
  import type { LexItem } from '$lib/content/schema';
  import { exerciseRefs } from '$lib/content/refs';
  import { renderMarkdown } from '$lib/markdown';
  import { searchKey } from '$lib/dict';
  import { href } from '$lib/router.svelte';
  import AudioButton from '../components/exercise/AudioButton.svelte';
  import MorphemeBreakdown from '../components/exercise/MorphemeBreakdown.svelte';

  // Юнит слова — первый юнит, в уроках которого оно встречается.
  const byUnit = course.units.map((u) => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const l of u.lessons) for (const ex of l.exercises) for (const r of exerciseRefs(ex)) if (!seen.has(r)) (seen.add(r), ids.push(r));
    return { unit: u, ids };
  });
  const firstUnit = new Map<string, number>();
  byUnit.forEach(({ ids }, i) => ids.forEach((id) => firstUnit.has(id) || firstUnit.set(id, i)));
  const groups = byUnit.map(({ unit }, i) => ({
    unit,
    n: i + 1,
    items: [...firstUnit].filter(([, u]) => u === i).map(([id]) => lexicon.get(id) as LexItem),
  }));

  let tab = $state<'phrases' | 'guides'>('phrases');
  let query = $state('');
  let unitFilter = $state(0); // 0 — все
  let kind = $state<'phrase' | 'all'>('phrase');
  let open = $state<string | null>(null);

  const match = (it: LexItem, q: string) => !q || searchKey(personalize(`${it.udm} ${(it.udm_alt ?? []).join(' ')}`)).includes(q) || searchKey(`${it.ru} ${(it.ru_alt ?? []).join(' ')}`).includes(q);
  const shown = $derived.by(() => {
    const q = searchKey(query.trim());
    return groups
      .filter((g) => !unitFilter || g.n === unitFilter)
      .map((g) => ({ ...g, items: g.items.filter((it) => (kind === 'all' || it.kind === 'phrase') && match(it, q)) }))
      .filter((g) => g.items.length);
  });
  const total = $derived(shown.reduce((s, g) => s + g.items.length, 0));

  const guideHtml = (g: string) => renderMarkdown(personalize(g), { headingShift: 1, strongLang: 'udm', strongClass: 'udm' });
</script>

<section class="page phrasebook">
  <header class="rise">
    <h1>Разговорник</h1>
    <p class="lead">Все фразы курса по темам и все шпаргалки на одной странице — удобно повторить перед парой.</p>
  </header>

  <div class="tabs" role="tablist" aria-label="Раздел">
    <button role="tab" aria-selected={tab === 'phrases'} class:on={tab === 'phrases'} onclick={() => (tab = 'phrases')} data-testid="tab-phrases">Фразы</button>
    <button role="tab" aria-selected={tab === 'guides'} class:on={tab === 'guides'} onclick={() => (tab = 'guides')} data-testid="tab-guides">Шпаргалки</button>
  </div>

  <div class="chips" role="group" aria-label="Юнит">
    <button class="fchip" class:on={!unitFilter} aria-pressed={!unitFilter} onclick={() => (unitFilter = 0)}>Все</button>
    {#each groups as g (g.unit.id)}
      <button class="fchip" class:on={unitFilter === g.n} aria-pressed={unitFilter === g.n} onclick={() => (unitFilter = unitFilter === g.n ? 0 : g.n)}>
        {g.n}. {g.unit.title}
      </button>
    {/each}
  </div>

  {#if tab === 'phrases'}
    <div class="tools">
      <input class="search" type="search" bind:value={query} placeholder="Поиск: «где», «кытын», «тау»…" aria-label="Поиск по фразам" />
      <label class="sw"><input type="checkbox" checked={kind === 'all'} onchange={(e) => (kind = e.currentTarget.checked ? 'all' : 'phrase')} /> и отдельные слова</label>
    </div>
    <p class="muted found" role="status">Найдено: {total}</p>

    {#each shown as g (g.unit.id)}
      <h2 class="ut"><span class="n">{g.n}</span> {g.unit.title}{#if g.unit.title_udm}<span class="udm muted" lang="udm"> · {personalize(g.unit.title_udm)}</span>{/if}</h2>
      <ul class="list">
        {#each g.items as it (it.id)}
          <li class="ph" class:open={open === it.id}>
            <div class="ph-row">
              <button class="ph-main" aria-expanded={open === it.id} onclick={() => (open = open === it.id ? null : it.id)}>
                {#if it.emoji}<span class="em" aria-hidden="true">{it.emoji}</span>{/if}
                <span class="tx">
                  <span class="u udm" lang="udm">{personalize(it.udm)}</span>
                  <span class="r">{personalize(it.ru)}</span>
                </span>
              </button>
              <AudioButton audio={it.audio} size="sm" synth={it.audio_synth} />
            </div>
            {#if open === it.id}
              <div class="more">
                {#if it.morphemes.length > 1}<MorphemeBreakdown morphemes={it.morphemes} />{/if}
                {#if it.note}<p class="note">💡 {personalize(it.note)}</p>{/if}
                {#if it.udm_alt?.length}<p class="muted small">Можно и так: <span class="udm" lang="udm">{it.udm_alt.map(personalize).join(' · ')}</span></p>{/if}
                <p class="muted small">
                  Источник: {it.sources.map((s) => s.id + (s.ref ? ` #${s.ref}` : '')).join(', ')} ·
                  {it.status === 'verified' ? 'проверено носителем' : 'ждёт проверки носителем'}
                </p>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p class="muted">Ничего не нашлось. Попробуйте <a href={href(`/dict/${encodeURIComponent(query)}`)}>поискать в словаре</a>.</p>
    {/each}
  {:else}
    {#each groups.filter((g) => g.unit.guide && (!unitFilter || g.n === unitFilter)) as g (g.unit.id)}
      <article class="card guide">
        <h2 class="ut"><span class="n">{g.n}</span> {g.unit.title}</h2>
        <div class="md">{@html guideHtml(g.unit.guide ?? '')}</div>
      </article>
    {/each}
  {/if}

  <p class="muted foot">Хотите почитать связный текст? <a href={href('/read')}>Читалка →</a></p>
</section>

<style>
  h1 {
    margin: 0 0 6px;
  }
  .lead {
    margin: 0 0 14px;
    line-height: 1.5;
  }
  .tabs {
    display: inline-flex;
    padding: 4px;
    gap: 4px;
    border-radius: 999px;
    background: var(--surface-2);
    margin-bottom: 12px;
  }
  .tabs button {
    border: 0;
    background: none;
    border-radius: 999px;
    padding: 8px 18px;
    font: 700 0.95rem var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  .tabs button.on {
    background: var(--surface);
    color: var(--fg);
    box-shadow: 0 1px 0 var(--line-strong);
  }
  .chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    margin-bottom: 10px;
    scrollbar-width: none;
  }
  .fchip {
    flex: none;
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 999px;
    padding: 7px 12px;
    font: 600 0.88rem var(--font-head);
    cursor: pointer;
    white-space: nowrap;
    color: inherit;
  }
  .fchip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .tools {
    display: grid;
    gap: 8px;
  }
  .search {
    height: 48px;
    padding: 0 16px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font: inherit;
    color: inherit;
    min-width: 0;
  }
  .search:focus {
    outline: none;
    border-color: var(--focus);
  }
  .sw {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .found {
    margin: 8px 0 4px;
    font-size: 0.85rem;
  }
  .ut {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    font-size: 1.05rem;
    margin: 18px 0 8px;
  }
  .ut .n {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--red);
    color: var(--on-fill);
    font-size: 0.85rem;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .ph {
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    padding: 6px 8px 6px 4px;
  }
  .ph.open {
    border-color: var(--line-strong);
  }
  .ph-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .ph-main {
    flex: 1;
    min-width: 0;
    display: flex;
    gap: 10px;
    align-items: center;
    text-align: left;
    border: 0;
    background: none;
    padding: 6px 8px;
    color: inherit;
    cursor: pointer;
    font: inherit;
  }
  .em {
    font-size: 1.3rem;
    flex: none;
  }
  .tx {
    display: grid;
    gap: 1px;
    min-width: 0;
  }
  .u {
    font-size: 1.05rem;
    overflow-wrap: anywhere;
  }
  .r {
    color: var(--muted);
    font-size: 0.92rem;
  }
  .more {
    padding: 4px 10px 8px;
  }
  .note {
    margin: 8px 0 4px;
    line-height: 1.45;
  }
  .small {
    font-size: 0.8rem;
    margin: 4px 0 0;
  }
  .guide {
    margin-bottom: 12px;
  }
  .guide .ut {
    margin-top: 0;
  }
  .md :global(h3) {
    margin: 16px 0 6px;
    font-size: 1rem;
  }
  .md :global(p) {
    margin: 0 0 8px;
    line-height: 1.5;
  }
  .md :global(ul) {
    margin: 0 0 10px;
    padding-left: 18px;
    display: grid;
    gap: 4px;
  }
  .md :global(strong.udm) {
    font-weight: 600;
    color: var(--red);
  }
  .foot {
    margin-top: 20px;
  }
</style>
