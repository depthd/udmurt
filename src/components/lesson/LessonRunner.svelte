<script lang="ts">
  /**
   * Проигрыватель последовательности упражнений (используется уроком и повторением).
   * Контракт props (менять нельзя):
   *   runId      — id урока или 'practice-…' (для статистики)
   *   title      — заголовок (для экрана итогов)
   *   exercises  — список упражнений
   *   mode       — 'lesson' | 'practice'
   *   onfinish   — вызывается с итогом, когда ученик прошёл все задания (до экрана итогов).
   *                Может вернуть Reward (результат progress.completeLesson) — тогда экран итогов
   *                покажет XP, серию и достижения; без него — упрощённые итоги.
   *   onexit     — выход по крестику / после экрана итогов
   *
   * Поток: «Проверить» → плашка (верно / почти / неверно) → «Продолжить». Ошибка один раз
   * возвращается в конец очереди (src/lib/lesson.ts). Enter = Проверить/Продолжить, Escape = выход.
   */
  import { tick, untrack } from 'svelte';
  import { cubicIn, cubicOut } from 'svelte/easing';
  import type { Exercise, Morpheme } from '$lib/content/schema';
  import type { LessonResult, Reward } from '$lib/progress.svelte';
  import type { AnswerResult, ExerciseApi } from '../../exercises/types';
  import { exerciseComponents, exerciseTitles } from '../../exercises';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { lexicon } from '$lib/course';
  import {
    advance,
    createRun,
    hasUdmLetters,
    isFinished,
    progressOf,
    recordAnswer,
    summarize,
    type Outcome,
    type Run,
  } from '$lib/lesson';
  import ProgressBar from './ProgressBar.svelte';
  import FeedbackSheet from './FeedbackSheet.svelte';
  import LessonEnd from './LessonEnd.svelte';
  import ExitConfirm from './ExitConfirm.svelte';

  let {
    runId,
    title,
    exercises,
    mode = 'lesson',
    onfinish,
    onexit,
  }: {
    runId: string;
    title: string;
    exercises: Exercise[];
    mode?: 'lesson' | 'practice';
    onfinish?: (r: LessonResult) => void;
    onexit: () => void;
  } = $props();

  type Feedback = {
    kind: Outcome;
    title: string;
    expected: string;
    meaning?: string;
    note?: string;
    explain?: string;
    lang?: 'udm' | 'ru';
    morphemes: Morpheme[];
    reportUrl?: string;
  };

  /** Ссылка «Сообщить об ошибке»: готовая заявка на GitHub с данными задания. */
  function reportUrl(ex: Exercise, expected: string, kind: Outcome): string {
    const item = 'item' in ex && ex.item ? ex.item : '';
    const title = `Ошибка в задании: ${runId} — ${ex.type}${item ? ' / ' + item : ''}`;
    const body = [
      `**Урок:** ${runId} (${title})`,
      `**Задание:** ${ex.type}${item ? `, слово \`${item}\`` : ''}`,
      `**Правильный ответ на сайте:** ${expected || '—'}`,
      `**Мой результат:** ${kind}`,
      '',
      '**Что не так** (например: «мой ответ тоже верный», «опечатка», «носители так не говорят»):',
      '',
      '',
      `_Отправлено со страницы ${location.href}_`,
    ].join('\n');
    return `https://github.com/depthd/udmurt/issues/new?labels=${encodeURIComponent('контент')}&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  const E2E = import.meta.env.VITE_E2E === '1';
  /** Пауза после смены состояния, в которую повторные нажатия игнорируются (двойной клик/Enter). */
  const LOCK_MS = E2E ? 0 : 250;
  const PRAISE = ['Верно!', 'Отлично!', 'Здорово!', 'Так держать!', 'Прекрасно!', 'Умница!'];

  const init = () => createRun(exercises);
  let run = $state.raw<Run>(init());
  let phase = $state<'answer' | 'feedback' | 'end'>('answer');
  let ready = $state(false);
  let feedback = $state<Feedback | null>(null);
  let confirmOpen = $state(false);
  let live = $state('');
  let endResult = $state<LessonResult | null>(null);
  let reward = $state<Reward | undefined>(undefined);
  let headingEl = $state<HTMLHeadingElement>();
  let stageEl = $state<HTMLElement>();

  let checker: (() => AnswerResult) | null = null;
  let lockUntil = 0;
  let lastInput: 'pointer' | 'keyboard' = 'pointer';
  const startedAt = performance.now();

  const pos = $derived(run.pos);
  const entry = $derived(run.queue[pos]);
  const ex = $derived(entry?.ex);
  const teachNow = $derived(ex?.type === 'teach');
  const prog = $derived(progressOf(run));
  const heading = $derived(ex ? titleFor(ex) : '');
  /** Отдельный api для каждой позиции: вызовы от уходящего (анимируемого) компонента игнорируются. */
  const api = $derived(makeApi(pos));

  const now = () => performance.now();

  function makeApi(p: number): ExerciseApi {
    const mine = () => untrack(() => run.pos === p && phase !== 'end');
    return {
      setReady(r) {
        if (mine()) ready = !!r;
      },
      setChecker(fn) {
        if (mine()) checker = fn;
      },
      complete(result) {
        if (mine()) untrack(() => completeFromExercise(result));
      },
    };
  }

  function titleFor(e: Exercise): string {
    switch (e.type) {
      case 'choice':
        if (e.pictures) return 'Выберите картинку';
        return e.dir === 'ru-udm' ? 'Как это по-удмуртски?' : 'Выберите перевод';
      case 'tiles':
        return e.dir === 'udm-ru' ? 'Соберите перевод' : 'Соберите фразу по-удмуртски';
      case 'type':
        return e.dir === 'udm-ru' ? 'Напишите перевод' : 'Напишите по-удмуртски';
      default:
        return exerciseTitles[e.type];
    }
  }

  function answerLang(e: Exercise, expected: string): 'udm' | 'ru' | undefined {
    switch (e.type) {
      case 'choice':
      case 'tiles':
      case 'type':
        return e.dir === 'udm-ru' ? 'ru' : 'udm';
      case 'fill':
      case 'build':
        return 'udm';
      case 'listen':
        if (e.mode === 'type') return 'udm';
        return hasUdmLetters(expected) ? 'udm' : undefined;
      default:
        return hasUdmLetters(expected) ? 'udm' : undefined;
    }
  }

  function morphemesOf(e: Exercise): Morpheme[] {
    if (!prefs.value.morphemes || !('item' in e) || !e.item) return [];
    const it = lexicon.get(e.item);
    return it && it.morphemes.length > 1 ? it.morphemes : [];
  }

  function announce(text: string) {
    live = '';
    requestAnimationFrame(() => (live = text.replace(/\s+/g, ' ').trim()));
  }

  /* ───────── действия ───────── */

  function check() {
    if (phase !== 'answer' || !ex || now() < lockUntil) return;
    if (teachNow) return continueTeach();
    if (!ready || !checker) return;
    let res: AnswerResult;
    try {
      res = checker();
    } catch (err) {
      console.error('Ошибка проверки ответа', err);
      return;
    }
    showFeedback(res);
  }

  function completeFromExercise(res: AnswerResult) {
    if (phase !== 'answer' || !ex) return;
    if (teachNow) {
      run = recordAnswer(run, res);
      return next(true);
    }
    showFeedback(res);
  }

  function continueTeach() {
    if (phase !== 'answer' || !teachNow || now() < lockUntil) return;
    let res: AnswerResult = { correct: true, expected: '', grades: {} };
    try {
      if (checker) res = checker();
    } catch {
      /* карточка без проверки — просто идём дальше */
    }
    run = recordAnswer(run, res);
    sfx.tap();
    next(true);
  }

  function showFeedback(res: AnswerResult) {
    if (!ex) return;
    run = recordAnswer(run, res);
    const kind = run.last ?? 'wrong';
    const expected = res.expected ?? '';
    const streak = run.streak;
    const t =
      kind === 'correct'
        ? PRAISE[(run.pos * 5 + streak) % PRAISE.length]
        : kind === 'almost'
          ? 'Почти!'
          : expected
            ? 'Правильный ответ:'
            : 'Не совсем так';
    feedback = {
      kind,
      title: t,
      expected,
      meaning: res.meaning,
      note: res.note,
      explain: ex.explain,
      lang: answerLang(ex, expected),
      morphemes: morphemesOf(ex),
      reportUrl: reportUrl(ex, expected, kind),
    };
    phase = 'feedback';
    lockUntil = now() + LOCK_MS;

    if (kind === 'wrong') {
      sfx.wrong();
      haptic.wrong();
      announce(`Неверно. ${expected ? `Правильный ответ: ${expected}.` : ''} ${ex.explain ?? ''}`);
    } else {
      if (streak >= 3) {
        sfx.combo(streak - 2);
        if (streak === 3 || streak % 5 === 0) haptic.combo();
        else haptic.correct();
      } else {
        sfx.correct();
        haptic.correct();
      }
      const combo = streak >= 3 ? `${streak} подряд!` : '';
      announce(
        kind === 'almost'
          ? `Почти верно. ${res.note ?? ''} Правильно: ${expected}. ${combo}`
          : `Верно! ${res.meaning ?? ''} ${combo}`,
      );
    }
  }

  function next(force = false) {
    if (!force && (phase !== 'feedback' || now() < lockUntil)) return;
    if (force && now() < lockUntil) return;
    run = advance(run);
    feedback = null;
    ready = false;
    checker = null;
    if (isFinished(run)) return finish();
    phase = 'answer';
    lockUntil = now() + LOCK_MS;
    void tick().then(() => {
      const a = document.activeElement;
      if (!a || a === document.body || !document.contains(a)) headingEl?.focus({ preventScroll: true });
    });
  }

  function isReward(v: unknown): v is Reward {
    return !!v && typeof v === 'object' && 'xp' in v && 'streakAfter' in v;
  }

  function finish() {
    if (phase === 'end') return;
    const r = summarize(run, runId, now() - startedAt);
    endResult = r;
    let ret: unknown;
    try {
      ret = (onfinish as ((r: LessonResult) => unknown) | undefined)?.(r);
    } catch (err) {
      console.error('Не удалось сохранить итог урока', err);
    }
    reward = isReward(ret) ? ret : undefined;
    phase = 'end';
    confirmOpen = false;
    const acc = r.total ? Math.round((r.correct / r.total) * 100) : 100;
    announce(`${mode === 'practice' ? 'Повторение окончено' : 'Урок пройден'}. ${reward ? `+${reward.xp} XP. ` : ''}Точность ${acc} %.`);
    window.scrollTo({ top: 0 });
  }

  function requestExit() {
    if (phase === 'end') return onexit();
    if (run.answered >= 0 || prog.done > 0) confirmOpen = true;
    else onexit();
  }

  /* ───────── клавиатура ───────── */

  function onkeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key.startsWith('Arrow')) lastInput = 'keyboard';
    if (phase === 'end' || confirmOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      requestExit();
      return;
    }
    if (e.key !== 'Enter' || e.isComposing || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.repeat) {
      e.preventDefault();
      return;
    }
    const t = e.target instanceof Element ? e.target : null;
    if (t?.closest('textarea, [contenteditable="true"]')) return;
    const control = t?.closest('button, a[href], [role="button"], [role="radio"], [role="checkbox"], select, summary');
    if (control) {
      // свои кнопки (Проверить/Продолжить/крестик) срабатывают сами
      if (!stageEl?.contains(control)) return;
      // к варианту пришли Tab'ом — Enter выбирает его, как обычно
      if (lastInput === 'keyboard' && phase === 'answer') return;
    }
    e.preventDefault();
    if (phase === 'feedback') next();
    else check();
  }

  /* ───────── переходы между заданиями ───────── */

  function slideIn(_node: Element) {
    if (prefs.reduceMotion) return { duration: 0 };
    return {
      duration: 260,
      delay: 60,
      easing: cubicOut,
      css: (t: number, u: number) => `opacity:${t};transform:translateX(${u * 36}px)`,
    };
  }
  function slideOut(_node: Element) {
    if (prefs.reduceMotion) return { duration: 0 };
    return {
      duration: 200,
      easing: cubicIn,
      css: (t: number, u: number) => `opacity:${t};transform:translateX(${-u * 36}px)`,
    };
  }
