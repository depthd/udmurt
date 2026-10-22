<script lang="ts">
  /** «Ударение — обычно на последний слог»: показать/скрыть ударение, пара вера́ / ве́ра. */
  import { STRESS, type StressWord } from '../../../data/lang/alphabet';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let shown = $state(false);
</script>

{#snippet word(w: StressWord, on: boolean)}
  <span class="word" lang="udm">
    {#each w.syll as s, i (i)}<span class="syl" class:stressed={on && i === w.stress}>{s}</span>{/each}
  </span>
  {#if on}<span class="visually-hidden">, ударение на слог «{w.syll[w.stress]}»</span>{/if}
{/snippet}

<section class="stress card" aria-labelledby="stress-h">
  <h3 id="stress-h">Ударение — обычно на последний слог</h3>
  <p>{STRESS.rule}</p>

  <button type="button" class="btn btn--ghost btn--sm" aria-pressed={shown} onclick={() => (shown = !shown)}>
    {shown ? 'Скрыть ударение' : 'Показать ударение'}
  </button>

  <ul class="words">
    {#each STRESS.words as w (w.udm)}
      <li>{@render word(w, shown)} <span class="tr">{w.ru}</span></li>
    {/each}
  </ul>

  <h4>Исключения немногочисленны</h4>
  <ul class="exc">
    {#each STRESS.exceptions as e, i (i)}
      <li>
        <Rich text={e.text} />
        {#if e.pair}
          <span class="pair">
            {#each e.pair as w, j (j)}
              <span class="pw">{@render word(w, true)} <span class="tr">«{w.ru}»</span></span>
            {/each}
          </span>
        {/if}
        {#each e.examples as x (x.udm)}
          <span class="pw"><span class="word" lang="udm">{x.udm}</span> <span class="tr">«{x.ru}»</span></span>
        {/each}
      </li>
    {/each}
  </ul>
  <Sources source={STRESS.source} />
</section>

<style>
  .stress h3 {
    margin-top: 0;
  }
  .stress h4 {
    margin: 16px 0 6px;
    font-size: 1rem;
  }
  .words {
    list-style: none;
    margin: 14px 0 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px 18px;
  }
  .words li {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
  }
  .word {
    font: 600 1.2rem/1.6 var(--font-head);
  }
  .syl {
    position: relative;
    display: inline-block;
    padding: 0 1px;
    border-radius: 6px;
  }
  .syl + .syl {
    margin-left: 2px;
  }
  .syl + .syl::before {
    content: '';
    position: absolute;
    left: -2px;
    top: 50%;
    width: 2px;
    height: 2px;
    border-radius: 50%;
    background: var(--line-strong);
  }
  .stressed {
    color: var(--red);
    background: var(--red-soft);
  }
  .stressed::after {
    content: '';
    position: absolute;
    left: 50%;
    top: -3px;
    width: 7px;
    height: 7px;
    margin-left: -3.5px;
    border-radius: 50%;
    background: var(--red);
  }
  .tr {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .exc {
    margin: 0;
    padding-left: 1.1em;
    display: grid;
    gap: 8px;
  }
  .pair {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    margin-left: 4px;
  }
  .pw {
    display: inline-flex;
    gap: 6px;
    align-items: baseline;
    margin-right: 10px;
  }
  .exc .word {
    font-size: 1.05rem;
  }
  @keyframes pop-dot {
    from {
      transform: scale(0);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .syl {
      transition:
        color var(--dur-fast),
        background-color var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .stressed::after {
      animation: pop-dot var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
</style>
