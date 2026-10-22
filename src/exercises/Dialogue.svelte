<script lang="ts">
  /**
   * Dialogue — мини-диалог-«чат» и вопрос на понимание.
   * Реплики появляются по очереди (400–600 мс, с «печатает…»), при reduced motion — сразу.
   * Ученик ({name}) — справа, собеседники — слева; у каждой реплики кнопка «перевод».
   * Оценка SRS: при верном ответе — 3 всем словам-репликам (неявное повторение), иначе ничего.
   */
  import { onDestroy, tick, untrack } from 'svelte';
  import type { Exercise } from '$lib/content/schema';
  import type { AnswerResult, ExerciseProps } from './types';
  import { seededShuffle } from './types';
  import { lexicon, personalize } from '$lib/course';
  import { normalize } from '$lib/answer';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import AudioButton from '../components/exercise/AudioButton.svelte';
  import { E2E, STUDENT, dialogueSides, digitIndex } from '../components/exercise2/logic';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'dialogue' }>> = $props();

  type Line = {
    who: string;
    name: string;
    student: boolean;
    side: 'left' | 'right';
    /** Первая реплика в серии одного говорящего — с аватаром и именем. */
    head: boolean;
    udm: string;
    ru: string;
    audio?: string;
    synth: boolean;
  };

  const lines = $derived.by<Line[]>(() => {
    const sides = dialogueSides(ex.lines);
    return ex.lines.map((l, k) => {
      const it = l.item ? lexicon.get(l.item) : undefined;
      return {
        who: l.who,
        name: l.who === STUDENT ? 'Вы' : personalize(l.who),
        student: l.who === STUDENT,
        side: sides[k],
        head: k === 0 || ex.lines[k - 1].who !== l.who,
        udm: personalize(it?.udm ?? l.udm ?? ''),
        ru: personalize(it?.ru ?? l.ru ?? ''),
        audio: it?.audio,
        synth: it?.audio_synth ?? false,
      };
    });
  });
  const items = $derived([...new Set(ex.lines.map((l) => l.item).filter((id): id is string => !!id && lexicon.has(id)))]);
  const answer = $derived(personalize(ex.answer));
  const options = $derived(
    seededShuffle(
      ex.options.map((o) => personalize(o)),
      `${ex.id ?? ''}|dialogue|${ex.question}`,
    ),
  );
  const isRight = (o: string) => normalize(o) === normalize(answer);

  const instant = prefs.reduceMotion || E2E;
  let shown = $state(instant ? untrack(() => ex.lines.length) : 0);
  const done = $derived(shown >= lines.length);
  let open = $state<Record<number, boolean>>({});
  let picked = $state<number | null>(null);
  let verdict = $state<boolean | null>(null);
  let chat = $state<HTMLElement>();
  const uid = $props.id();

  /* ─── поочерёдное появление реплик ─── */
  let timer: ReturnType<typeof setTimeout> | undefined;
  function step() {
    if (shown >= lines.length) return;
    const nextLine = lines[shown];
    const delay = shown === 0 ? 250 : Math.min(600, 400 + nextLine.udm.length * 6);
    timer = setTimeout(() => {
      shown += 1;
      void tick().then(reveal);
      step();
    }, delay);
  }
  if (!instant) step();
  onDestroy(() => clearTimeout(timer));

  /** Показать последнюю реплику / вопрос, если они ушли за нижний край. */
  function reveal() {
    const last = chat?.querySelector<HTMLElement>('[data-last]') ?? null;
    last?.scrollIntoView({ block: 'nearest', behavior: prefs.reduceMotion ? 'auto' : 'smooth' });
  }

  function toggle(k: number) {
    open[k] = !open[k];
  }

  function choose(i: number) {
    if (locked || !done) return;
    sfx.tap();
    haptic.tap();
    picked = i;
  }

  function check(): AnswerResult {
    const ok = picked !== null && isRight(options[picked]);
    verdict = ok;
    return {
      correct: ok,
      expected: answer,
      grades: ok ? Object.fromEntries(items.map((id) => [id, 3 as const])) : {},
    };
  }

  $effect(() => api.setReady(done && picked !== null));
  $effect(() => api.setChecker(check));

  function onkeydown(e: KeyboardEvent) {
    if (locked || !done) return;
    const i = digitIndex(e);
    if (i < 0 || i >= options.length) return;
    e.preventDefault();
    choose(i);
  }
