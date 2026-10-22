<script lang="ts">
  import { onMount } from 'svelte';
  import { score, answerFor, dayIndex, keyMarks, EMOJI, type Mark } from '$lib/wordle';
  import { readJSON, writeJSON } from '$lib/storage';
  import { dayKey } from '$lib/dates';
  import { href } from '$lib/router.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { celebrate } from '$lib/celebrate';
  import Mascot from '../components/Mascot.svelte';
  import { ui } from '$lib/ui.svelte';
  import { router } from '$lib/router.svelte';

  $effect(() => {
    ui.immersive = true;
    return () => (ui.immersive = false);
  });

  const LEN = 5;
  const TRIES = 6;
  const KEY = 'udm.wordle.v1';
  type Row = { guess: string; marks: Mark[] };
  type Saved = { day: string; rows: Row[]; done: boolean; won: boolean; stats: { played: number; won: number; streak: number; best: number; dist: number[] } };

  let answers = $state<[string, string][]>([]);
  let valid = $state<Set<string>>(new Set());
  let failed = $state(false);
  const today = dayKey();
  const idx = dayIndex();

  const blank: Saved = { day: today, rows: [], done: false, won: false, stats: { played: 0, won: 0, streak: 0, best: 0, dist: [0, 0, 0, 0, 0, 0] } };
  let saved = $state<Saved>((() => {
    const s = readJSON<Saved>(KEY, blank);
    return s.day === today ? s : { ...blank, stats: s.stats ?? blank.stats };
  })());
  let current = $state('');
  let shake = $state(false);
  let toast = $state('');
  let revealRow = $state(-1);

  const answer = $derived(answers.length ? answerFor(answers, idx) : null);
  const km = $derived(keyMarks(saved.rows));

  onMount(() => {
    fetch(`${import.meta.env.BASE_URL}data/wordle.json`)
      .then((r) => r.json())
      .then((j) => {
        answers = j.answers;
        valid = new Set(j.valid);
      })
      .catch(() => (failed = true));
  });

  function save() {
    writeJSON(KEY, $state.snapshot(saved));
  }

  function say(t: string) {
    toast = t;
    setTimeout(() => (toast = toast === t ? '' : toast), 1800);
  }

  function type(ch: string) {
    if (saved.done || !answer) return;
    if (current.length < LEN) {
      current += ch;
      sfx.tap();
    }
  }
  function back() {
    current = current.slice(0, -1);
  }
  function submit() {
    if (saved.done || !answer) return;
    if (current.length < LEN) return bad('Нужно 5 букв');
    if (!valid.has(current)) return bad('Такого слова нет в словаре — нужна начальная форма');
    const marks = score(current, answer[0]);
    saved.rows.push({ guess: current, marks });
    revealRow = saved.rows.length - 1;
    current = '';
    const won = marks.every((m) => m === 'correct');
    if (won || saved.rows.length >= TRIES) finish(won);
    else haptic.tap();
    save();
  }
  function bad(t: string) {
    shake = true;
    haptic.wrong();
    say(t);
    setTimeout(() => (shake = false), 450);
  }
  function finish(won: boolean) {
    saved.done = true;
    saved.won = won;
    const st = saved.stats;
    st.played += 1;
    if (won) {
      st.won += 1;
      st.streak += 1;
      st.best = Math.max(st.best, st.streak);
      st.dist[saved.rows.length - 1] += 1;
      setTimeout(() => {
        sfx.complete();
        celebrate();
      }, prefs.reduceMotion ? 0 : 1600);
    } else st.streak = 0;
  }

  function onkey(e: KeyboardEvent) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
    if (e.key === 'Enter') return submit();
    if (e.key === 'Backspace') return back();
    const ch = e.key.toLowerCase();
    if (/^[а-яёӝӟӥӧӵ]$/.test(ch)) type(ch === 'ё' ? 'е' : ch);
  }

  async function share() {
    const grid = saved.rows.map((r) => r.marks.map((m) => EMOJI[m]).join('')).join('\n');
    const text = `Удмурт кыл · 5 букв №${idx} ${saved.won ? saved.rows.length : 'X'}/${TRIES}\n${grid}\n${location.origin}${import.meta.env.BASE_URL}#/game`;
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        say('Результат скопирован');
      }
    } catch {
      /* отмена */
    }
  }

  const KB = [
    ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
    ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
    ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
    ['ӝ', 'ӟ', 'ӥ', 'ӧ', 'ӵ'],
  ];
  const rowsView = $derived(
    Array.from({ length: TRIES }, (_, i) => {
      if (i < saved.rows.length) return { letters: [...saved.rows[i].guess], marks: saved.rows[i].marks, kind: 'done' as const };
      if (i === saved.rows.length && !saved.done) return { letters: [...current.padEnd(LEN, ' ')], marks: [], kind: 'current' as const };
      return { letters: Array(LEN).fill(' '), marks: [], kind: 'empty' as const };
    }),
  );
  const label: Record<Mark, string> = { correct: 'на месте', similar: 'похожая буква на месте', present: 'есть в слове', absent: 'нет в слове' };
