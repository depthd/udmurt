<script lang="ts">
  import items from 'virtual:library';
  import type { LibraryKind, LibraryItem } from '$lib/content/library-schema';
  import { normalize } from '$lib/answer';
  import { href } from '$lib/router.svelte';
  import { flip } from 'svelte/animate';
  import { fade, scale } from 'svelte/transition';
  import { prefs } from '$lib/prefs.svelte';

  const KINDS: Record<LibraryKind, { label: string; icon: string }> = {
    textbook: { label: 'Учебники', icon: '📗' },
    grammar: { label: 'Грамматика', icon: '🧩' },
    dictionary: { label: 'Словари', icon: '📖' },
    video: { label: 'Видео', icon: '🎬' },
    audio: { label: 'Слушать', icon: '🎧' },
    course: { label: 'Курсы', icon: '🎓' },
    app: { label: 'Приложения', icon: '📱' },
    community: { label: 'Сообщества', icon: '💬' },
    media: { label: 'Читать', icon: '📰' },
    literature: { label: 'Литература', icon: '📚' },
    history: { label: 'История', icon: '🏺' },
    data: { label: 'Открытые данные', icon: '🗂️' },
    tool: { label: 'Инструменты', icon: '🛠️' },
  };
  const RIGHTS = {
    open: { label: 'можно переносить', cls: 'open' },
    free: { label: 'бесплатно онлайн', cls: 'free' },
    print: { label: 'печатное издание', cls: 'print' },
  } as const;
  const LANGS: Record<string, string> = { ru: 'рус', udm: 'удм', en: 'англ', de: 'нем', hu: 'венг', fi: 'фин', et: 'эст', fr: 'франц' };

  let query = $state('');
  let kind = $state<LibraryKind | 'all'>('all');
  let rights = $state<'all' | 'open' | 'free' | 'print'>('all');
  let groupOnly = $state(false);

  const top = items.filter((i) => i.top);
  const kinds = (Object.keys(KINDS) as LibraryKind[]).filter((k) => items.some((i) => i.kind === k));
  const count = (k: LibraryKind) => items.filter((i) => i.kind === k).length;

  const shown = $derived.by(() => {
    const q = normalize(query);
    return items.filter(
      (i) =>
        (kind === 'all' || i.kind === kind) &&
        (rights === 'all' || i.rights === rights) &&
        (!groupOnly || i.group) &&
        (!q || normalize(`${i.title} ${i.author ?? ''} ${i.note ?? ''}`).includes(q)),
    );
  });
  const dur = $derived(prefs.reduceMotion ? 0 : 260);

  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, '');
    } catch {
      return u;
    }
  };
</script>

