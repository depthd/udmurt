<script lang="ts">
  /**
   * Разбор слова по морфемам: цветные «кубики» форм с подписями значений.
   * Корень — сплошной красный кубик («нить»), суффикс — пунктирный синий с дефисом,
   * частица — пунктирный янтарный, отдельное слово — сплошной зелёный.
   * Приклеенные друг к другу части соединяются «+», отдельные слова стоят через пробел.
   */
  import type { Morpheme } from '$lib/content/schema';
  import { personalize } from '$lib/course';

  let { morphemes, caption = 'Из чего состоит' }: { morphemes: Morpheme[]; caption?: string } = $props();

  const KIND: Record<Morpheme['kind'], string> = {
    root: 'корень',
    suffix: 'суффикс',
    particle: 'частица',
    word: 'слово',
  };

  const parts = $derived(
    morphemes.map((m, i) => {
      const prev = morphemes[i - 1];
      const raw = personalize(m.form);
      const form = raw.replace(/^[-‑]+/, '');
      return {
        kind: m.kind,
        form: m.kind === 'suffix' || raw !== form ? `-${form}` : form,
        meaning: personalize(m.meaning),
        glued: !!prev && raw === form && prev.kind !== 'word' && m.kind !== 'word' && !(m.kind === 'root' && prev.kind === 'suffix'),
      };
    }),
  );
  const kinds = $derived([...new Set(parts.map((p) => p.kind))]);
  const legend = $derived(kinds.length > 1);
</script>

{#if parts.length}
  <figure class="mb">
    <figcaption class="cap">{caption}</figcaption>
    <ol class="row">
      {#each parts as p, i (i)}
        <li class="part" class:glued={p.glued} style:--i={i}>
          {#if i > 0}<span class="join" aria-hidden="true">{p.glued ? '+' : ''}</span>{/if}
          <span class="cube-wrap">
            <span class="cube cube--{p.kind}" lang="udm">{p.form}</span>
            <span class="meaning">{p.meaning}<span class="visually-hidden"> — {KIND[p.kind]}</span></span>
          </span>
        </li>
      {/each}
    </ol>
    {#if legend}
      <p class="legend" aria-hidden="true">
        {#each kinds as k (k)}
          <span class="key-item"><span class="swatch swatch--{k}"></span>{KIND[k]}</span>
        {/each}
      </p>
    {/if}
  </figure>
{/if}

<style>
  .mb {
    margin: 0;
    width: 100%;
  }
  .cap {
    margin-bottom: 10px;
    font: 700 0.72rem/1 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    text-align: center;
  }
  .row {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: flex-start;
    gap: 12px 18px;
  }
  /* Колонки делят строку поровну и переносятся, только если не влезают даже в ширину самого длинного слова. */
  .part {
    position: relative;
    flex: 1 1 0;
    min-width: min-content;
    max-width: 11rem;
    display: flex;
    justify-content: center;
  }
  /* «+» или пробел стоит ровно в промежутке между колонками */
  .join {
    position: absolute;
    top: 0;
    left: -18px;
    width: 18px;
    height: 44px;
    display: grid;
    place-items: center;
    font: 700 1rem/1 var(--font-head);
    color: var(--muted);
  }
  .cube-wrap {
    min-width: min-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .cube {
    display: inline-grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 6px 12px;
    border-radius: 12px;
    border: 2px solid var(--c);
    background: var(--bg-c);
    color: var(--ink);
    font: 600 1.2rem/1 var(--font-head);
    box-shadow: 0 3px 0 var(--c);
    white-space: nowrap;
  }
  .cube--root {
    --c: var(--red);
    --bg-c: var(--red-soft);
  }
  .cube--suffix {
    --c: var(--blue);
    --bg-c: var(--blue-soft);
    border-style: dashed;
    box-shadow: none;
    color: var(--blue);
  }
  .cube--particle {
    --c: var(--amber);
    --bg-c: var(--amber-soft);
    border-style: dashed;
    box-shadow: none;
  }
  .cube--word {
    --c: var(--green);
    --bg-c: var(--green-soft);
  }
  .meaning {
    font-size: 0.8rem;
    line-height: 1.3;
    color: var(--muted);
    text-align: center;
    text-wrap: balance;
    padding-inline: 2px;
  }
  .legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 6px 14px;
    margin: 12px 0 0;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .key-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .swatch {
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 2px solid var(--c);
    background: var(--bg-c);
  }
  .swatch--root {
    --c: var(--red);
    --bg-c: var(--red-soft);
  }
  .swatch--suffix {
    --c: var(--blue);
    --bg-c: var(--blue-soft);
    border-style: dashed;
  }
  .swatch--particle {
    --c: var(--amber);
    --bg-c: var(--amber-soft);
    border-style: dashed;
  }
  .swatch--word {
    --c: var(--green);
    --bg-c: var(--green-soft);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .part {
      animation: cube-in var(--spring-pop-dur) var(--spring-pop) both;
      animation-delay: calc(320ms + var(--i) * 90ms);
    }
  }
  @keyframes cube-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.7);
    }
    25% {
      opacity: 1;
    }
  }
</style>
