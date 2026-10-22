<script lang="ts">
  /**
   * Type — напечатать перевод. Мягкая проверка (src/lib/answer.ts): пропущенная удмуртская
   * буква или одна опечатка в длинном слове засчитываются как «почти».
   * Оценка SRS: точно быстрее 6 с — 4, точно — 3, «почти» — 2, неверно — 1.
   * Enter — «Проверить» (оболочка не трогает Enter в textarea, поэтому передаём его ей сами).
   */
  import type { Exercise } from '$lib/content/schema';
  import type { AnswerResult, ExerciseProps } from './types';
  import { accepted, item, personalize } from '$lib/course';
  import { checkAnswer } from '$lib/answer';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import UdmKeyboard from '../components/UdmKeyboard.svelte';
  import { E2E, almostNote, typeGrade } from '../components/exercise2/logic';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'type' }>> = $props();

  const it = $derived(item(ex.item));
  const toUdm = $derived(ex.dir !== 'udm-ru');
  const ansLang = $derived<'udm' | 'ru'>(toUdm ? 'udm' : 'ru');
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  const prompt = $derived(toUdm ? ru : udm);
  const answers = $derived(accepted(it, ansLang));

  let value = $state('');
  let verdict = $state<'ok' | 'almost' | 'bad' | null>(null);
  let field = $state<HTMLTextAreaElement | null>(null);
  let wrap = $state<HTMLElement>();
  const uid = $props.id();
  const started = performance.now();

  function check(): AnswerResult {
    const v = checkAnswer(value, answers);
    verdict = v.ok ? (v.exact ? 'ok' : 'almost') : 'bad';
    return {
      correct: v.ok,
      almost: v.ok && !v.exact ? true : undefined,
      note: almostNote(v),
      expected: v.ok ? v.matched : (answers[0] ?? ''),
      meaning: `${udm} — ${ru}`,
      grades: { [it.id]: typeGrade(v, performance.now() - started) },
    };
  }

  $effect(() => api.setReady(value.trim() !== ''));
  $effect(() => api.setChecker(check));

  $effect(() => {
    if (field && !locked) field.focus({ preventScroll: true });
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.shiftKey || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
    e.preventDefault();
    if (e.repeat) return;
    // перевыпускаем Enter с обёртки — оболочка урока поймает его как «Проверить/Продолжить»
    wrap?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true, cancelable: true }));
  }
</script>

<div class="type" bind:this={wrap}>
  <PromptBubble audio={toUdm ? undefined : it.audio} synth={it.audio_synth} audioLabel="Прослушать фразу">
    <span lang={toUdm ? 'ru' : 'udm'} class:udm={!toUdm} data-testid="type-prompt">{prompt}</span>
  </PromptBubble>

  <div class="field-wrap" class:ok={locked && verdict === 'ok'} class:almost={locked && verdict === 'almost'} class:bad={locked && verdict === 'bad'}>
    <label class="visually-hidden" for="{uid}-answer">{toUdm ? 'Перевод на удмуртский' : 'Перевод на русский'}</label>
    <textarea
      bind:this={field}
      bind:value
      id="{uid}-answer"
      class="field"
      class:udm={toUdm}
      lang={ansLang}
      rows="2"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="done"
      placeholder={toUdm ? 'Напишите по-удмуртски' : 'Напишите по-русски'}
      readonly={locked}
      {onkeydown}
      data-testid="answer-input"
      data-expected={E2E ? answers[0] : undefined}
    ></textarea>
    {#if locked && verdict}
      <span class="mark" aria-hidden="true">{verdict === 'ok' ? '✓' : verdict === 'almost' ? '≈' : '✗'}</span>
    {/if}
  </div>

  {#if toUdm}
    <div class="kb" class:hidden={locked}>
      <UdmKeyboard target={field} />
      <span class="kb-hint muted">Нет удмуртской раскладки? Нажимайте буквы здесь.</span>
    </div>
  {/if}
</div>

<style>
  .type {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }
  .field-wrap {
    --fc: var(--line);
    --fbg: var(--surface);
    position: relative;
  }
  .field {
    display: block;
    width: 100%;
    min-height: calc(2 * 1.4em + 32px);
    padding: 14px 18px;
    border: 2px solid var(--fc);
    border-radius: var(--radius);
    background: var(--fbg);
    box-shadow: inset 0 2px 0 color-mix(in srgb, var(--line) 50%, transparent);
    font: 500 1.25rem/1.4 var(--font-text);
    resize: none;
    field-sizing: content;
    max-height: 9em;
    color: var(--ink);
  }
  .field.udm {
    font-family: var(--font-head);
  }
  .field::placeholder {
    color: var(--muted);
    opacity: 0.8;
  }
  .field:focus {
    outline: none;
    border-color: var(--focus);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus) 22%, transparent);
  }
  .field:focus-visible {
    border-radius: var(--radius);
  }
  .field[readonly] {
    cursor: default;
  }
  .ok {
    --fc: var(--green);
    --fbg: var(--green-soft);
  }
  .almost {
    --fc: var(--amber);
    --fbg: var(--amber-soft);
  }
  .bad {
    --fc: var(--red);
    --fbg: var(--red-soft);
  }
  .ok .field,
  .almost .field,
  .bad .field {
    box-shadow: none;
  }
  .mark {
    position: absolute;
    top: 12px;
    right: 14px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--fc);
    color: var(--on-fill);
    font: 700 1rem/1 var(--font-head);
  }
  .ok .field,
  .almost .field,
  .bad .field {
    padding-right: 54px;
  }
  .kb {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .kb.hidden {
    visibility: hidden;
  }
  .kb-hint {
    font-size: 0.85rem;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .field {
      transition:
        border-color var(--dur-fast),
        background-color var(--dur-fast),
        box-shadow var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .bad {
      animation: shake 400ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .mark {
      animation: pop var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
</style>
