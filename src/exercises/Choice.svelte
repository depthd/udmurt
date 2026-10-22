<script lang="ts">
  /**
   * Choice — выбрать перевод из вариантов.
   *   dir udm-ru: дан удмуртский, выбираем русский; ru-udm — наоборот.
   *   pictures: варианты — карточки с крупным эмодзи и подписью.
   * Оценка SRS: верно — 3 («хорошо»), неверно — 1 («снова»).
   */
  import type { Exercise } from '$lib/content/schema';
  import type { ExerciseProps } from './types';
  import { item, personalize } from '$lib/course';
  import OptionList from '../components/exercise/OptionList.svelte';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import { buildOptions } from '../components/exercise/options';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'choice' }>> = $props();

  const it = $derived(item(ex.item));
  const toRu = $derived(ex.dir !== 'ru-udm');
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  const seed = $derived(`${ex.id ?? ''}|choice|${ex.item}|${ex.dir}`);
  const options = $derived(buildOptions(it, ex.distractors.map(item), toRu ? 'ru' : 'udm', seed, personalize));

  /** Выбор привязан к упражнению (seed): если оболочка переиспользует компонент, выбор сбросится сам. */
  let picked = $state<{ seed: string; id: string } | null>(null);
  const selected = $derived(picked?.seed === seed ? picked.id : null);

  function check() {
    const ok = selected === it.id;
    return {
      correct: ok,
      expected: toRu ? ru : udm,
      meaning: `${udm} — ${ru}`,
      grades: { [it.id]: ok ? 3 : 1 } as Record<string, 1 | 3>,
    };
  }

  $effect(() => api.setReady(selected !== null));
  $effect(() => api.setChecker(check));
</script>

<div class="choice">
  <PromptBubble big audio={toRu ? it.audio : undefined} synth={it.audio_synth} audioLabel="Прослушать «{udm}»">
    {#if toRu}
      <span class="udm" lang="udm">{udm}</span>
    {:else}
      <span>{ru}</span>
    {/if}
  </PromptBubble>

  <OptionList
    {options}
    {selected}
    correctId={it.id}
    {locked}
    pictures={ex.pictures}
    onselect={(id) => (picked = { seed, id })}
    label={toRu ? 'Варианты перевода на русский' : 'Варианты на удмуртском'}
  />
</div>

<style>
  .choice {
    display: flex;
    flex-direction: column;
    gap: 28px;
    width: 100%;
  }
</style>
