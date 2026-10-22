<script lang="ts">
  /** Карточка особой буквы: как звучит, примеры, как набрать. */
  import { codePoint, type SpecialLetter } from '../../../data/lang/alphabet';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let { letter, id }: { letter: SpecialLetter; id: string } = $props();

  let copied = $state('');
  async function copy(ch: string) {
    try {
      await navigator.clipboard.writeText(ch);
      copied = `Буква ${ch} скопирована`;
    } catch {
      copied = `Не получилось скопировать. Выделите букву ${ch} вручную.`;
    }
  }

  /** Разбить слово, чтобы подсветить особую букву. */
  function split(word: string, lower: string) {
    const out: { t: string; hl: boolean }[] = [];
    for (const ch of word) {
      const hl = ch.toLowerCase() === lower;
      const last = out[out.length - 1];
      if (last && last.hl === hl && !hl) last.t += ch;
      else out.push({ t: ch, hl });
    }
    return out;
  }
</script>

<article class="lcard" {id} aria-labelledby="{id}-h">
  <div class="hero" aria-hidden="true">
    <span class="glyph" lang="udm">{letter.upper}</span><span class="glyph small" lang="udm">{letter.lower}</span>
    <svg class="thread" viewBox="0 0 120 10" preserveAspectRatio="none"><path d="M2 6 C 30 1, 50 9, 80 4 S 110 5, 118 4" /></svg>
  </div>

  <div class="body">
    <h3 id="{id}-h">Буква <span lang="udm">{letter.upper} {letter.lower}</span></h3>

    <h4>Как звучит</h4>
    <p class="sound">{letter.sound}</p>
    <p class="hint"><Rich text={letter.hint} /></p>
    {#if letter.pair}<p class="pair"><Rich text={letter.pair} /></p>{/if}

    <h4>Примеры</h4>
    <ul class="ex">
      {#each letter.examples as e (e.udm)}
        <li>
          <span class="w" lang="udm">{#each split(e.udm, letter.lower) as s, i (i)}{#if s.hl}<b class="hl">{s.t}</b>{:else}{s.t}{/if}{/each}</span>
          <span class="tr">{e.ru}</span>
        </li>
      {/each}
    </ul>

    <h4>Как набрать</h4>
    <div class="keys">
      {#each [letter.lower, letter.upper] as ch (ch)}
        <button type="button" class="key" onclick={() => copy(ch)} aria-label="Скопировать букву {ch}, код {codePoint(ch)}">
          <span class="k" lang="udm">{ch}</span>
          <span class="code">{codePoint(ch)}</span>
          <span class="act" aria-hidden="true">копировать</span>
        </button>
      {/each}
    </div>
    <p class="status" role="status" aria-live="polite">{copied}</p>

    <Sources source={letter.source} />
  </div>
</article>

<style>
  .lcard {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px 20px;
    background: var(--surface);
    border: 2px solid color-mix(in oklab, var(--red) 40%, var(--line));
    border-radius: var(--radius-l);
    padding: 18px 18px 16px;
    box-shadow: var(--shadow);
  }
  @media (min-width: 560px) {
    .lcard {
      grid-template-columns: 150px 1fr;
      padding: 22px;
    }
  }
  .hero {
    position: relative;
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 8px;
    padding: 6px 0 14px;
    color: var(--red);
  }
  @media (min-width: 560px) {
    .hero {
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding-top: 10px;
    }
  }
  .glyph {
    font: 700 5.5rem/1 var(--font-head);
  }
  .glyph.small {
    font-size: 3.4rem;
    color: color-mix(in oklab, var(--red) 75%, var(--ink));
  }
  .thread {
    position: absolute;
    left: 15%;
    right: 15%;
    bottom: 0;
    width: 70%;
    height: 10px;
    overflow: visible;
  }
  .thread path {
    fill: none;
    stroke: var(--red);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 10 12;
  }
  h3 {
    margin: 0 0 6px;
    font-size: 1.25rem;
  }
  h4 {
    margin: 14px 0 4px;
    font: 700 0.78rem/1.2 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .sound {
    margin: 0 0 4px;
    font-weight: 700;
  }
  .hint,
  .pair {
    margin: 0 0 4px;
  }
  .pair {
    color: var(--muted);
  }
  .ex {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .ex li {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    padding: 6px 12px;
    background: var(--surface-2);
    border-radius: 999px;
  }
  .w {
    font: 600 1.1rem/1.3 var(--font-head);
  }
  .hl {
    color: var(--red);
    font-weight: 800;
  }
  .tr {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .keys {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .key {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    padding: 6px 12px 6px 8px;
    border: 2px solid var(--line);
    border-radius: var(--radius-s);
    background: var(--surface);
    box-shadow: 0 3px 0 var(--line);
    cursor: pointer;
  }
  .key:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--line);
  }
  .k {
    display: inline-grid;
    place-items: center;
    min-width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--red-soft);
    color: var(--red);
    font: 700 1.2rem/1 var(--font-head);
  }
  .code {
    font: 600 0.85rem/1 ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
  }
  .act {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .status {
    min-height: 1.2em;
    margin: 6px 0 0;
    font-size: 0.85rem;
    color: var(--green);
  }

  @keyframes drop {
    from {
      transform: translateY(-18px) scale(0.85);
      opacity: 0;
    }
  }
  @keyframes stitch {
    from {
      stroke-dashoffset: 120;
      opacity: 0;
    }
  }
  @keyframes rise-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .lcard {
      animation: rise-in var(--spring-soft-dur) var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .glyph {
      animation: drop var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .glyph.small {
      animation-delay: 80ms;
    }
    :global(html:not([data-motion='reduce'])) .thread path {
      animation: stitch 700ms var(--ease-enter) 150ms both;
    }
    :global(html:not([data-motion='reduce'])) .key {
      transition:
        transform 400ms var(--ease-release),
        box-shadow 400ms var(--ease-release);
    }
    :global(html:not([data-motion='reduce'])) .key:active {
      transition-duration: 40ms;
    }
  }
</style>