{#snippet card(i: LibraryItem, big = false)}
  <article class="item card" class:big>
    <div class="top">
      <span class="ic" aria-hidden="true">{KINDS[i.kind].icon}</span>
      <div class="ttl">
        <h3>{i.title}</h3>
        {#if i.author || i.year}<p class="by muted">{[i.author, i.year].filter(Boolean).join(' · ')}</p>{/if}
      </div>
    </div>
    {#if i.note}<p class="note">{i.note}</p>{/if}
    <div class="badges">
      <span class="b lvl" title="Уровень">{i.level}</span>
      <span class="b">{LANGS[i.lang] ?? i.lang}</span>
      <span class="b r-{RIGHTS[i.rights].cls}" title={i.license ?? ''}>{i.license && i.rights === 'open' ? i.license : RIGHTS[i.rights].label}</span>
      {#if i.group}<span class="b grp" title="Книга есть у группы">есть у группы</span>{/if}
    </div>
    {#if i.url}
      <div class="links">
        <a class="btn btn--sm btn--ghost" href={i.url} target="_blank" rel="noopener" aria-label="Открыть сайт {host(i.url)}">Открыть сайт</a>
        {#each i.urls as u (u)}<a class="alt" href={u} target="_blank" rel="noopener">{host(u)}</a>{/each}
      </div>
      <p class="host muted">{host(i.url)}</p>
      {#if i.unreachable}<p class="warn muted">Ссылка не открылась при проверке — возможно, работает только из России.</p>{/if}
    {/if}
  </article>
{/snippet}

<section class="page page--wide lib">
  <header class="head rise">
    <h1>Материалы</h1>
    <p class="lead">
      Всё, что удалось найти об удмуртском: {items.length} учебников, словарей, курсов, каналов и книг. Отмечено, что
      можно брать свободно, а что — только по ссылке.
    </p>
  </header>

  <h2 class="sec">С чего начать</h2>
  <div class="top-grid">
    {#each top as i, n (i.id)}
      <div class="rise" style="animation-delay: {n * 50}ms">{@render card(i, true)}</div>
    {/each}
  </div>

  <h2 class="sec">Весь каталог</h2>
  <div class="tools">
    <input class="search" type="search" bind:value={query} placeholder="Поиск по названию или автору" aria-label="Поиск по каталогу" />
    <div class="chips scroll-x" role="group" aria-label="Тип материала">
      <button class="fchip" class:on={kind === 'all'} aria-pressed={kind === 'all'} onclick={() => (kind = 'all')}>Все <b>{items.length}</b></button>
      {#each kinds as k (k)}
        <button class="fchip" class:on={kind === k} aria-pressed={kind === k} onclick={() => (kind = kind === k ? 'all' : k)}>
          {KINDS[k].icon} {KINDS[k].label} <b>{count(k)}</b>
        </button>
      {/each}
    </div>
    <div class="chips scroll-x" role="group" aria-label="Права">
      {#each [['all', 'Любые права'], ['open', '🟢 Можно переносить'], ['free', '🔵 Бесплатно онлайн'], ['print', '🟠 Печатные']] as [v, l] (v)}
        <button class="fchip small" class:on={rights === v} aria-pressed={rights === v} onclick={() => (rights = v as typeof rights)}>{l}</button>
      {/each}
      <button class="fchip small" class:on={groupOnly} aria-pressed={groupOnly} onclick={() => (groupOnly = !groupOnly)}>📦 Есть у группы</button>
    </div>
  </div>

  <p class="muted found" role="status">Найдено: {shown.length}</p>
  <div class="grid">
    {#each shown as i (i.id)}
      <div animate:flip={{ duration: dur }} in:scale={{ start: 0.96, duration: dur }} out:fade={{ duration: dur / 2 }}>{@render card(i)}</div>
    {/each}
  </div>

  <div class="info">
    <div class="card">
      <h2>Открытые данные в этом тренажёре</h2>
      <p>
        Словарь на 38 842 статьи (MIT), 4 896 фраз Tatoeba (CC BY) и статьи Викисловаря (CC BY-SA) встроены прямо в сайт —
        <a href={href('/dict')}>откройте словарь</a>. Авторы и лицензии — на странице <a href={href('/credits')}>«Источники»</a>.
      </p>
    </div>
    <div class="card">
      <h2>Почему здесь нет самих книг</h2>
      <p>
        Учебники и словари защищены авторским правом, поэтому мы не выкладываем их файлы — только описание и ссылку туда,
        где их публикуют сами авторы и библиотеки. Книги, которые есть у группы, мы используем, чтобы проверять слова и
        грамматику в уроках. Старые грамматики XVIII–XIX веков — в общественном достоянии, их можно читать свободно.
      </p>
    </div>
    <div class="card help">
      <h2>Как помочь проекту</h2>
      <ul>
        <li><b>Проверить фразы.</b> Носитель или преподаватель отмечает фразу как проверенную — и она получает статус «проверено».</li>
        <li><b>Записать озвучку.</b> 2–3 минуты на юнит: голос носителя — лучшее, что может быть в уроке.</li>
        <li><b>Прислать материалы</b> — ссылки, сканы своих конспектов, списки слов с пар.</li>
      </ul>
      <a class="btn btn--sm" href="https://github.com/depthd/udmurt/issues/new" target="_blank" rel="noopener">Написать на GitHub</a>
    </div>
  </div>
</section>

<style>
  .lead {
    font-size: 1.05rem;
    max-width: 60ch;
  }
  .sec {
    font-size: 1.2rem;
    margin: 24px 0 12px;
  }
  .top-grid,
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: 12px;
  }
  .top-grid > div,
  .grid > div {
    display: grid;
    min-width: 0;
  }
  .item {
    min-width: 0;
    overflow-wrap: anywhere;
    display: grid;
    align-content: start;
    gap: 8px;
    box-shadow: 0 3px 0 var(--line);
  }
  .item > * {
    min-width: 0;
  }
  .item.big {
    border-color: var(--red);
    box-shadow: 0 4px 0 var(--red);
  }
  .top {
    display: flex;
    gap: 12px;
  }
  .ic {
    flex: none;
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    font-size: 1.4rem;
    background: var(--surface-2);
    border-radius: 12px;
  }
  h3 {
    font-size: 1rem;
    margin: 0;
    line-height: 1.3;
  }
  .by {
    margin: 2px 0 0;
    font-size: 0.85rem;
  }
  .note {
    margin: 0;
    font-size: 0.92rem;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .b {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--surface-2);
    color: var(--muted);
  }
  .b.r-open {
    background: var(--green-soft);
    color: var(--green);
  }
  .b.r-free {
    background: var(--blue-soft);
    color: var(--blue);
  }
  .b.r-print {
    background: var(--amber-soft);
    color: var(--amber);
  }
  .b.grp {
    background: var(--red-soft);
    color: var(--red);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }
  .links .btn {
    flex: none;
    min-height: 44px;
    line-height: 1.2;
    text-transform: none;
    letter-spacing: 0;
  }
  .alt {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 0.85rem;
  }
  /* домен — отдельной строкой: длинные адреса не обрезаются в кнопке */
  .host {
    margin: -4px 0 0;
    font-size: 0.78rem;
    overflow-wrap: anywhere;
  }
  .warn {
    margin: 0;
    font-size: 0.78rem;
  }
  .tools {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    margin-bottom: 8px;
  }
  .search {
    height: 48px;
    padding: 0 16px;
    border: 2px solid var(--field-border);
    border-radius: var(--radius);
    background: var(--surface);
    font: inherit;
  }
  .search:focus {
    outline: none;
    border-color: var(--focus);
  }
  .chips {
    display: flex;
    gap: 8px;
    padding-bottom: 4px;
  }
  .fchip {
    flex: none;
    min-height: 44px;
    border: 2px solid var(--field-border);
    background: var(--surface);
    border-radius: 999px;
    padding: 7px 12px;
    font: 600 0.88rem var(--font-head);
    cursor: pointer;
    white-space: nowrap;
  }
  .fchip b {
    font-weight: 600;
    color: var(--muted);
    margin-left: 2px;
  }
  .fchip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .fchip.on b {
    color: inherit;
    opacity: 0.7;
  }
  .fchip.small {
    font-size: 0.8rem;
  }
  .found {
    margin: 6px 0 10px;
    font-size: 0.9rem;
  }
  .info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr));
    gap: 12px;
    margin-top: 28px;
  }
  .info h2 {
    font-size: 1.05rem;
    margin-bottom: 8px;
  }
  .info p {
    margin: 0;
  }
  .help ul {
    margin: 0 0 12px;
    padding-left: 18px;
    display: grid;
    gap: 6px;
  }
</style>
