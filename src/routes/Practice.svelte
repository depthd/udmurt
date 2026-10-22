<script lang="ts">
  import LessonRunner from '../components/lesson/LessonRunner.svelte';
  import Mascot from '../components/Mascot.svelte';
  import { progress } from '$lib/progress.svelte';
  import { lexicon, personalize } from '$lib/course';
  import { strength } from '$lib/srs';
  import { pickItems, buildPractice, type PracticeMode } from '$lib/practice';
  import { href, router } from '$lib/router.svelte';
  import { dayKey } from '$lib/dates';
  import type { Exercise } from '$lib/content/schema';
  import { ui } from '$lib/ui.svelte';

  let running = $state<{ mode: PracticeMode; exercises: Exercise[]; key: number } | null>(null);

  $effect(() => {
    ui.immersive = running !== null;
    return () => (ui.immersive = false);
  });

  const due = $derived(progress.dueCards().filter((id) => lexicon.has(id)));
  const known = $derived(Object.keys(progress.data.cards).filter((id) => lexicon.has(id)));
  const mistakes = $derived(Object.entries(progress.data.mistakes).filter(([id, n]) => n > 0 && lexicon.has(id)));
  const weakest = $derived(
    [...known]
      .sort((a, b) => strength(progress.data.cards[a]) - strength(progress.data.cards[b]))
      .slice(0, 8)
      .map((id) => lexicon.get(id)!),
  );

  function start(mode: PracticeMode) {
    const seed = `${dayKey()}-${mode}-${progress.data.xp}`;
    const ids = pickItems({
      mode,
      due,
      mistakes: progress.data.mistakes,
      known,
      strength: (id) => strength(progress.data.cards[id]),
      lexicon,
      seed,
    });
    const exercises = buildPractice(ids, lexicon, seed);
    if (exercises.length) running = { mode, exercises, key: Date.now() };
  }

  const titles: Record<PracticeMode, string> = {
    due: 'Повторение',
    mistakes: 'Работа над ошибками',
    warmup: 'Быстрая разминка',
  };
</script>

{#if running}
  {#key running.key}
    <LessonRunner
      runId="practice-{running.mode}"
      title={titles[running.mode]}
      exercises={running.exercises}
      mode="practice"
      onfinish={(r) => progress.completePractice(r)}
      onexit={() => (running = null)}
    />
  {/key}
{:else}
  <section class="page practice">
    <header class="hero rise">
      <Mascot mood={known.length ? 'think' : 'wave'} size={110} />
      <div>
        <h1>Повторять</h1>
        {#if known.length === 0}
          <p class="muted">Здесь будут слова из пройденных уроков — по умной схеме: чем лучше помните, тем реже они возвращаются.</p>
        {:else if due.length}
          <p><b>{due.length}</b> {due.length === 1 ? 'слово пора' : due.length < 5 ? 'слова пора' : 'слов пора'} повторить. Пара минут — и память обновится.</p>
        {:else}
          <p class="muted">Сейчас всё свежо в памяти. Можно размяться или вернуться к урокам.</p>
        {/if}
      </div>
    </header>

    {#if known.length === 0}
      <div class="card empty">
        <p>Пройдите первый урок, чтобы появились слова для повторения.</p>
        <a class="btn" href={href('/learn')}>К урокам</a>
      </div>
    {:else}
      <div class="modes">
        <button class="mode card rise" style="--d: 0ms" onclick={() => start('due')} disabled={!due.length && !known.length} data-testid="practice-due">
          <span class="ic" aria-hidden="true">🔁</span>
          <span class="t">Повторение</span>
          <span class="s">{due.length ? `${due.length} по расписанию` : 'самые «слабые» слова'}</span>
        </button>
        <button class="mode card rise" style="--d: 80ms" onclick={() => start('mistakes')} disabled={!mistakes.length} data-testid="practice-mistakes">
          <span class="ic" aria-hidden="true">🎯</span>
          <span class="t">Работа над ошибками</span>
          <span class="s">{mistakes.length ? `${mistakes.length} слов с ошибками` : 'ошибок пока нет — отлично!'}</span>
        </button>
        <button class="mode card rise" style="--d: 160ms" onclick={() => start('warmup')} data-testid="practice-warmup">
          <span class="ic" aria-hidden="true">⚡</span>
          <span class="t">Быстрая разминка</span>
          <span class="s">5 случайных слов, 1 минута</span>
        </button>
      </div>

      <a class="mode card" href={href('/game')} style="margin-top: 12px; text-decoration: none">
        <span class="ic" aria-hidden="true">🟩</span>
        <span class="t">Игра «5 букв»</span>
        <span class="s">удмуртское слово дня</span>
      </a>

      <h2 class="sub">Сила слов</h2>
      <ul class="words">
        {#each weakest as it (it.id)}
          {@const st = strength(progress.data.cards[it.id])}
          <li>
            <span class="u" lang="udm">{personalize(it.udm)}</span>
            <span class="r muted">{personalize(it.ru)}</span>
            <span class="bar" role="img" aria-label="Сила слова {Math.round(st * 100)}%"><i style:width="{Math.max(6, st * 100)}%" class:weak={st < 0.5}></i></span>
          </li>
        {/each}
      </ul>
      <p class="muted small">Полоска показывает, насколько вероятно вспомнить слово сейчас (алгоритм FSRS).</p>
      <button class="btn btn--flat" onclick={() => router.go('/learn')}>← К урокам</button>
    {/if}
  </section>
{/if}

<style>
  .hero {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 20px;
  }
  .hero h1 {
    margin-bottom: 4px;
  }
  .hero p {
    margin: 0;
  }
  .empty {
    display: grid;
    gap: 12px;
    justify-items: start;
  }
  .modes {
    display: grid;
    gap: 12px;
  }
  .mode {
    display: grid;
    grid-template-columns: 48px 1fr;
    grid-template-rows: auto auto;
    column-gap: 12px;
    align-items: center;
    text-align: left;
    cursor: pointer;
    box-shadow: 0 4px 0 var(--line);
    font: inherit;
    color: inherit;
    animation-delay: var(--d);
  }
  .mode:active:not(:disabled) {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--line);
  }
  .mode:disabled {
    opacity: 0.55;
    cursor: default;
  }
  .ic {
    grid-row: 1 / 3;
    font-size: 1.8rem;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--surface-2);
  }
  .t {
    font: 700 1.05rem var(--font-head);
  }
  .s {
    color: var(--muted);
    font-size: 0.9rem;
  }
  .sub {
    font-size: 1.1rem;
    margin: 28px 0 10px;
  }
  .words {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .words li {
    display: grid;
    grid-template-columns: 1fr 90px;
    grid-template-rows: auto auto;
    column-gap: 12px;
    padding: 10px 14px;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
  }
  .u {
    font: 600 1.05rem var(--font-head);
  }
  .r {
    grid-row: 2;
    font-size: 0.9rem;
  }
  .bar {
    grid-row: 1 / 3;
    grid-column: 2;
    align-self: center;
    height: 10px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--green);
  }
  .bar i.weak {
    background: var(--amber);
  }
  .small {
    font-size: 0.85rem;
    margin-top: 10px;
  }
</style>
