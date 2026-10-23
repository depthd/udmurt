<script lang="ts">
  /**
   * Listen — послушать и выбрать (mode: choice) или напечатать (mode: type) услышанное.
   * Если у слова нет аудио (пока так у всех слов) — не ломаемся: показываем удмуртский текст
   * и просим выбрать перевод, как в choice udm→ru.
   * Оценка SRS: верно — 3, «почти» (буквы/опечатка) — 2, неверно — 1.
   */
  import type { Exercise } from '$lib/content/schema';
  import type { Grade } from '$lib/srs';
  import type { AnswerResult, ExerciseProps } from './types';
  import { accepted, item, lexicon, personalize } from '$lib/course';
  import { checkAnswer } from '$lib/answer';
  import { prefs } from '$lib/prefs.svelte';
  import AudioButton from '../components/exercise/AudioButton.svelte';
  import OptionList from '../components/exercise/OptionList.svelte';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import UdmKeyboard from '../components/UdmKeyboard.svelte';
  import { E2E, buildOptions, fillDistractors, lettersNote } from '../components/exercise/options';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'listen' }>> = $props();

  const it = $derived(item(ex.item));
  const hasAudio = $derived(!!it.audio);
  const mode = $derived(hasAudio ? ex.mode : 'choice');
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  const seed = $derived(`${ex.id ?? ''}|listen|${ex.item}|${ex.mode}`);

  const pool = [...lexicon.values()];
  const options = $derived.by(() => {
    const given = ex.distractors.filter((id) => lexicon.has(id)).map(item);
    const ds = fillDistractors(it, given, pool, seed, 3);
    return buildOptions(it, ds, hasAudio ? 'udm' : 'ru', seed, personalize);
  });

  /** Ответ привязан к упражнению (seed) — при смене упражнения сбрасывается сам. */
  let picked = $state<{ seed: string; id: string } | null>(null);
  const selected = $derived(picked?.seed === seed ? picked.id : null);
  let typed = $state<{ seed: string; v: string }>({ seed: '', v: '' });
  const value = $derived(typed.seed === seed ? typed.v : '');
  let verdict = $state<{ seed: string; v: 'ok' | 'almost' | 'bad' } | null>(null);
  const shown = $derived(verdict?.seed === seed ? verdict.v : null);

  let input: HTMLInputElement | null = $state(null);
  const uid = $props.id();

  function check(): AnswerResult {
    const meaning = `${udm} — ${ru}`;
    if (mode === 'choice') {
      const ok = selected === it.id;
      return { correct: ok, expected: hasAudio ? udm : ru, meaning, grades: { [it.id]: ok ? 3 : 1 } };
    }
    const v = checkAnswer(value, accepted(it, 'udm'));
    let g: Grade = 1;
    let res: AnswerResult;
    if (v.ok && v.exact) {
      g = 3;
      res = { correct: true, expected: v.matched, meaning, grades: {} };
    } else if (v.ok) {
      g = 2;
      const note = v.hint === 'diacritics' ? lettersNote(v.letters) : 'Небольшая опечатка — сравните с правильным написанием.';
      res = { correct: true, almost: true, note, expected: v.matched, meaning, grades: {} };
    } else {
      res = { correct: false, expected: udm, meaning, grades: {} };
    }
    res.grades = { [it.id]: g };
    verdict = { seed, v: g === 3 ? 'ok' : g === 2 ? 'almost' : 'bad' };
    return res;
  }

  $effect(() => api.setReady(mode === 'choice' ? selected !== null : value.trim() !== ''));
  $effect(() => api.setChecker(check));

  // Поле ввода: фокус сразу (только с физической клавиатурой — на телефоне не выпрыгивает клавиатура).
  $effect(() => {
    if (input && mode === 'type' && matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
  });
</script>

<div class="listen">
  {#if hasAudio}
    <div class="stage">
      <div class="buttons">
        <span data-testid="listen-play"
          ><AudioButton audio={it.audio} size="lg" autoplay={prefs.value.sound} label="Прослушать ещё раз" /></span
        >
        <AudioButton audio={it.audio} size="md" rate={0.75} label="Прослушать медленно" />
      </div>
      <p class="hint">
        {mode === 'type' ? 'Напишите, что услышали' : 'Что прозвучало?'}
        {#if it.audio_synth}<span class="synth" title="Голос синтезирован, не записан носителем">· синтез речи</span>{/if}
      </p>
      {#if locked}
        <p class="reveal rise"><span class="udm" lang="udm">{udm}</span> — {ru}</p>
      {/if}
    </div>
  {:else}
    <p class="noaudio" role="note"><span aria-hidden="true">🔇</span> Аудио к этому слову пока не записано — прочитайте и выберите перевод.</p>
    <PromptBubble avatar="🥟" big>
      <span class="udm" lang="udm">{udm}</span>
    </PromptBubble>
  {/if}

  {#if mode === 'choice'}
    <OptionList
      {options}
      {selected}
      correctId={it.id}
      {locked}
      onselect={(id) => (picked = { seed, id })}
      label={hasAudio ? 'Что прозвучало' : 'Варианты перевода'}
    />
  {:else}
    <div class="type">
      <label class="visually-hidden" for="{uid}-input">Услышанное слово по-удмуртски</label>
      <input
        bind:this={input}
        id="{uid}-input"
        class="field udm"
        class:ok={locked && shown === 'ok'}
        class:almost={locked && shown === 'almost'}
        class:bad={locked && shown === 'bad'}
        lang="udm"
        type="text"
        inputmode="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="Пишите по-удмуртски"
        readonly={locked}
        {value}
        oninput={(e) => (typed = { seed, v: e.currentTarget.value })}
        data-testid="listen-input"
        data-answer={E2E ? udm : undefined}
      />
      {#if !locked}<UdmKeyboard target={input} />{/if}
    </div>
  {/if}
</div>

<style>
  .listen {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
  }
  .stage {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 24px 16px 18px;
    border: 2px solid var(--line);
    border-radius: var(--radius-l);
    background: var(--surface);
  }
  .buttons {
    display: flex;
    align-items: center;
    gap: 18px;
    padding-left: 66px; /* визуально центрируем большую кнопку: справа от неё маленькая */
  }
  .hint {
    margin: 6px 0 0;
    font-weight: 600;
    color: var(--muted);
    text-align: center;
  }
  .synth {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .reveal {
    margin: 0;
    font-size: 1.1rem;
    text-align: center;
  }
  .noaudio {
    margin: 0;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: var(--surface-2);
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .type {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .field {
    width: 100%;
    min-height: 56px;
    padding: 12px 16px;
    border: 2px solid var(--field-border);
    border-radius: var(--radius);
    background: var(--surface);
    color: var(--ink);
    font-size: 1.2rem;
    outline: none;
  }
  .field::placeholder {
    color: var(--muted);
    opacity: 0.8;
    font-family: var(--font-text);
    font-weight: 400;
  }
  .field:focus-visible,
  .field:focus {
    border-color: var(--focus);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 25%, transparent);
  }
  .field.ok {
    border-color: var(--green);
    background: var(--green-soft);
  }
  .field.almost {
    border-color: var(--amber);
    background: var(--amber-soft);
  }
  .field.bad {
    border-color: var(--red);
    background: var(--red-soft);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .stage {
      animation: rise var(--dur-slow) var(--ease-enter) both;
    }
    :global(html:not([data-motion='reduce'])) .field.bad {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .field.ok,
    :global(html:not([data-motion='reduce'])) .field.almost {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
  }
</style>
