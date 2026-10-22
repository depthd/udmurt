<script lang="ts">
  import { onMount } from 'svelte';
  import UdmKeyboard from '../components/UdmKeyboard.svelte';
  import Mascot from '../components/Mascot.svelte';
  import { href } from '$lib/router.svelte';
  import { course, personalize } from '$lib/course';
  import {
    loadDict,
    loadPhrases,
    loadWikt,
    searchEntries,
    searchPhrases,
    examplesFor,
    highlight,
    type Entry,
    type Phrase,
    type Wikt,
    type Meta,
  } from '$lib/dict';

  let { q = '' }: { q?: string } = $props();

  let query = $state('');
  let tab = $state<'words' | 'phrases'>('words');
  let input: HTMLInputElement | null = $state(null);
  let entries = $state<Entry[] | null>(null);
  let phrases = $state<Phrase[] | null>(null);
  let wikt = $state<Record<string, Wikt> | null>(null);
  let metas = $state<Meta[]>([]);
  let failed = $state(false);
  let limit = $state(50);
  let open = $state<string | null>(null);

  $effect.pre(() => {
    query = decodeURIComponent(q ?? '');
  });

  onMount(() => {
    Promise.all([loadDict(), loadPhrases(), loadWikt()])
      .then(([d, p, w]) => {
        entries = d.entries;
        phrases = p.entries;
        wikt = (w as { entries: Record<string, Wikt> }).entries;
        metas = [d.meta, p.meta, (w as { meta: Meta }).meta];
      })
      .catch(() => (failed = true));
  });

  // Синхронизируем запрос с адресом без перехода (чтобы ссылкой можно было поделиться)
  let syncTimer: ReturnType<typeof setTimeout> | undefined;
  function onInput() {
    limit = 50;
    open = null;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      const h = '#/dict' + (query.trim() ? '/' + encodeURIComponent(query.trim()) : '');
      if (location.hash !== h) history.replaceState(null, '', h);
    }, 300);
  }

  const words = $derived(entries && query.trim() ? searchEntries(entries, query, limit) : null);
  const phraseResults = $derived(phrases && query.trim() ? searchPhrases(phrases, query, limit) : null);
  const top = $derived(entries ? entries.filter((e) => e.rank > 0 && e.rank <= 400 && e.ru.length < 40).slice(0, 30) : []);
  const lessonWords = $derived(course.lexicon.filter((i) => i.kind === 'word' && i.status !== 'draft'));

  function toggle(e: Entry) {
    const id = e.udm + '|' + e.pos;
    open = open === id ? null : id;
  }
  const examples = (e: Entry) => (phrases ? examplesFor(phrases, e.udm, 5) : []);
  const wiktFor = (e: Entry) => wikt?.[e.udm] ?? wikt?.[e.udm.toLowerCase()];

  function pick(word: string) {
    query = word;
    onInput();
    input?.focus();
  }
</script>

