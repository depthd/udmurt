<script lang="ts">
  /**
   * Match — найти пары удмуртский ↔ русский. Самозавершающееся упражнение:
   * когда все пары найдены, вызывает api.complete().
   *   верная пара — обе плитки зеленеют с «пружинкой», затем гаснут;
   *   неверная — красная вспышка 400 мс и тряска, выбор сбрасывается.
   * Оценка SRS: 3 — слово сопоставлено без ошибок, 2 — с ошибкой.
   * Клавиатура: 1…n — левый столбец, n+1…2n — правый (пока хватает цифр).
   */
  import type { Exercise } from '$lib/content/schema';
  import type { Grade } from '$lib/srs';
  import type { AnswerResult, ExerciseProps } from './types';
  import { item, personalize } from '$lib/course';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { E2E, isChoiceKey, keyIndex, keyLabel, matchColumns } from '../components/exercise/options';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'match' }>> = $props();

  type Side = 'udm' | 'ru';
  type State = {
    seed: string;
    sel: { udm: string | null; ru: string | null };
    /** Найденные пары (id слова). */
    matched: string[];
    /** Только что найденные — горят зелёным, потом гаснут. */
    fresh: string[];
    /** Неверная пара — красная вспышка. */
    wrong: { udm: string; ru: string } | null;
    /** Слова, с которыми ошибались. */
    errs: string[];
    mistakes: number;
    finished: boolean;
  };

  const seed = $derived(`${ex.id ?? ''}|match|${ex.items.join(',')}`);
  const cols = $derived(matchColumns(ex.items, seed));
  const words = $derived(
    new Map(
      ex.items.map((id) => {
        const it = item(id);
        return [id, { udm: personalize(it.udm), ru: personalize(it.ru) }];
      }),
    ),
  );
  const n = $derived(ex.items.length);

  const fresh = (s: string): State => ({
    seed: s,
    sel: { udm: null, ru: null },
    matched: [],
    fresh: [],
    wrong: null,
    errs: [],
    mistakes: 0,
    finished: false,
  });
  // Начальное значение — пустое; $effect.pre ниже заполняет его до первой отрисовки и сбрасывает
  // при смене упражнения (если оболочка переиспользует компонент).
  let st = $state<State>(fresh(''));
  let message = $state('');
  const timers = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers.clear();
  }

  $effect.pre(() => {
    if (st.seed !== seed) {
      clearTimers();
      st = fresh(seed);
      message = '';
    }
  });
  $effect(() => clearTimers);

  function result(): AnswerResult {
    const grades: Record<string, Grade> = {};
    for (const id of ex.items) grades[id] = st.errs.includes(id) ? 2 : 3;
    return {
      correct: st.mistakes === 0,
      expected: ex.items.map((id) => `${words.get(id)!.udm} — ${words.get(id)!.ru}`).join('; '),
      grades,
    };
  }

  $effect(() => {
    api.setReady(false);
    api.setChecker(result);
  });

  const isDone = (id: string) => st.matched.includes(id);

  function tap(side: Side, id: string) {
    if (locked || st.finished || isDone(id)) return;
    st.wrong = null;
    const other: Side = side === 'udm' ? 'ru' : 'udm';
    st.sel[side] = st.sel[side] === id ? null : id;
    if (st.sel[side] && st.sel[other]) evaluate();
    else {
      sfx.tap();
      haptic.tap();
    }
  }

  function evaluate() {
    const u = st.sel.udm!;
    const r = st.sel.ru!;
    st.sel = { udm: null, ru: null };
    if (u === r) {
      st.matched.push(u);
      st.fresh.push(u);
      sfx.combo(st.matched.length - 1);
      haptic.correct();
      const w = words.get(u)!;
      message = `Верно: ${w.udm} — ${w.ru}.`;
      later(() => (st.fresh = st.fresh.filter((x) => x !== u)), 700);
      if (st.matched.length === n) finish();
    } else {
      st.mistakes++;
      for (const id of [u, r]) if (!st.errs.includes(id)) st.errs.push(id);
      st.wrong = { udm: u, ru: r };
      sfx.wrong();
      haptic.wrong();
      message = `Не пара: ${words.get(u)!.udm} и ${words.get(r)!.ru}. Попробуйте ещё.`;
      later(() => {
        if (st.wrong?.udm === u && st.wrong?.ru === r) st.wrong = null;
      }, 400);
    }
  }

  function finish() {
    st.finished = true;
    message = st.mistakes === 0 ? 'Все пары найдены без ошибок!' : 'Все пары найдены.';
    const res = result();
    later(() => api.complete(res), prefs.reduceMotion ? 250 : 650);
  }

  function onkeydown(e: KeyboardEvent) {
    if (locked || st.finished || !isChoiceKey(e)) return;
    const i = keyIndex(e.key);
    const id = i < n ? cols.left[i] : cols.right[i - n];
    if (!id) return;
    e.preventDefault();
    tap(i < n ? 'udm' : 'ru', id);
  }

  function tileState(side: Side, id: string) {
    if (isDone(id)) return st.fresh.includes(id) ? 'is-correct' : 'is-done';
    if (st.wrong && st.wrong[side] === id) return 'is-wrong';
    if (st.sel[side] === id) return 'is-selected';
    return '';
  }
