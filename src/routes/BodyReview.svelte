<script lang="ts">
  import { findLesson, item } from '$lib/course';
  import { classLessonPath } from '$lib/classroom';
  import { href, router } from '$lib/router.svelte';
  import { seededShuffle } from '../exercises/types';

  import LessonFrame from '../components/lesson/LessonFrame.svelte';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';

  const words = findLesson('u10-body')!.lesson.exercises.flatMap(ex =>
    ex.type === 'teach' ? [item(ex.item)] : []
  );
  let deck = $state.raw(seededShuffle(words, String(Date.now())));
  let position = $state(0);
  let revealed = $state(false);
  const word = $derived(deck[position]);
  function next() {
    revealed = false;
    position++;
  }
  function restart() {
    deck = seededShuffle(words, String(Date.now()));
    position = 0;
    revealed = false;
  }
</script>

<LessonFrame mode="practice" done={position} total={deck.length}
  exitLabel="Выйти из повторения" onexit={() => router.go('/class', 'back')}>
  <article aria-live="polite">
    {#if word}
      <p class="muted count">Слово {position + 1} из {deck.length}</p>
      <h1>Назовите часть тела по-удмуртски</h1>
      {#key position}
        <PromptBubble big>{#if word.emoji}<span aria-hidden="true">{word.emoji} </span>{/if}{word.ru}</PromptBubble>
      {/key}
      {#if revealed}<p class="card answer udm" lang="udm">{word.udm}</p>{/if}
    {:else}
      <h1>Повторили все {deck.length} слов</h1>
    {/if}
    <nav aria-label="Продолжение занятия">
      <a href={href(classLessonPath('u2-dates'))}>Перейти к числительным</a>
      <a href={href(classLessonPath('u10-body'))}>Урок «Части тела»</a>
    </nav>
  </article>
  {#snippet footer()}
    {#if !word}
      <button class="btn btn--ink go" onclick={restart}>Повторить ещё раз</button>
    {:else if revealed}
      <button class="btn btn--ink go" onclick={next}>{position + 1 === deck.length ? 'Завершить повторение' : 'Следующее слово'}</button>
    {:else}
      <button class="btn btn--ink go" onclick={() => revealed = true}>Показать ответ</button>
    {/if}
  {/snippet}
</LessonFrame>
<style>
  h1 { font-size: clamp(1.3rem, 1.1rem + 1vw, 1.6rem); margin: 0 0 16px; }
  .count { margin: 0 0 6px; }
  .answer { margin: 16px 0 0; text-align: center; font: 700 1.6rem var(--font-head); }
  nav { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 24px; }
  nav a { color: var(--muted); }
</style>