<section class="page dict">
  <header class="head">
    <h1>Словарь</h1>
    <p class="muted">38 842 слова и 4 896 фраз с переводом — из открытых источников.</p>
  </header>

  <div class="search" role="search">
    <svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a6 6 0 1 0 3.7 10.7l4.8 4.8 1.4-1.4-4.8-4.8A6 6 0 0 0 10 4zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8z" fill="currentColor" /></svg>
    <input
      bind:this={input}
      bind:value={query}
      oninput={onInput}
      type="search"
      inputmode="search"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Слово по-удмуртски или по-русски"
      aria-label="Поиск по словарю"
      data-testid="dict-search"
    />
    {#if query}
      <button class="clear" type="button" aria-label="Очистить" onclick={() => pick('')}>✕</button>
    {/if}
  </div>
  <div class="kb"><UdmKeyboard target={input} /></div>

  <div class="tabs" role="tablist" aria-label="Что искать">
    <span class="pill" class:right={tab === 'phrases'} aria-hidden="true"></span>
    <button role="tab" aria-selected={tab === 'words'} class:active={tab === 'words'} onclick={() => (tab = 'words')} data-testid="tab-words">
      Слова {#if words}<b>{words.total}</b>{/if}
    </button>
    <button role="tab" aria-selected={tab === 'phrases'} class:active={tab === 'phrases'} onclick={() => (tab = 'phrases')} data-testid="tab-phrases">
      Фразы {#if phraseResults}<b>{phraseResults.total}</b>{/if}
    </button>
  </div>

  {#if failed}
    <div class="empty card">
      <Mascot mood="sad" size={90} />
      <p>Не получилось загрузить словарь. Проверьте интернет и обновите страницу.</p>
    </div>
  {:else if !entries}
    <ul class="list" aria-busy="true" aria-label="Загрузка словаря">
      {#each Array(6) as _, i (i)}
        <li class="row skeleton"><span></span><span></span></li>
      {/each}
    </ul>
  {:else if !query.trim()}
    <div class="intro rise">
      <h2>Слова из уроков</h2>
      <div class="chips">
        {#each lessonWords as w (w.id)}
          <button class="chip-btn" onclick={() => pick(personalize(w.udm))}><span lang="udm">{personalize(w.udm)}</span> · {w.ru}</button>
        {/each}
      </div>
      <h2>Самые частые слова</h2>
      <div class="chips">
        {#each top as w (w.udm + w.pos)}
          <button class="chip-btn" onclick={() => pick(w.udm)}><span lang="udm">{w.udm}</span> · {w.ru.split(';')[0]}</button>
        {/each}
      </div>
      <p class="muted tip">Подсказка: можно искать без удмуртских букв — «овол» найдёт «ӧвӧл».</p>
    </div>
  {:else if tab === 'words' && words}
    {#if words.items.length === 0}
      <div class="empty card">
        <Mascot mood="think" size={90} />
        <p>Ничего не нашлось по запросу «{query}». Попробуйте начальную форму слова или посмотрите вкладку «Фразы».</p>
      </div>
    {:else}
      <ul class="list">
        {#each words.items as e, i (e.udm + '|' + e.pos + '|' + i)}
          {@const id = e.udm + '|' + e.pos}
          {@const w = open === id ? wiktFor(e) : undefined}
          <li class="row" class:open={open === id} data-testid="dict-result-{i}">
            <button class="row-btn" aria-expanded={open === id} onclick={() => toggle(e)}>
              <span class="lemma" lang="udm">{#each highlight(e.udm, query) as [t, m]}{#if m}<mark>{t}</mark>{:else}{t}{/if}{/each}</span>
              <span class="pos">{e.pos}</span>
              {#if e.loan}<span class="loan" title="Русское заимствование">рус.</span>{/if}
              <span class="tr">{e.ru}</span>
            </button>
            {#if open === id}
              <div class="more">
                {#if w}
                  <div class="wikt">
                    {#if w.ipa}<p class="ipa">[{w.ipa.replace(/^\[+|\]+$/g, '')}]</p>{/if}
                    <ol>
                      {#each w.g.slice(0, 5) as g}<li>{g}</li>{/each}
                    </ol>
                    {#each w.x.slice(0, 2) as [u, r]}
                      <p class="ex"><span lang="udm">{u}</span> — {r}</p>
                    {/each}
                    <p class="src">Викисловарь · CC BY-SA 4.0</p>
                  </div>
                {/if}
                {#each examples(e) as p (p.id)}
                  <p class="ex">
                    <span lang="udm">{p.udm}</span> — {p.ru[0]}
                    <a class="src" href="https://tatoeba.org/ru/sentences/show/{p.id}" target="_blank" rel="noopener">Tatoeba · {p.author}</a>
                  </p>
                {/each}
                <a class="ext" href="https://ru.wiktionary.org/wiki/{encodeURIComponent(e.udm)}" target="_blank" rel="noopener">Искать в Викисловаре →</a>
              </div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if words.total > words.items.length}
        <button class="btn btn--ghost btn--block more-btn" onclick={() => (limit += 50)}>Показать ещё ({words.total - words.items.length})</button>
      {/if}
    {/if}
  {:else if tab === 'phrases' && phraseResults}
    {#if phraseResults.items.length === 0}
      <div class="empty card">
        <Mascot mood="think" size={90} />
        <p>Фраз с «{query}» нет. Попробуйте другое слово.</p>
      </div>
    {:else}
      <ul class="list">
        {#each phraseResults.items as p (p.id)}
          <li class="row phrase">
            <p class="pu" lang="udm">{#each highlight(p.udm, query) as [t, m]}{#if m}<mark>{t}</mark>{:else}{t}{/if}{/each}</p>
            <p class="pr">{p.ru.join(' / ')}</p>
            <a class="src" href="https://tatoeba.org/ru/sentences/show/{p.id}" target="_blank" rel="noopener">Tatoeba №{p.id} · {p.author}</a>
          </li>
        {/each}
      </ul>
      {#if phraseResults.total > phraseResults.items.length}
        <button class="btn btn--ghost btn--block more-btn" onclick={() => (limit += 50)}>Показать ещё</button>
      {/if}
    {/if}
  {/if}

  <footer class="attr muted">
    <p>
      Слова — <a href="https://github.com/timarkh/uniparser-grammar-udm" target="_blank" rel="noopener">uniparser-grammar-udm</a> (Т. Архангельский, М. Медведева,
      УдмФИЦ УрО РАН, Е. Кашкин; MIT). Фразы — <a href="https://tatoeba.org" target="_blank" rel="noopener">Tatoeba</a> (CC BY 2.0 FR). Значения и примеры —
      <a href="https://ru.wiktionary.org" target="_blank" rel="noopener">Викисловарь</a> (CC BY-SA 4.0).
      <a href={href('/credits')}>Все источники</a>
    </p>
    {#if metas.length === 0 && entries}<p></p>{/if}
  </footer>
</section>

<style>
  .head h1 {
    margin-bottom: 4px;
  }
  .search {
    position: relative;
    display: flex;
    align-items: center;
    margin-top: 12px;
  }
  .search .ic {
    position: absolute;
    left: 16px;
    width: 22px;
    height: 22px;
    color: var(--muted);
    pointer-events: none;
  }
  .search input {
    width: 100%;
    height: 56px;
    padding: 0 48px 0 48px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    font: 500 1.1rem var(--font-text);
    box-shadow: 0 3px 0 var(--line);
    -webkit-appearance: none;
    appearance: none;
  }
  .search input:focus {
    outline: none;
    border-color: var(--focus);
    box-shadow: 0 3px 0 var(--focus);
  }
  .search input::-webkit-search-cancel-button {
    display: none;
  }
  .clear {
    position: absolute;
    right: 8px;
    width: 40px;
    height: 40px;
    border: 0;
    border-radius: 50%;
    background: var(--surface-2);
    cursor: pointer;
  }
  .kb {
    margin: 10px 0 16px;
  }
  .tabs {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: var(--surface-2);
    border-radius: 999px;
    padding: 4px;
    margin-bottom: 16px;
  }
  .tabs button {
    position: relative;
    z-index: 1;
    border: 0;
    background: none;
    padding: 10px;
    border-radius: 999px;
    font: 700 0.95rem var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  .tabs button.active {
    color: var(--ink);
  }
  .tabs b {
    font-weight: 600;
    color: var(--muted);
    font-size: 0.8rem;
    margin-left: 4px;
  }
  .pill {
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: 4px;
    width: calc(50% - 4px);
    border-radius: 999px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .pill.right {
    transform: translateX(100%);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .pill {
      transition: transform var(--spring-snappy-dur) var(--spring-snappy);
    }
    :global(html:not([data-motion='reduce'])) .more {
      animation: rise 300ms var(--ease-enter) both;
    }
    :global(html:not([data-motion='reduce'])) .skeleton span {
      animation: shimmer 1.2s ease-in-out infinite;
    }
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .row {
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .row.open {
    border-color: var(--line-strong);
  }
  .row-btn {
    display: grid;
    grid-template-columns: auto auto 1fr;
    align-items: baseline;
    gap: 4px 10px;
    width: 100%;
    padding: 12px 16px;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
  }
  .lemma {
    font: 600 1.2rem var(--font-head);
  }
  .pos {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .loan {
    justify-self: start;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 1px 6px;
    border-radius: 6px;
    background: var(--surface-2);
    color: var(--muted);
  }
  .tr {
    grid-column: 1 / -1;
    color: var(--ink);
  }
  mark {
    background: var(--amber-soft);
    color: inherit;
    border-radius: 3px;
  }
  .more {
    padding: 0 16px 14px;
    border-top: 1px dashed var(--line);
  }
  .wikt ol {
    margin: 10px 0 6px;
    padding-left: 20px;
  }
  .ipa {
    margin: 10px 0 0;
    color: var(--muted);
  }
  .ex {
    margin: 8px 0 0;
  }
  .ex span[lang='udm'] {
    font-weight: 600;
  }
  .src {
    display: inline-block;
    margin-left: 6px;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .ext {
    display: inline-block;
    margin-top: 10px;
    font-size: 0.9rem;
  }
  .phrase {
    padding: 12px 16px;
  }
  .pu {
    margin: 0;
    font: 600 1.1rem var(--font-head);
  }
  .pr {
    margin: 4px 0 2px;
  }
  .phrase .src {
    margin-left: 0;
  }
  .skeleton {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
  }
  .skeleton span {
    height: 14px;
    border-radius: 7px;
    background: var(--surface-2);
  }
  .skeleton span:first-child {
    width: 40%;
    height: 18px;
  }
  @keyframes shimmer {
    50% {
      opacity: 0.45;
    }
  }
  .intro h2 {
    font-size: 1.05rem;
    margin: 8px 0 10px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 18px;
  }
  .chip-btn {
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 0.9rem;
    cursor: pointer;
    box-shadow: 0 2px 0 var(--line);
  }
  .chip-btn span {
    font-weight: 700;
  }
  .chip-btn:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .empty {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 8px;
  }
  .more-btn {
    margin-top: 12px;
  }
  .attr {
    margin-top: 28px;
    font-size: 0.8rem;
  }
  .tip {
    font-size: 0.9rem;
  }
</style>
