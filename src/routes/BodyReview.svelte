<script lang="ts">
  import { findLesson, item } from '$lib/course';
  import { classLessonPath } from '$lib/classroom';
  import { href } from '$lib/router.svelte';
  import { seededShuffle } from '../exercises/types';

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

<section class="page review">
  <h1>Части тела. Повторение</h1>
  <p>Назовите слово по-удмуртски, затем откройте ответ.</p>
  {#if word}
    <article class="card prompt" aria-live="polite">
      <p class="muted">Слово {position + 1} из {deck.length}</p>
      <h2>{word.ru}</h2>
      {#if revealed}<p class="answer" lang="udm">{word.udm}</p>{/if}
      {#if revealed}
        <button class="btn" onclick={next}>{position + 1 === deck.length ? 'Завершить повторение' : 'Следующее слово'}</button>
      {:else}
        <button class="btn" onclick={() => revealed = true}>Показать ответ</button>
      {/if}
    </article>
  {:else}
    <article class="card prompt" aria-live="polite">
      <h2>Повторили все {deck.length} слов</h2>
      <button class="btn btn--ghost" onclick={restart}>Повторить ещё раз</button>
    </article>
  {/if}
  <nav aria-label="Продолжение занятия">
    <a class="btn btn--ink" href={href(classLessonPath('u2-dates'))}>Перейти к числительным</a>
    <a class="btn btn--flat" href={href('/lesson/u10-body')}>Урок «Части тела»</a>
  </nav>
</section>
<style>
  .review { max-width: 680px; }
  .prompt { padding: 24px; margin: 20px 0; text-align: center; }
  .prompt h2 { font-size: clamp(1.6rem, 5vw, 2.5rem); margin: 12px 0 20px; }
  .answer { font: 650 1.65rem var(--font-head); margin: 12px 0 20px; }
  nav { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
