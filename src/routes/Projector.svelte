<script lang="ts">
  /**
   * Режим проектора: игра для пары. Вопрос и 4 варианта — крупно на общем экране,
   * группа отвечает командами, преподаватель (или ведущий) начисляет очки. Без сервера.
   * Клавиши: Пробел — показать ответ / дальше, 1–4 — выделить вариант, Esc — выход.
   */
  import { onDestroy } from 'svelte';
  import { course, lexicon, personalize } from '$lib/course';
  import { router } from '$lib/router.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, playAudio } from '$lib/sfx';
  import { celebrate } from '$lib/celebrate';
  import { ui } from '$lib/ui.svelte';
  import { seededShuffle } from '../exercises/types';
  import { exerciseRefs } from '$lib/content/refs';
  import type { LexItem } from '$lib/content/schema';
  import Mascot from '../components/Mascot.svelte';

  type Q = { item: LexItem; dir: 'udm-ru' | 'ru-udm'; options: LexItem[] };

  let phase = $state<'setup' | 'question' | 'reveal' | 'end'>('setup');
  let units = $state<string[]>(course.units.map((u) => u.id));
  let teams = $state(2);
  let seconds = $state(20);
  let dirMode = $state<'udm-ru' | 'ru-udm' | 'mix'>('mix');
  let total = $state(10);
  let qs = $state<Q[]>([]);
  let qi = $state(0);
  let scores = $state<number[]>([0, 0]);
  let picked = $state<number | null>(null);
  let left = $state(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  $effect(() => {
    ui.immersive = phase !== 'setup';
    return () => (ui.immersive = false);
  });
  onDestroy(() => clearInterval(timer));

  const teamNames = ['Команда 1', 'Команда 2', 'Команда 3', 'Команда 4'];
  const teamColors = ['var(--red)', 'var(--blue)', 'var(--green)', 'var(--amber)'];

  function pool(): LexItem[] {
    const ids = new Set<string>();
    for (const u of course.units) if (units.includes(u.id)) for (const l of u.lessons) for (const ex of l.exercises) exerciseRefs(ex).forEach((r) => ids.add(r));
    return [...ids].map((id) => lexicon.get(id)!).filter((i) => i && i.status !== 'draft' && !i.udm.includes('{name}'));
  }

  function start() {
    const p = pool();
    const seed = String(Date.now());
    const chosen = seededShuffle(p, seed).slice(0, total);
    qs = chosen.map((item, k) => {
      const same = p.filter((x) => x.id !== item.id && x.kind === item.kind && x.ru !== item.ru);
      const other = p.filter((x) => x.id !== item.id && x.kind !== item.kind && x.ru !== item.ru);
      const distr = [...seededShuffle(same, seed + k), ...seededShuffle(other, seed + 'd' + k)].slice(0, 3);
      const dir = dirMode === 'mix' ? (k % 2 ? 'ru-udm' : 'udm-ru') : dirMode;
      return { item, dir, options: seededShuffle([item, ...distr], seed + 'o' + k) };
    });
    scores = Array(teams).fill(0);
    qi = 0;
    phase = 'question';
    ask();
  }

  function ask() {
    picked = null;
    left = seconds;
    clearInterval(timer);
    timer = setInterval(() => {
      left -= 1;
      if (left <= 0) reveal();
    }, 1000);
    const q = qs[qi];
    if (q.dir === 'udm-ru' && q.item.audio && prefs.value.sound) playAudio(q.item.audio);
  }

  function reveal() {
    clearInterval(timer);
    phase = 'reveal';
    sfx.correct();
    const q = qs[qi];
    if (q.dir === 'ru-udm' && q.item.audio && prefs.value.sound) setTimeout(() => playAudio(q.item.audio), 400);
  }

  function next() {
    if (qi + 1 >= qs.length) {
      phase = 'end';
      sfx.complete();
      celebrate();
      return;
    }
    qi += 1;
    phase = 'question';
    ask();
  }

  function point(t: number, d = 1) {
    scores[t] = Math.max(0, scores[t] + d);
    if (d > 0) sfx.tap();
  }

  function onkey(e: KeyboardEvent) {
    if (phase === 'setup') return;
    if (e.key === 'Escape') return exit();
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (phase === 'question') reveal();
      else if (phase === 'reveal') next();
    }
    const n = Number(e.key);
    if (phase === 'question' && n >= 1 && n <= 4) picked = n - 1;
  }

  function exit() {
    clearInterval(timer);
    phase = 'setup';
  }

  const q = $derived(qs[qi]);
  const prompt = (q: Q) => personalize(q.dir === 'udm-ru' ? q.item.udm : q.item.ru);
  const opt = (q: Q, o: LexItem) => personalize(q.dir === 'udm-ru' ? o.ru : o.udm);
  const winner = $derived(scores.indexOf(Math.max(...scores)));
  const letters = ['A', 'B', 'C', 'D'];
</script>

<svelte:window onkeydown={onkey} />

