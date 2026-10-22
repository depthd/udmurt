<script lang="ts">
  /** Таблица родственных слов: чипы языков и тем, подсветка похожих начал, анимация появления строк. */
  import { COGNATES, COGNATES_INFO, GROUPS, LANGS, type CognateGroup, type LangId } from '../../../data/lang/cognates';
  import { splitSimilar } from '../../../data/lang/similar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let lang = $state<LangId>('fin');
  let group = $state<CognateGroup | 'all'>('num');
  let highlight = $state(true);

  const L = $derived(LANGS.find((l) => l.id === lang)!);
  const rows = $derived(COGNATES.filter((r) => group === 'all' || r.group === group));
  const stats = $derived.by(() => {
    let yes = 0;
    let no = 0;
    for (const r of rows) {
      const c = r.forms[lang];
      if (c?.cognate) yes++;
      else if (c) no++;
    }
    return { yes, no, total: rows.length };
  });

  const linkOf = (r: (typeof COGNATES)[number]) => r.source.find((s) => s.title.startsWith('UEW')) ?? r.source[0];
</script>

<div class="cog">
  <div class="ctrls">
    <Chips label="Язык для сравнения" options={LANGS.map((l) => ({ id: l.id, label: l.short }))} bind:value={lang} />
    <Chips label="Тема" options={GROUPS.map((g) => ({ id: g.id, label: g.ru }))} bind:value={group} small />
    <label class="hl-toggle">
      <input type="checkbox" bind:checked={highlight} />
      <span>Подсветить похожие звуки</span>
    </label>
  </div>

  <p class="stats" role="status" aria-live="polite">
    {L.ru}: <b>{stats.yes}</b> родственных из {stats.total}{#if stats.no}, другое слово — {stats.no}{/if}
  </p>

  {#key lang + group}
    <table class="tbl">
      <caption class="visually-hidden">Удмуртские слова и {L.ru} соответствия</caption>
      <thead>
        <tr>
          <th scope="col">Значение</th>
          <th scope="col">Удмуртский</th>
          <th scope="col">{L.short[0].toUpperCase() + L.short.slice(1)}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as r, i (r.id)}
          {@const c = r.forms[lang]}
          {@const s = c?.cognate && highlight ? splitSimilar(r.udm, c.w, L.script, lang === 'hun') : null}
          {@const src = linkOf(r)}
          <tr style="--i: {i}" class:diff={c && !c.cognate} class:none={!c}>
            <th scope="row">
              <span class="m">{r.ru}</span>
              {#if src.url}<a class="srcl" href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a>{/if}
            </th>
            <td>
              <span class="w" lang="udm">{#if s && s.udm[0]}<mark>{s.udm[0]}</mark>{s.udm[1]}{:else}{r.udm}{/if}</span>
              {#if r.udmGloss}<span class="g">«{r.udmGloss}»</span>{/if}
            </td>
            <td>
              {#if !c}
                <span class="na" title="Нет проверенной пары">нет проверенной пары</span>
              {:else if !c.cognate}
                <span class="ne" aria-hidden="true">≠</span>
                <span class="w other" lang={lang === 'kpv' ? 'kpv' : lang === 'mhr' ? 'mhr' : lang === 'hun' ? 'hu' : lang === 'fin' ? 'fi' : 'et'}>{c.w}</span>
                <span class="g">другое слово</span>
              {:else}
                <span class="w" lang={lang === 'kpv' ? 'kpv' : lang === 'mhr' ? 'mhr' : lang === 'hun' ? 'hu' : lang === 'fin' ? 'fi' : 'et'}
                  >{#if s && s.other[0]}<mark>{s.other[0]}</mark>{s.other[1]}{:else}{c.w}{/if}</span
                >
                {#if c.gloss}<span class="g">(<Rich text={c.gloss} />)</span>{/if}
              {/if}
              {#if r.note}<span class="note"><Rich text={r.note} /></span>{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/key}

  <p class="hn"><Rich text={COGNATES_INFO.highlightNote} /></p>
  <Sources source={COGNATES_INFO.source} />
</div>

<style>
  .cog {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .ctrls {
    display: grid;
    gap: 8px;
  }
  .hl-toggle {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    width: fit-content;
    font-weight: 600;
    cursor: pointer;
  }
  .hl-toggle input {
    width: 20px;
    height: 20px;
    accent-color: var(--red);
  }
  .stats {
    margin: 0;
    color: var(--muted);
  }
  .stats b {
    color: var(--green);
  }
  .tbl {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .tbl th,
  .tbl td {
    padding: 9px 8px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    overflow-wrap: anywhere;
  }
  .tbl tr:last-child > * {
    border-bottom: 0;
  }
  .tbl thead th {
    background: var(--surface-2);
    font: 700 0.75rem/1.2 var(--font-head);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .tbl thead th:first-child,
  .tbl tbody th {
    width: 30%;
  }
  .tbl tbody th {
    font-weight: 400;
  }
  .m {
    display: block;
    font-weight: 600;
  }
  .srcl {
    display: inline-block;
    margin-top: 2px;
    font-size: 0.72rem;
    color: var(--muted);
  }
  .w {
    font: 700 1.1rem/1.3 var(--font-head);
  }
  mark {
    padding: 0 1px;
    border-radius: 4px;
    background: var(--red-soft);
    color: var(--red);
    box-shadow: inset 0 -2px 0 var(--red);
  }
  .g {
    display: block;
    font-size: 0.8rem;
    color: var(--muted);
  }
  .diff .other {
    color: var(--muted);
    text-decoration: line-through;
    text-decoration-color: var(--line-strong);
  }
  .ne {
    margin-right: 4px;
    color: var(--amber);
    font-weight: 800;
  }
  .na {
    font-size: 0.8rem;
    color: var(--muted);
    font-style: italic;
  }
  .note {
    display: block;
    margin-top: 4px;
    font-size: 0.8rem;
    line-height: 1.4;
    color: var(--muted);
  }
  .hn {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @keyframes mark-in {
    from {
      background-color: transparent;
      box-shadow: inset 0 0 0 var(--red);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) tbody tr {
      animation: row-in var(--spring-soft-dur) var(--spring-soft) both;
      animation-delay: calc(min(var(--i), 14) * 35ms);
    }
    :global(html:not([data-motion='reduce'])) mark {
      animation: mark-in 500ms var(--ease-enter) both;
      animation-delay: calc(min(var(--i), 14) * 35ms + 200ms);
    }
  }
</style>