</script>

<svelte:window onkeydown={onkey} />

<section class="game">
  <header class="head">
    <button class="back" aria-label="Назад" onclick={() => (history.length > 1 ? history.back() : router.go('/', 'back'))}>←</button>
    <div>
      <h1>5 букв <span class="no">№{idx}</span></h1>
      <p class="muted">Удмуртское слово дня за 6 попыток</p>
    </div>
  </header>

  {#if failed}
    <p class="card">Не удалось загрузить слова. Обновите страницу.</p>
  {:else if !answer}
    <p class="muted">Загружаем слова…</p>
  {:else}
    <div class="board" role="grid" aria-label="Попытки">
      {#each rowsView as row, ri (ri)}
        <div class="row" role="row" class:shake={shake && row.kind === 'current'}>
          {#each row.letters as ch, ci (ci)}
            {@const m = row.marks[ci]}
            <span
              class="cell {m ?? ''}"
              class:filled={ch !== ' '}
              class:flip={row.kind === 'done' && ri === revealRow}
              style="--d: {ci * 260}ms"
              role="gridcell"
              aria-label={ch !== ' ' ? `${ch}${m ? ', ' + label[m] : ''}` : 'пусто'}
              lang="udm">{ch.trim()}</span
            >
          {/each}
        </div>
      {/each}
    </div>

    <div class="toast" role="status" aria-live="polite">{#if toast}<span>{toast}</span>{/if}</div>

    {#if saved.done}
      <div class="result card rise">
        <Mascot mood={saved.won ? 'celebrate' : 'sad'} size={80} />
        <div>
          <p class="big">{saved.won ? 'Ӟеч! Угадано!' : 'В этот раз не вышло'}</p>
          <p>Слово дня: <b lang="udm" class="udm">{answer[0]}</b> — {answer[1]}</p>
          <div class="acts">
            <button class="btn btn--sm" onclick={share}>Поделиться</button>
            <a class="btn btn--sm btn--ghost" href={href('/dict/' + encodeURIComponent(answer[0]))}>В словаре</a>
          </div>
          <p class="muted small">Сыграно {saved.stats.played} · угадано {saved.stats.won} · серия {saved.stats.streak} (лучшая {saved.stats.best})</p>
        </div>
      </div>
    {:else}
      <div class="kb" aria-label="Клавиатура">
        {#each KB as r, i (i)}
          <div class="kr" class:udm-row={i === 3}>
            {#if i === 3}<button class="k wide" onclick={submit} aria-label="Проверить слово">ввод</button>{/if}
            {#each r as k (k)}
              <button class="k {km[k] ?? ''}" lang="udm" onclick={() => type(k)}>{k}</button>
            {/each}
            {#if i === 3}<button class="k wide" onclick={back} aria-label="Стереть букву">⌫</button>{/if}
          </div>
        {/each}
      </div>
    {/if}

    <details class="rules">
      <summary>Как играть</summary>
      <ul>
        <li><span class="sw correct"></span> буква на своём месте</li>
        <li><span class="sw present"></span> буква есть в слове, но в другом месте</li>
        <li><span class="sw similar"></span> «почти»: на этом месте похожая удмуртская буква (о/ӧ, и/ӥ, ж/ӝ, з/ӟ, ч/ӵ)</li>
        <li><span class="sw absent"></span> буквы нет в слове</li>
      </ul>
      <p class="muted small">Принимаются начальные формы слов из словаря (38 тыс. слов, uniparser, MIT).</p>
    </details>
  {/if}
</section>

<style>
  .game {
    max-width: 480px;
    margin: 0 auto;
    padding: 12px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .head h1 {
    font-size: 1.4rem;
    margin: 0;
  }
  .head p {
    margin: 0;
    font-size: 0.9rem;
  }
  .no {
    font-size: 0.9rem;
    color: var(--muted);
    font-weight: 600;
  }
  .back {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 1.3rem;
    cursor: pointer;
    flex: none;
  }
  .board {
    display: grid;
    gap: 6px;
    justify-content: center;
    margin: 14px 0 4px;
  }
  .row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
    width: min(300px, 74vw, 46dvh);
  }
  .cell {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    font: 800 clamp(1.2rem, 6vw, 1.8rem) var(--font-head);
    text-transform: uppercase;
  }
  .cell.filled {
    border-color: var(--line-strong);
  }
  .cell.correct {
    background: var(--green);
    border-color: var(--green);
    color: var(--on-fill);
  }
  .cell.present {
    background: var(--amber);
    border-color: var(--amber);
    color: var(--on-fill);
  }
  .cell.similar {
    background: var(--blue);
    border-color: var(--blue);
    color: var(--on-fill);
  }
  .cell.absent {
    background: var(--muted);
    border-color: var(--muted);
    color: var(--bg);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .cell.flip {
      animation: flip 520ms var(--ease-standard) var(--d) both;
    }
    :global(html:not([data-motion='reduce'])) .cell.filled:not(.correct):not(.present):not(.similar):not(.absent) {
      animation: pop 200ms var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .row.shake {
      animation: shake 420ms var(--ease-standard);
    }
  }
  @keyframes flip {
    0% {
      transform: rotateX(0);
      background: var(--surface);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    49% {
      transform: rotateX(90deg);
      background: var(--surface);
      color: var(--ink);
      border-color: var(--line-strong);
    }
    50% {
      transform: rotateX(90deg);
    }
    100% {
      transform: rotateX(0);
    }
  }
  .toast {
    min-height: 32px;
    display: grid;
    place-items: center;
  }
  .toast span {
    background: var(--ink);
    color: var(--bg);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 0.9rem;
    font-weight: 600;
  }
  .kb {
    display: grid;
    gap: 6px;
    margin-top: auto;
  }
  .kr {
    display: flex;
    justify-content: center;
    gap: 4px;
  }
  .k {
    flex: 1 1 0;
    max-width: 40px;
    min-width: 0;
    height: 48px;
    border: 0;
    border-radius: 8px;
    background: var(--surface-2);
    box-shadow: 0 2px 0 var(--line-strong);
    font: 700 1rem var(--font-head);
    padding: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .k:active {
    transform: translateY(2px);
    box-shadow: none;
  }
  .udm-row .k:not(.wide) {
    max-width: 48px;
    background: var(--red-soft);
  }
  .k.wide {
    flex: 1.6 1 0;
    max-width: 72px;
    font-size: 0.8rem;
  }
  .k.correct {
    background: var(--green);
    color: var(--on-fill);
  }
  .k.present {
    background: var(--amber);
    color: var(--on-fill);
  }
  .k.similar {
    background: var(--blue);
    color: var(--on-fill);
  }
  .k.absent {
    background: var(--muted);
    color: var(--bg);
    opacity: 0.6;
  }
  .result {
    display: flex;
    gap: 14px;
    align-items: center;
  }
  .result p {
    margin: 0 0 6px;
  }
  .big {
    font: 800 1.3rem var(--font-head);
  }
  .acts {
    display: flex;
    gap: 8px;
    margin: 8px 0;
  }
  .small {
    font-size: 0.82rem;
  }
  .rules {
    margin-top: 18px;
  }
  .rules summary {
    cursor: pointer;
    font-weight: 700;
  }
  .rules ul {
    list-style: none;
    padding: 0;
    display: grid;
    gap: 6px;
  }
  .sw {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    vertical-align: -2px;
    margin-right: 6px;
  }
  .sw.correct {
    background: var(--green);
  }
  .sw.present {
    background: var(--amber);
  }
  .sw.similar {
    background: var(--blue);
  }
  .sw.absent {
    background: var(--muted);
  }
</style>