{#if phase === 'setup'}
  <section class="page setup">
    <header class="hero">
      <Mascot mood="wave" size={90} />
      <div>
        <h1>Режим проектора</h1>
        <p class="muted">Откройте на ноутбуке или проекторе. На экране — вопрос и 4 варианта, команды отвечают вслух или карточками A–D, ведущий начисляет очки.</p>
      </div>
    </header>

    <div class="card opts">
      <h2>Юниты</h2>
      <div class="chips">
        {#each course.units as u (u.id)}
          <button class="chip-b" class:on={units.includes(u.id)} aria-pressed={units.includes(u.id)} onclick={() => (units = units.includes(u.id) ? units.filter((x) => x !== u.id) : [...units, u.id])}>{u.title}</button>
        {/each}
      </div>
      <h2>Команды</h2>
      <div class="chips">
        {#each [2, 3, 4] as n (n)}<button class="chip-b" class:on={teams === n} onclick={() => (teams = n)}>{n}</button>{/each}
      </div>
      <h2>Время на вопрос</h2>
      <div class="chips">
        {#each [10, 20, 30] as n (n)}<button class="chip-b" class:on={seconds === n} onclick={() => (seconds = n)}>{n} с</button>{/each}
      </div>
      <h2>Вопросов</h2>
      <div class="chips">
        {#each [5, 10, 15] as n (n)}<button class="chip-b" class:on={total === n} onclick={() => (total = n)}>{n}</button>{/each}
      </div>
      <h2>Направление</h2>
      <div class="chips">
        {#each [['mix', 'Вперемешку'], ['udm-ru', 'Удм → рус'], ['ru-udm', 'Рус → удм']] as [v, l] (v)}
          <button class="chip-b" class:on={dirMode === v} onclick={() => (dirMode = v as typeof dirMode)}>{l}</button>
        {/each}
      </div>
    </div>
    <button class="btn btn--block start" disabled={!units.length} onclick={start} data-testid="projector-start">Начать игру</button>
    <button class="btn btn--flat" onclick={() => router.go('/group', 'back')}>← Назад</button>
  </section>
{:else}
  <section class="stage" aria-live="polite">
    <header class="top">
      <button class="x" aria-label="Закончить игру" onclick={exit}>✕</button>
      <span class="count">Вопрос {Math.min(qi + 1, qs.length)} из {qs.length}</span>
      <div class="scores">
        {#each scores as s, t (t)}
          <div class="team" style="--c: {teamColors[t]}">
            <span class="tn">{teamNames[t]}</span>
            <b>{s}</b>
            {#if phase === 'reveal'}
              <span class="tb"><button onclick={() => point(t, 1)} aria-label="Очко: {teamNames[t]}">+1</button><button onclick={() => point(t, -1)} aria-label="Минус очко: {teamNames[t]}">−1</button></span>
            {/if}
          </div>
        {/each}
      </div>
    </header>

    {#if phase === 'end'}
      <div class="end">
        <Mascot mood="celebrate" size={180} />
        <h2>Побеждает {teamNames[winner]}!</h2>
        <ol class="podium">
          {#each scores.map((s, t) => ({ s, t })).sort((a, b) => b.s - a.s) as r, i (r.t)}
            <li style="--c: {teamColors[r.t]}"><span>{['🥇', '🥈', '🥉', '4'][i]}</span> {teamNames[r.t]} — <b>{r.s}</b></li>
          {/each}
        </ol>
        <div class="row">
          <button class="btn" onclick={start}>Ещё раунд</button>
          <button class="btn btn--ghost" onclick={exit}>Настройки</button>
        </div>
      </div>
    {:else if q}
      {#key qi}
        <div class="q">
          <div class="timer" aria-hidden="true"><i style:width="{(left / seconds) * 100}%" class:low={left <= 5}></i></div>
          <p class="hint">{q.dir === 'udm-ru' ? 'Как это по-русски?' : 'Как это по-удмуртски?'}</p>
          <h2 class="prompt" lang={q.dir === 'udm-ru' ? 'udm' : 'ru'}>{prompt(q)}</h2>
          {#if q.item.audio}<button class="say" onclick={() => playAudio(q.item.audio)} aria-label="Прослушать">🔊</button>{/if}
          <div class="grid">
            {#each q.options as o, i (o.id)}
              <div
                class="o"
                class:picked={picked === i}
                class:right={phase === 'reveal' && o.id === q.item.id}
                class:dim={phase === 'reveal' && o.id !== q.item.id}
                lang={q.dir === 'udm-ru' ? 'ru' : 'udm'}
              >
                <span class="l">{letters[i]}</span>{opt(q, o)}
              </div>
            {/each}
          </div>
          <div class="ctrl">
            {#if phase === 'question'}
              <button class="btn btn--ink" onclick={reveal}>Показать ответ <kbd>пробел</kbd></button>
            {:else}
              <p class="ans">Ответ: <b lang="udm">{personalize(q.item.udm)}</b> — {personalize(q.item.ru)}</p>
              <button class="btn" onclick={next}>{qi + 1 >= qs.length ? 'Итоги' : 'Дальше'} <kbd>пробел</kbd></button>
            {/if}
          </div>
        </div>
      {/key}
    {/if}
  </section>
{/if}

<style>
  .hero {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 16px;
  }
  .hero p {
    margin: 0;
  }
  .opts h2 {
    font-size: 0.95rem;
    margin: 12px 0 8px;
  }
  .opts h2:first-child {
    margin-top: 0;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chip-b {
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 999px;
    padding: 8px 14px;
    font: 600 0.9rem var(--font-head);
    cursor: pointer;
  }
  .chip-b.on {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  .start {
    margin: 16px 0 6px;
  }

  .stage {
    min-height: 100dvh;
    display: grid;
    grid-template-rows: auto 1fr;
    background: var(--bg);
    padding: clamp(12px, 2vw, 28px);
  }
  .top {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }
  .x {
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 1.1rem;
    cursor: pointer;
  }
  .count {
    font: 600 clamp(0.9rem, 1.4vw, 1.3rem) var(--font-head);
    color: var(--muted);
  }
  .scores {
    margin-left: auto;
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .team {
    display: grid;
    justify-items: center;
    gap: 2px;
    min-width: 90px;
    padding: 6px 12px;
    border-radius: 14px;
    border: 3px solid var(--c);
    background: var(--surface);
  }
  .tn {
    font: 600 0.8rem var(--font-head);
    color: var(--c);
  }
  .team b {
    font: 800 clamp(1.4rem, 3vw, 2.4rem) var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .tb {
    display: flex;
    gap: 4px;
  }
  .tb button {
    border: 0;
    border-radius: 8px;
    padding: 4px 10px;
    background: var(--c);
    color: #fff;
    font: 700 0.9rem var(--font-head);
    cursor: pointer;
  }
  .tb button + button {
    background: var(--surface-2);
    color: var(--ink);
  }
  .q {
    display: grid;
    align-content: center;
    justify-items: center;
    gap: clamp(12px, 2vh, 28px);
    max-width: 1200px;
    width: 100%;
    margin: 0 auto;
    text-align: center;
  }
  .timer {
    width: 100%;
    height: 12px;
    background: var(--surface-2);
    border-radius: 999px;
    overflow: hidden;
  }
  .timer i {
    display: block;
    height: 100%;
    background: var(--green);
    border-radius: inherit;
    transition: width 1s linear;
  }
  .timer i.low {
    background: var(--red);
  }
  .hint {
    margin: 0;
    color: var(--muted);
    font: 600 clamp(1rem, 2vw, 1.6rem) var(--font-head);
  }
  .prompt {
    margin: 0;
    font: 800 clamp(2rem, 6vw, 5rem) / 1.1 var(--font-head);
  }
  .say {
    border: 0;
    background: var(--surface-2);
    border-radius: 50%;
    width: 56px;
    height: 56px;
    font-size: 1.6rem;
    cursor: pointer;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: clamp(10px, 1.5vw, 20px);
    width: 100%;
  }
  .o {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: clamp(14px, 2vw, 26px);
    border: 3px solid var(--line);
    border-radius: 20px;
    background: var(--surface);
    box-shadow: 0 5px 0 var(--line);
    font: 700 clamp(1.1rem, 2.6vw, 2.2rem) / 1.2 var(--font-head);
    text-align: left;
  }
  .l {
    flex: none;
    display: grid;
    place-items: center;
    width: 1.8em;
    height: 1.8em;
    border-radius: 12px;
    background: var(--ink);
    color: var(--bg);
    font-size: 0.8em;
  }
  .o.picked {
    border-color: var(--focus);
    box-shadow: 0 5px 0 var(--focus);
  }
  .o.right {
    border-color: var(--green);
    background: var(--green-soft);
    box-shadow: 0 5px 0 var(--green);
  }
  .o.dim {
    opacity: 0.45;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .o.right {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .q {
      animation: rise 400ms var(--ease-enter) both;
    }
  }
  .ctrl {
    display: grid;
    justify-items: center;
    gap: 10px;
  }
  .ans {
    margin: 0;
    font-size: clamp(1rem, 2vw, 1.6rem);
  }
  kbd {
    font: 600 0.7em var(--font-text);
    opacity: 0.7;
    margin-left: 6px;
  }
  .end {
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 14px;
    text-align: center;
  }
  .end h2 {
    font-size: clamp(1.6rem, 4vw, 3rem);
  }
  .podium {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
    font: 600 clamp(1rem, 2vw, 1.6rem) var(--font-head);
  }
  .podium li {
    padding: 8px 18px;
    border-radius: 14px;
    border: 3px solid var(--c);
    background: var(--surface);
  }
  .row {
    display: flex;
    gap: 10px;
  }
  @media (max-width: 600px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