</script>

<svelte:window onkeydowncapture={onkeydown} onpointerdowncapture={() => (lastInput = 'pointer')} />

<div class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{live}</div>

{#if phase === 'end' && endResult}
  <LessonEnd result={endResult} {reward} {title} {mode} {onexit} />
{:else if run.total === 0}
  <section class="page empty">
    <h1>Здесь пока нет заданий</h1>
    <button class="btn btn--ink" type="button" onclick={onexit}>Назад</button>
  </section>
{:else}
  <div class="runner" data-testid="lesson" data-mode={mode}>
    <header class="top">
      <div class="top-in">
        <button class="x" type="button" aria-label="Выйти из урока" data-testid="exit" onclick={requestExit}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <ProgressBar value={prog.done} max={prog.total} combo={run.streak} />
      </div>
    </header>

    <section class="stage" bind:this={stageEl} aria-label="Задание">
      {#key pos}
        {#if entry}
          {@const Comp = exerciseComponents[entry.ex.type]}
          <div class="slide" in:slideIn out:slideOut data-type={entry.ex.type}>
            {#if entry.attempt > 0}
              <span class="chip retry"><span aria-hidden="true">↻</span> Работа над ошибкой</span>
            {/if}
            <!-- у карточки teach своя метка «Новое слово» — заголовок остаётся для диктора -->
            <h1 class="task" class:visually-hidden={entry.ex.type === 'teach'} bind:this={headingEl} tabindex="-1">{heading}</h1>
            <div class="ex">
              <Comp ex={entry.ex} locked={phase === 'feedback'} {api} />
            </div>
          </div>
        {/if}
      {/key}
    </section>

    <footer class="foot">
      {#if phase === 'feedback' && feedback}
        <FeedbackSheet {...feedback} oncontinue={() => next()} />
      {:else}
        <div class="bar">
          <div class="bar-in">
            {#if teachNow}
              <button class="btn btn--ink go" type="button" data-testid="continue" onclick={continueTeach}>Продолжить</button>
            {:else}
              <button class="btn btn--ink go" type="button" data-testid="check" disabled={!ready} onclick={check}>
                Проверить
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </footer>
  </div>

  <ExitConfirm open={confirmOpen} onstay={() => (confirmOpen = false)} onleave={() => ((confirmOpen = false), onexit())} />
{/if}

<style>
  .runner {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--bg);
    padding: 16px var(--gutter) 8px;
    padding-top: max(16px, env(safe-area-inset-top));
  }
  .top-in {
    max-width: var(--page-max);
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: -10px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .x:hover {
    background: var(--surface-2);
    color: var(--ink);
  }
  .x svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .stage {
    flex: 1;
    display: grid;
    width: 100%;
    max-width: var(--page-max);
    margin: 0 auto;
    padding: 12px var(--gutter) 28px;
    overflow-x: clip;
  }
  .slide {
    grid-area: 1 / 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  .retry {
    align-self: flex-start;
    margin-bottom: 8px;
    color: var(--amber);
    background: var(--amber-soft);
    font-size: 0.8rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .task {
    font-size: clamp(1.3rem, 1.1rem + 1vw, 1.6rem);
    margin: 0 0 16px;
    outline: none;
  }
  .ex {
    flex: 1;
    min-width: 0;
  }
  .foot {
    position: sticky;
    bottom: 0;
    z-index: 5;
  }
  .bar {
    background: var(--bg);
    border-top: 2px solid var(--line);
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
  }
  .bar-in {
    max-width: var(--page-max);
    margin: 0 auto;
    display: flex;
    justify-content: flex-end;
  }
  .go {
    width: 100%;
  }
  @media (min-width: 640px) {
    .go {
      width: auto;
      min-width: 200px;
    }
  }
  .empty {
    text-align: center;
  }
</style>
