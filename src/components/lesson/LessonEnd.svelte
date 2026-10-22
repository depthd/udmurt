<script lang="ts">
  /**
   * Экран итогов урока (отчёт 04 §3.5): конфетти-толэзе и звук → «+N XP» (счётчик) →
   * точность и время «лесенкой» → серия дней → новые достижения → «Продолжить».
   * Для повторения (mode='practice') Reward может не быть — тогда упрощённые итоги.
   */
  import { untrack } from 'svelte';
  import Mascot from '../Mascot.svelte';
  import { ACHIEVEMENTS, type LessonResult, type Reward } from '$lib/progress.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { celebrate } from '$lib/celebrate';
  import { formatTime, hasUdmLetters, plural } from '$lib/lesson';

  let {
    result,
    reward,
    title,
    mode = 'lesson',
    onexit,
  }: {
    result: LessonResult;
    reward?: Reward;
    title: string;
    mode?: 'lesson' | 'practice';
    onexit: () => void;
  } = $props();

  const accuracy = $derived(result.total ? Math.round((result.correct / result.total) * 100) : 100);
  const words = $derived(Object.keys(result.grades).length);
  const achievements = $derived(
    (reward?.newAchievements ?? []).map((id) => ({ id, ...(ACHIEVEMENTS[id] ?? { title: id, text: '', icon: '🏅' }) })),
  );
  const heading = $derived(mode === 'practice' ? 'Повторение окончено!' : 'Урок пройден!');
  const praise = $derived(
    accuracy === 100 ? 'Без единой ошибки!' : accuracy >= 80 ? 'Отличная работа!' : accuracy >= 50 ? 'Хорошая работа!' : 'Главное — не останавливаться!',
  );

  // Счётчики «набегают» (с учётом «меньше анимации»)
  let xpShown = $state(0);
  let accShown = $state(0);
  let streakShown = $state(0);
  let streakBump = $state(false);
  let finishBtn = $state<HTMLButtonElement>();

  function countUp(to: number, set: (v: number) => void, delay: number, ms = 800) {
    if (prefs.reduceMotion || to <= 0) {
      set(to);
      return () => {};
    }
    let raf = 0;
    const timer = window.setTimeout(() => {
      const t0 = performance.now();
      const ease = (t: number) => 1 - (1 - t) ** 3;
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / ms);
        set(Math.round(to * ease(t)));
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }

  $effect(() => {
    return untrack(() => {
      celebrate(accuracy === 100 ? 2 : 1);
      sfx.complete();
      haptic.combo();
      finishBtn?.focus({ preventScroll: true });

      const stops = [countUp(reward?.xp ?? 0, (v) => (xpShown = v), 250), countUp(accuracy, (v) => (accShown = v), 330)];

      const after = reward?.streakAfter ?? 0;
      const before = reward?.streakBefore ?? after;
      const timers: number[] = [];
      if (reward?.streakExtended && !prefs.reduceMotion && after !== before) {
        streakShown = before;
        timers.push(
          window.setTimeout(() => {
            streakShown = after;
            streakBump = true;
            sfx.unlock();
          }, 900),
        );
      } else streakShown = after;

      if ((reward?.newAchievements.length ?? 0) > 0) timers.push(window.setTimeout(() => sfx.unlock(), 1300));

      return () => {
        stops.forEach((s) => s());
        timers.forEach((t) => window.clearTimeout(t));
      };
    });
  });
</script>

<section class="end" aria-labelledby="end-title" data-testid="lesson-end">
  <div class="body">
    <div class="hero">
      <Mascot mood="celebrate" size={136} label="Юсь радуется вместе с вами" />
    </div>
    <h1 id="end-title">{heading}</h1>
    <p class="sub">
      <span lang={hasUdmLetters(title) ? 'udm' : undefined} class:udm={hasUdmLetters(title)}>{title}</span>
      <span aria-hidden="true">·</span>
      {praise}
    </p>

    <ul class="stats" aria-label="Итоги">
      {#if reward}
        <li class="stat stat--xp">
          <span class="lab">Опыт</span>
          <span class="val"><span aria-hidden="true">⚡</span> +{xpShown}<span class="visually-hidden"> XP</span></span>
        </li>
      {:else}
        <li class="stat stat--xp">
          <span class="lab">Слов</span>
          <span class="val"><span aria-hidden="true">📚</span> {words}</span>
        </li>
      {/if}
      <li class="stat stat--acc">
        <span class="lab">Точность</span>
        <span class="val"><span aria-hidden="true">🎯</span> {accShown}%</span>
      </li>
      <li class="stat stat--time">
        <span class="lab">Время</span>
        <span class="val"><span aria-hidden="true">⏱</span> {formatTime(result.ms)}</span>
      </li>
    </ul>

    {#if reward}
      <div class="extras">
        {#if reward.streakAfter > 0}
          <p class="streak" class:bump={streakBump}>
            <span class="flame" aria-hidden="true">🔥</span>
            {#key streakShown}<b class="num">{streakShown}</b>{/key}
            {plural(reward.streakAfter, ['день', 'дня', 'дней'])} подряд
            {#if reward.streakExtended && reward.streakBefore === 0 && reward.streakAfter === 1}
              <span class="hint">— серия началась!</span>
            {/if}
          </p>
        {/if}
        {#if reward.usedFreeze > 0}
          <p class="freeze">
            <span aria-hidden="true">❄️</span>
            {reward.usedFreeze === 1
              ? 'Заморозка сохранила вашу серию за пропущенный день'
              : `Заморозки сохранили серию: пропущено ${reward.usedFreeze} ${plural(reward.usedFreeze, ['день', 'дня', 'дней'])}`}
          </p>
        {/if}
        {#if reward.goalReached}
          <p class="goal"><span aria-hidden="true">✅</span> Дневная цель выполнена</p>
        {/if}
      </div>
    {/if}

    {#if achievements.length}
      <div class="achs">
        <h2 class="achs-title">{achievements.length === 1 ? 'Новое достижение' : 'Новые достижения'}</h2>
        <ul>
          {#each achievements as a, i (a.id)}
            <li class="ach" style:--i={i}>
              <span class="ach-icon" aria-hidden="true">{a.icon}</span>
              <span class="ach-text"><b>{a.title}</b><span class="muted">{a.text}</span></span>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>

  <footer class="foot">
    <button bind:this={finishBtn} class="btn btn--block" type="button" data-testid="finish" onclick={onexit}>Продолжить</button>
  </footer>
</section>

<style>
  .end {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    max-width: var(--page-max);
    margin: 0 auto;
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 32px var(--gutter) 24px;
  }
  .hero {
    margin-bottom: 8px;
  }
  h1 {
    margin: 0 0 4px;
    color: var(--ink);
  }
  .sub {
    color: var(--muted);
    margin: 0 0 22px;
    font-weight: 600;
  }
  .sub .udm {
    color: var(--ink);
  }
  .stats {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    max-width: 440px;
    font-variant-numeric: tabular-nums;
  }
  .stat {
    --c: var(--amber);
    border: 2px solid var(--c);
    border-radius: var(--radius);
    background: var(--c);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .stat--acc {
    --c: var(--green);
  }
  .stat--time {
    --c: var(--blue);
  }
  .lab {
    padding: 4px 6px 3px;
    font: 800 0.7rem/1.3 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--on-fill);
  }
  .val {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: var(--surface);
    border-radius: calc(var(--radius) - 4px);
    padding: 12px 4px;
    font: 700 1.25rem/1 var(--font-head);
    color: var(--c);
    white-space: nowrap;
  }
  .extras {
    margin-top: 20px;
    display: grid;
    gap: 6px;
    justify-items: center;
  }
  .extras p {
    margin: 0;
  }
  .streak {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font: 700 1.05rem/1.2 var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .num {
    display: inline-block;
    min-width: 1ch;
  }
  .hint {
    font-weight: 500;
    color: var(--ink);
  }
  .freeze,
  .goal {
    font-weight: 600;
    color: var(--muted);
  }
  .achs {
    margin-top: 22px;
    width: 100%;
    max-width: 440px;
  }
  .achs-title {
    font-size: 0.85rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 8px;
  }
  .achs ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .ach {
    display: flex;
    align-items: center;
    gap: 12px;
    text-align: left;
    padding: 10px 14px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    box-shadow: 0 3px 0 var(--line);
  }
  .ach-icon {
    font-size: 1.6rem;
    line-height: 1;
  }
  .ach-text {
    display: grid;
    line-height: 1.3;
  }
  .ach-text .muted {
    font-size: 0.9rem;
  }
  .foot {
    position: sticky;
    bottom: 0;
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
    background: var(--bg);
    border-top: 2px solid var(--line);
  }
  @media (min-width: 640px) {
    .foot {
      display: flex;
      justify-content: flex-end;
    }
    .foot .btn {
      width: auto;
      min-width: 220px;
    }
  }
  @media (max-width: 360px) {
    .val {
      font-size: 1.05rem;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .hero {
      animation: end-pop var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) h1,
    :global(html:not([data-motion='reduce'])) .sub {
      animation: rise var(--dur-slow) var(--ease-enter) 120ms both;
    }
    :global(html:not([data-motion='reduce'])) .stat {
      animation: rise var(--dur-slow) var(--ease-enter) 220ms both;
    }
    :global(html:not([data-motion='reduce'])) .stat:nth-child(2) {
      animation-delay: 300ms;
    }
    :global(html:not([data-motion='reduce'])) .stat:nth-child(3) {
      animation-delay: 380ms;
    }
    :global(html:not([data-motion='reduce'])) .extras {
      animation: rise var(--dur-slow) var(--ease-enter) 620ms both;
    }
    :global(html:not([data-motion='reduce'])) .streak.bump .flame {
      animation: flame var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .streak.bump .num {
      animation: num-in var(--spring-pop-dur) var(--spring-pop) both;
    }
    :global(html:not([data-motion='reduce'])) .achs {
      animation: rise var(--dur-slow) var(--ease-enter) 900ms both;
    }
    :global(html:not([data-motion='reduce'])) .ach {
      animation: end-pop var(--spring-pop-dur) var(--spring-pop) both;
      animation-delay: calc(1100ms + var(--i) * 160ms);
    }
    :global(html:not([data-motion='reduce'])) .foot {
      animation: fade-in var(--dur-base) var(--ease-standard) 500ms both;
    }
  }
  @keyframes end-pop {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
  }
  @keyframes flame {
    0% {
      transform: scale(1);
    }
    40% {
      transform: scale(1.6) rotate(-8deg);
    }
    100% {
      transform: scale(1);
    }
  }
  @keyframes num-in {
    from {
      opacity: 0;
      transform: translateY(60%);
    }
  }
</style>