</script>

<svelte:window {onkeydown} />

<div class="match" style:--rows={n}>
  <div class="board" role="group" aria-label="Пары: удмуртские слова слева, русские справа">
    {#each cols.left as id, i (id)}
      {@const s = tileState('udm', id)}
      {@const k = keyLabel(i)}
      <button
        type="button"
        class="tile m {s}"
        style:grid-area="{i + 1} / 1"
        style:--d="{i * 55}ms"
        aria-pressed={s === 'is-selected'}
        aria-keyshortcuts={k}
        disabled={locked}
        aria-disabled={isDone(id) || undefined}
        data-testid="match-udm-{i}"
        data-pair={E2E ? id : undefined}
        onclick={() => tap('udm', id)}
      >
        {#if k}<span class="key" aria-hidden="true">{k}</span>{/if}
        <span class="txt udm" lang="udm">{words.get(id)?.udm}</span>
      </button>
    {/each}
    {#each cols.right as id, i (id)}
      {@const s = tileState('ru', id)}
      {@const k = keyLabel(n + i)}
      <button
        type="button"
        class="tile m {s}"
        style:grid-area="{i + 1} / 2"
        style:--d="{i * 55 + 30}ms"
        aria-pressed={s === 'is-selected'}
        aria-keyshortcuts={k}
        disabled={locked}
        aria-disabled={isDone(id) || undefined}
        data-testid="match-ru-{i}"
        data-pair={E2E ? id : undefined}
        onclick={() => tap('ru', id)}
      >
        {#if k}<span class="key" aria-hidden="true">{k}</span>{/if}
        <span class="txt">{words.get(id)?.ru}</span>
      </button>
    {/each}
  </div>
  <p class="visually-hidden" role="status" aria-live="polite" aria-atomic="true">{message}</p>
</div>

<style>
  .match {
    width: 100%;
  }
  .board {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(var(--rows), minmax(64px, 1fr));
    gap: 12px;
  }
  .m {
    position: relative;
    justify-content: center;
    height: 100%;
    min-height: 64px;
    padding: 10px 12px;
    text-align: center;
    color: var(--ink);
  }
  .txt {
    min-width: 0;
    font: 600 1.02rem/1.25 var(--font-text);
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .txt.udm {
    font-family: var(--font-head);
    font-weight: 500;
    font-size: 1.08rem;
  }
  /* номер клавиши — только там, где есть клавиатура и место */
  .m .key {
    display: none;
  }
  @media (hover: hover) and (pointer: fine) and (min-width: 480px) {
    .m .key {
      display: inline-grid;
      position: absolute;
      left: 10px;
      top: 50%;
      translate: 0 -50%;
    }
    .m {
      padding-inline: 44px;
    }
  }
  .is-selected .key {
    border-color: var(--focus);
    color: var(--focus);
  }
  .is-correct .txt {
    color: var(--green);
  }
  .is-wrong .txt {
    color: var(--red);
  }
  /* найденная пара «гаснет»: остаётся на месте (сетка не прыгает), но притухает */
  .tile.is-done {
    border-color: var(--line);
    background: transparent;
    box-shadow: 0 4px 0 transparent;
    transform: translateY(2px);
    color: var(--muted);
    opacity: 0.5;
    cursor: default;
  }
  .is-done .key {
    opacity: 0;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .m {
      animation: m-in var(--dur-slow) var(--ease-enter) both;
      animation-delay: calc(60ms + var(--d, 0ms));
    }
    :global(html:not([data-motion='reduce'])) .tile.m.is-correct {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .tile.m.is-wrong {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .tile.m.is-done {
      animation: none;
      transition:
        opacity var(--dur-slow) var(--ease-standard),
        background-color var(--dur-slow),
        border-color var(--dur-slow),
        box-shadow var(--dur-base),
        transform var(--dur-base) var(--ease-standard);
    }
  }
  @keyframes m-in {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
  }
</style>
