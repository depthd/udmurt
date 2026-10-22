<script lang="ts">
  /**
   * Страница урока: #/lesson/<id>. Урок не найден или ещё закрыт — дружелюбный экран со ссылкой на путь.
   * После первого урока (если имя не задано) — знакомство: имя и «обещание».
   */
  import LessonRunner from '../components/lesson/LessonRunner.svelte';
  import Onboarding from '../components/lesson/Onboarding.svelte';
  import Mascot from '../components/Mascot.svelte';
  import { allLessons, currentLesson, findLesson, isUnlocked, personalize } from '$lib/course';
  import { progress, type LessonResult, type Reward } from '$lib/progress.svelte';
  import { router, href } from '$lib/router.svelte';
  import { hasUdmLetters } from '$lib/lesson';

  let { id }: { id: string } = $props();

  const ref = $derived(findLesson(id));
  // Доступность фиксируем на входе: после прохождения урок не должен «закрыться» на экране итогов.
  const lookup = () => {
    const r = findLesson(id);
    return r ? isUnlocked(r) : false;
  };
  const unlocked = lookup();
  const prev = $derived(ref && ref.flatIndex > 0 ? allLessons[ref.flatIndex - 1] : undefined);
  const next = $derived(currentLesson());

  let stage = $state<'run' | 'onboarding'>('run');
  let needOnboarding = false;

  function finish(r: LessonResult): Reward {
    const reward = progress.completeLesson(r);
    const done = Object.values(progress.data.lessons).filter((l) => l.done > 0).length;
    needOnboarding = reward.firstTime && done === 1 && !progress.data.name.trim() && !progress.data.onboarded;
    return reward;
  }

  function exit() {
    if (needOnboarding) {
      needOnboarding = false;
      stage = 'onboarding';
      window.scrollTo({ top: 0 });
      return;
    }
    router.go('/learn', 'back');
  }
</script>

<svelte:head>
  <title>{ref ? `${personalize(ref.lesson.title)} — Удмурт кыл` : 'Урок — Удмурт кыл'}</title>
</svelte:head>

{#if !ref}
  <section class="page gate" data-testid="lesson-missing">
    <Mascot mood="think" size={120} />
    <h1>Такого урока нет</h1>
    <p class="muted">Возможно, ссылка устарела или урок переименовали. Все уроки — на пути.</p>
    <a class="btn btn--ink" href={href('/learn')}>К урокам</a>
  </section>
{:else if !unlocked}
  <section class="page gate" data-testid="lesson-locked">
    <Mascot mood="think" size={120} />
    <h1>Этот урок пока закрыт</h1>
    <p class="muted">
      Уроки открываются по порядку.
      {#if prev}
        Сначала пройдите «<span lang={hasUdmLetters(prev.lesson.title) ? 'udm' : undefined}>{personalize(prev.lesson.title)}</span>».
      {/if}
    </p>
    <div class="actions">
      {#if next && next.lesson.id !== id}
        <a class="btn" href={href(`/lesson/${next.lesson.id}`)}>Продолжить с текущего</a>
      {/if}
      <a class="btn btn--ghost" href={href('/learn')}>К урокам</a>
    </div>
  </section>
{:else if stage === 'onboarding'}
  <Onboarding ondone={() => router.go('/learn', 'forward')} />
{:else}
  <LessonRunner
    runId={ref.lesson.id}
    title={personalize(ref.lesson.title)}
    exercises={ref.lesson.exercises}
    mode="lesson"
    onfinish={finish}
    onexit={exit}
  />
{/if}

<style>
  .gate {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding-bottom: 40px;
  }
  .gate h1 {
    margin-top: 12px;
  }
  .gate p {
    max-width: 36ch;
  }
  .actions {
    display: grid;
    gap: 10px;
    width: 100%;
    max-width: 320px;
  }
</style>
