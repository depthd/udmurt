<script lang="ts">
  /**
   * Сравнение грамматики: удмуртский vs русский, финский, венгерский, татарский, английский.
   * Широкая таблица прокручивается горизонтально внутри своей рамки, первая колонка липкая.
   * Чипы «Сравнить с…» оставляют два столбца — так удобно на телефоне.
   */
  import { COMPARE_INFO, COMPARE_LANGS, GRAMMAR_COMPARE, type CmpLang } from '../../../data/lang/compare';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let focus = $state<CmpLang | 'all'>('all');
  const cols = $derived(focus === 'all' ? COMPARE_LANGS : COMPARE_LANGS.filter((l) => l.id === 'udm' || l.id === focus));
  const score = (id: CmpLang) => GRAMMAR_COMPARE.filter((r) => r.cells[id].like === 'same').length;
  const mark = { same: '✓', close: '≈', diff: '', self: '' } as const;
  const markLabel = { same: 'как в удмуртском', close: 'похоже', diff: '', self: '' } as const;
</script>

<div class="gc">
  <Chips
    label="Сравнить удмуртский с"
    options={[{ id: 'all', label: 'Все сразу' }, ...COMPARE_LANGS.filter((l) => l.id !== 'udm').map((l) => ({ id: l.id, label: l.ru }))]}
    bind:value={focus}
    small
  />
  <p class="legend">
    <span class="lg same">✓ как в удмуртском</span>
    <span class="lg close">≈ похоже</span>
  </p>

  <!-- Прокручиваемая область должна получать фокус, чтобы её можно было листать с клавиатуры. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div class="scroller" role="region" aria-label="Таблица сравнения грамматики" tabindex="0">
    <table class="tbl" class:two={focus !== 'all'}>
      <thead>
        <tr>
          <th scope="col" class="feat">Признак</th>
          {#each cols as l (l.id)}
            <th scope="col" class:udm={l.id === 'udm'}>
              {l.ru}
              <span class="fam">{l.note}</span>
              {#if l.id !== 'udm'}<span class="score">совпадений: {score(l.id)} из {GRAMMAR_COMPARE.length}</span>{/if}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each GRAMMAR_COMPARE as row, i (row.id)}
          <tr style="--i: {i}">
            <th scope="row" class="feat">{row.feature}</th>
            {#each cols as l (l.id)}
              {@const c = row.cells[l.id]}
              <td class="lk-{c.like}" class:udm={l.id === 'udm'}>
                {#if mark[c.like]}<span class="mk" aria-label={markLabel[c.like]}>{mark[c.like]}</span>{/if}
                <Rich text={c.text} />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="hint" aria-hidden="true">Таблица листается вбок →</p>
  <p class="take">{COMPARE_INFO.takeaway}</p>
  <Sources source={[...COMPARE_INFO.source, ...new Map(GRAMMAR_COMPARE.flatMap((r) => r.source).map((s) => [s.title, s])).values()]} />
</div>

<style>
  .gc {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0;
    font-size: 0.85rem;
  }
  .lg {
    padding: 2px 10px;
    border-radius: 999px;
  }
  .lg.same {
    background: var(--green-soft);
    color: var(--green);
    font-weight: 700;
  }
  .lg.close {
    background: var(--amber-soft);
    color: var(--amber);
    font-weight: 700;
  }
  .scroller {
    max-width: 100%;
    overflow-x: auto;
    overscroll-behavior-x: contain;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    -webkit-overflow-scrolling: touch;
  }
  .tbl {
    width: max(100%, 860px);
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.9rem;
  }
  .tbl.two {
    width: 100%;
    min-width: 0;
  }
  .tbl th,
  .tbl td {
    padding: 9px 10px;
    border-bottom: 1px solid var(--line);
    text-align: left;
    vertical-align: top;
    line-height: 1.35;
  }
  .tbl tbody tr:last-child > * {
    border-bottom: 0;
  }
  .tbl thead th {
    background: var(--surface-2);
    font: 700 0.9rem/1.2 var(--font-head);
    vertical-align: bottom;
  }
  .fam,
  .score {
    display: block;
    font: 400 0.72rem/1.3 var(--font-text);
    color: var(--muted);
  }
  .score {
    margin-top: 2px;
    font-weight: 700;
    color: var(--green);
  }
  .feat {
    position: sticky;
    left: 0;
    z-index: 1;
    width: 118px;
    min-width: 118px;
    background: var(--surface);
    box-shadow: 2px 0 0 var(--line);
    font-weight: 700;
  }
  thead .feat {
    background: var(--surface-2);
    z-index: 2;
  }
  .udm {
    background: color-mix(in oklab, var(--red-soft) 70%, var(--surface));
  }
  thead .udm {
    color: var(--red);
  }
  .lk-same {
    background: var(--green-soft);
  }
  .lk-close {
    background: var(--amber-soft);
  }
  .mk {
    display: inline-grid;
    place-items: center;
    width: 18px;
    height: 18px;
    margin-right: 4px;
    border-radius: 50%;
    font: 800 0.7rem/1 var(--font-head);
    vertical-align: 1px;
  }
  .lk-same .mk {
    background: var(--green);
    color: var(--on-fill);
  }
  .lk-close .mk {
    background: var(--amber);
    color: var(--on-fill);
  }
  .hint {
    margin: -4px 0 0;
    font-size: 0.8rem;
    color: var(--muted);
    text-align: right;
  }
  @media (min-width: 900px) {
    .hint {
      display: none;
    }
  }
  .take {
    margin: 0;
    padding: 12px 14px;
    border-left: 4px solid var(--red);
    border-radius: 0 var(--radius-s) var(--radius-s) 0;
    background: var(--surface-2);
    font-weight: 600;
  }
  @keyframes row-in {
    from {
      opacity: 0;
      transform: translateX(14px);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) tbody tr {
      animation: row-in var(--spring-soft-dur) var(--spring-soft) both;
      animation-delay: calc(var(--i) * 30ms);
    }
    :global(html:not([data-motion='reduce'])) .scroller {
      scroll-behavior: smooth;
    }
  }
</style>