</script>

<svelte:window {onkeydown} />

<div class="dialogue" bind:this={chat}>
  <ol class="chat" aria-label="Диалог">
    {#each lines.slice(0, shown) as l, k (k)}
      <li class="row row--{l.side}" class:head={l.head} data-last={k === shown - 1 && !done ? '' : undefined}>
        {#if l.head}
          <span class="ava" class:ava--me={l.student} aria-hidden="true">{l.student ? '🙂' : l.name.slice(0, 1)}</span>
        {:else}
          <span class="ava ava--none" aria-hidden="true"></span>
        {/if}
        <div class="msg">
          {#if l.head}<span class="who">{l.name}</span>{/if}
          <div class="bubble" class:me={l.student}>
            <span class="visually-hidden">{l.name}:</span>
            <p class="udm-line">
              <span class="udm" lang="udm">{l.udm}</span>
              {#if l.audio}<span class="audio"><AudioButton audio={l.audio} synth={l.synth} size="sm" label="Прослушать реплику" /></span>{/if}
            </p>
            {#if l.ru}
              <button
                type="button"
                class="tr"
                aria-expanded={!!open[k]}
                aria-controls="{uid}-tr-{k}"
                data-testid="dialogue-translate-{k}"
                onclick={() => toggle(k)}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"
                  ><path d="M4 5h9M8.5 3v2c0 4-2 7-5 8.5M6 9c1 2.5 3 4 6 5M13 20l4-9 4 9M14.5 17h5" /></svg
                >
                {open[k] ? 'скрыть' : 'перевод'}
              </button>
              <p class="ru" id="{uid}-tr-{k}" lang="ru" hidden={!open[k]}>{l.ru}</p>
            {/if}
          </div>
        </div>
      </li>
    {/each}
    {#if !done && shown > 0}
      {@const nx = lines[shown]}
      <li class="row row--{nx.side} typing" aria-hidden="true">
        <span class="ava ava--none"></span>
        <div class="msg">
          <div class="bubble dots" class:me={nx.student}><i></i><i></i><i></i></div>
        </div>
      </li>
    {/if}
  </ol>

  {#if done}
    <section class="quiz" aria-labelledby="{uid}-q" data-last={!locked ? '' : undefined}>
      <h2 class="q" id="{uid}-q">{personalize(ex.question)}</h2>
      <div class="opts" role="group" aria-labelledby="{uid}-q">
        {#each options as o, i (o + i)}
          {@const sel = picked === i}
          <button
            type="button"
            class="tile opt"
            class:is-selected={sel && !locked}
            class:is-correct={locked && isRight(o)}
            class:is-wrong={locked && sel && !isRight(o)}
            class:is-dim={locked && !sel && !isRight(o)}
            aria-pressed={sel}
            disabled={locked}
            aria-keyshortcuts={i < 9 ? String(i + 1) : undefined}
            data-testid="dialogue-option-{i}"
            data-correct={E2E && isRight(o) ? 'true' : undefined}
            onclick={() => choose(i)}
          >
            <span class="key" aria-hidden="true">{i + 1}</span>
            <span class="otext">{o}</span>
            {#if locked && isRight(o)}<span class="mark" aria-hidden="true">✓</span>{/if}
          </button>
        {/each}
      </div>
    </section>
  {/if}
  {#if locked && verdict !== null}<span class="visually-hidden" role="status">{verdict ? 'Верно' : `Правильный ответ: ${answer}`}</span>{/if}
</div>

<style>
  .dialogue {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }
  .chat {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    max-width: 100%;
    scroll-margin-bottom: 120px;
  }
  .row.head:not(:first-child) {
    margin-top: 10px;
  }
  .row--right {
    flex-direction: row-reverse;
  }
  .ava {
    flex: none;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    margin-top: 22px;
    border-radius: 50%;
    background: var(--red-soft);
    color: var(--red);
    font: 700 1rem/1 var(--font-head);
  }
  .ava--me {
    background: var(--blue-soft);
    color: var(--blue);
    font-size: 1.2rem;
  }
  .ava--none {
    visibility: hidden;
    height: 1px;
    margin-top: 0;
  }
  .msg {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    max-width: min(80%, 460px);
  }
  .row--right .msg {
    align-items: flex-end;
  }
  .who {
    padding: 0 6px;
    font: 600 0.8rem/1.2 var(--font-head);
    color: var(--muted);
  }
  .bubble {
    position: relative;
    min-width: 0;
    padding: 10px 14px 4px;
    border: 2px solid var(--line);
    border-radius: 18px;
    background: var(--surface);
    transform-origin: 0 0;
  }
  .row--left.head .bubble {
    border-top-left-radius: 6px;
  }
  .row--right .bubble {
    transform-origin: 100% 0;
  }
  .row--right.head .bubble {
    border-top-right-radius: 6px;
  }
  .bubble.me {
    border-color: color-mix(in srgb, var(--blue) 35%, var(--line));
    background: var(--blue-soft);
  }
  .udm-line {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 1.15rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
  .audio {
    flex: none;
    display: inline-flex;
  }
  .tr {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 40px;
    margin: 0 -8px;
    padding: 0 8px;
    border: 0;
    border-radius: 10px;
    background: none;
    color: var(--blue);
    font: 600 0.82rem/1 var(--font-text);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .tr:hover {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .tr svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ru {
    margin: 0 0 8px;
    padding-top: 6px;
    border-top: 1px dashed var(--line-strong);
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.4;
  }

  /* «печатает…» */
  .dots {
    display: inline-flex;
    gap: 5px;
    padding: 14px 16px;
  }
  .dots i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--line-strong);
  }

  /* ─── вопрос ─── */
  .quiz {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding-top: 18px;
    border-top: 2px dashed var(--line);
    scroll-margin-bottom: 120px;
  }
  .q {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 600;
  }
  .opts {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .opt {
    min-height: 56px;
    font-weight: 600;
  }
  .otext {
    flex: 1;
    min-width: 0;
  }
  .opt.is-dim {
    opacity: 0.55;
  }
  .opt.is-correct .key {
    border-color: var(--green);
    color: var(--green);
  }
  .opt.is-wrong .key {
    border-color: var(--red);
    color: var(--red);
  }
  .mark {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--green);
    color: var(--on-fill);
    font: 700 0.85rem/1 var(--font-head);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .bubble {
      animation: msg-in var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .ava:not(.ava--none),
    :global(html:not([data-motion='reduce'])) .who {
      animation: fade-in var(--dur-base) var(--ease-standard) both;
    }
    :global(html:not([data-motion='reduce'])) .dots i {
      animation: dot 900ms var(--ease-standard) infinite;
    }
    :global(html:not([data-motion='reduce'])) .dots i:nth-child(2) {
      animation-delay: 150ms;
    }
    :global(html:not([data-motion='reduce'])) .dots i:nth-child(3) {
      animation-delay: 300ms;
    }
    :global(html:not([data-motion='reduce'])) .ru:not([hidden]) {
      animation: rise var(--dur-base) var(--ease-enter) both;
    }
    :global(html:not([data-motion='reduce'])) .quiz {
      animation: rise var(--dur-slow) var(--ease-enter) both;
    }
    :global(html:not([data-motion='reduce'])) .mark {
      animation: pop var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
  @keyframes msg-in {
    from {
      opacity: 0;
      transform: translateY(8px) scale(0.88);
    }
    30% {
      opacity: 1;
    }
  }
  @keyframes dot {
    0%,
    60%,
    100% {
      transform: none;
      opacity: 0.5;
    }
    30% {
      transform: translateY(-4px);
      opacity: 1;
    }
  }
</style>
