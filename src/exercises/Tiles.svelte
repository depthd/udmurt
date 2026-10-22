<script lang="ts">
  /**
   * Tiles — собрать перевод из плиток-слов (визитная карточка Duolingo).
   *   dir ru-udm: дана русская фраза, собираем удмуртскую; udm-ru — наоборот.
   * Плитки = слова ответа + extra, перемешаны по зерну. Проверка — checkAnswer по всем
   * допустимым вариантам (регистр и пунктуация не важны).
   * Оценка SRS: точно — 3, «почти» — 2, неверно — 1.
   */
  import type { Exercise } from '$lib/content/schema';
  import type { AnswerResult, ExerciseProps } from './types';
  import { accepted, item, personalize } from '$lib/course';
  import { checkAnswer } from '$lib/answer';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import PieceBoard from '../components/exercise2/PieceBoard.svelte';
  import { almostNote, assemble, tilePieces, tilesGrade } from '../components/exercise2/logic';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'tiles' }>> = $props();

  const it = $derived(item(ex.item));
  const toUdm = $derived(ex.dir !== 'udm-ru');
  const ansLang = $derived<'udm' | 'ru'>(toUdm ? 'udm' : 'ru');
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  const prompt = $derived(toUdm ? ru : udm);
  const answer = $derived(toUdm ? udm : ru);
  const pieces = $derived(
    tilePieces(
      answer,
      ex.extra.map((x) => personalize(x)),
      `${ex.id ?? ''}|tiles|${ex.item}|${ex.dir}`,
    ),
  );

  let chosen = $state<number[]>([]);
  let verdict = $state<'correct' | 'almost' | 'wrong' | null>(null);

  function check(): AnswerResult {
    const v = checkAnswer(assemble(pieces, chosen), accepted(it, ansLang));
    const meaning = `${udm} — ${ru}`;
    verdict = v.ok ? (v.exact ? 'correct' : 'almost') : 'wrong';
    return {
      correct: v.ok,
      almost: v.ok && !v.exact ? true : undefined,
      note: almostNote(v),
      expected: v.ok ? v.matched : answer,
      meaning,
      grades: { [it.id]: tilesGrade(v) },
    };
  }

  $effect(() => api.setReady(chosen.length > 0));
  $effect(() => api.setChecker(check));
</script>

<div class="tiles">
  <PromptBubble audio={toUdm ? undefined : it.audio} synth={it.audio_synth} audioLabel="Прослушать фразу">
    <span lang={toUdm ? 'ru' : 'udm'} class:udm={!toUdm} data-testid="tiles-prompt">{prompt}</span>
  </PromptBubble>

  <PieceBoard
    {pieces}
    bind:chosen
    {locked}
    verdict={locked ? verdict : null}
    lang={ansLang}
    bankTestId={(i) => `bank-tile-${i}`}
    answerTestId={(i) => `answer-tile-${i}`}
    answerLabel={toUdm ? 'Ваш ответ по-удмуртски' : 'Ваш перевод'}
    bankLabel="Слова для ответа"
  />
</div>

<style>
  .tiles {
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }
</style>
