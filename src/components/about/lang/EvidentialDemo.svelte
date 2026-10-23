<script lang="ts">
  /** Очевидное и неочевидное прошедшее: «видел сам» / «узнал от других». */
  import { EVIDENTIAL } from '../../../data/lang/grammar';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let mode = $state<'witnessed' | 'reported'>('witnessed');
  const cur = $derived(EVIDENTIAL[mode]);
</script>

<div class="ev">
  <div class="opts" role="group" aria-label="Откуда говорящий знает">
    {#each ['witnessed', 'reported'] as const as m (m)}
      <button type="button" class="opt" aria-pressed={mode === m} onclick={() => (mode = m)}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          {#if m === 'witnessed'}
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
          {:else}
            <path d="M4 5h16v10H9l-5 4z" />
            <path d="M8 9h8M8 12h5" />
          {/if}
        </svg>
        {EVIDENTIAL[m].label}
      </button>
    {/each}
  </div>

  {#key mode}
    <div class="out" class:rep={mode === 'reported'}>
      <span class="tense">{cur.tense}</span>
      <p class="s" lang="udm">{cur.udm}</p>
      <p class="r">{cur.ru}</p>
    </div>
  {/key}
  <p class="visually-hidden" role="status" aria-live="polite">{cur.udm} — {cur.ru}</p>

  <p class="sum"><Rich text={EVIDENTIAL.summary} /></p>
  <p class="an">Со вспомогательными глаголами <span lang="udm" class="u">вал</span> «было» и <span lang="udm" class="u">вылэм</span> «было, оказывается» то же различие есть и в сложных временах:</p>
  <ul class="ex">
    {#each EVIDENTIAL.analytic as a (a.udm)}
      <li><span lang="udm" class="u">{a.udm}</span> — {a.ru}</li>
    {/each}
  </ul>
  <Sources source={EVIDENTIAL.source} />
</div>

<style>
  .ev {
    display: grid;
    gap: 10px;
  }
  .opts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .opt {
    appearance: none;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 48px;
    padding: 8px 10px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font: 700 0.92rem/1.15 var(--font-head);
    cursor: pointer;
  }
  .opt svg {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .opt[aria-pressed='true'] {
    border-color: var(--blue);
    background: var(--blue-soft);
  }
  .opt:last-child[aria-pressed='true'] {
    border-color: var(--amber);
    background: var(--amber-soft);
  }
  .out {
    display: grid;
    justify-items: center;
    padding: 16px 10px;
    border-radius: var(--radius);
    background: var(--blue-soft);
    text-align: center;
  }
  .out.rep {
    background: var(--amber-soft);
  }
  .tense {
    font: 700 0.75rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .s {
    margin: 6px 0 2px;
    font: 700 2rem/1.15 var(--font-head);
  }
  .r {
    margin: 0;
    font-weight: 600;
  }
  .sum,
  .an {
    margin: 0;
  }
  .u {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .ex {
    margin: 0;
    padding-left: 1.1em;
  }
  @keyframes swap {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.97);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .out {
      animation: swap var(--spring-soft-dur) var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .opt {
      transition:
        background-color var(--dur-fast),
        border-color var(--dur-fast);
    }
  }
</style>
