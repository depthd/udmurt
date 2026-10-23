<script lang="ts">
  /**
   * Главная (#/).
   *  • Новичок (xp = 0): маскот, «Удмурт кыл», три коротких преимущества и одна большая кнопка —
   *    первый урок сразу, без регистрации (PLAN §1, принцип 1).
   *  • Вернувшийся: приветствие по имени, «Продолжить», серия дней, цель дня, повторение, слово дня.
   */
  import Mascot from '../components/Mascot.svelte';
  import StreakCard from '../components/path/StreakCard.svelte';
  import DailyGoalRing from '../components/path/DailyGoalRing.svelte';
  import WordOfDay from '../components/path/WordOfDay.svelte';
  import { allLessons, currentLesson, personalize } from '$lib/course';
  import { progress } from '$lib/progress.svelte';
  import { router, href } from '$lib/router.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { lessonIcon, plural, splitTitle } from '../components/path/geometry';

  const isNew = $derived(progress.data.xp === 0);
  const name = $derived(progress.data.name.trim());
  const cur = $derived(currentLesson());
  const allDone = $derived(allLessons.every((l) => progress.isDone(l.lesson.id)));
  const due = $derived(progress.dueCards().length);
  const streak = $derived(progress.streakState);
  const xpToday = $derived(progress.xpToday);
  const goal = $derived(progress.data.dailyGoal);
  const title = $derived(cur ? splitTitle(cur.lesson.title) : { prefix: '', udm: '' });
  const unitLessons = $derived(cur ? allLessons.filter((l) => l.unitIndex === cur.unitIndex).length : 0);

  const sub = $derived(
    streak.doneToday
      ? xpToday >= goal
        ? 'Цель дня выполнена. Ещё урок — и слова запомнятся крепче.'
        : 'Серия продлена. До цели дня совсем немного.'
      : 'Пять минут — и серия дней продлена.',
  );

  function go(path: string, type: 'forward' | 'lesson' = 'forward') {
    sfx.tap();
    haptic.tap();
    router.go(path, type);
  }

  const perks = [
    { icon: '⏱️', title: '5 минут в день', text: 'Короткие уроки с телефона: выбрать, собрать фразу, напечатать.' },
    { icon: '🧵', title: 'Проверенный язык', text: 'У каждой фразы есть источник — словари, учебники, Tatoeba.' },
    { icon: '🌱', title: 'Без регистрации и штрафов', text: 'Ошибки не наказываются, прогресс хранится у вас в браузере.' },
  ];
</script>

{#if isNew}
  <section class="page welcome" aria-labelledby="welcome-title">
    <div class="hero">
      <div class="mascot rise">
        <Mascot mood="wave" size={160} />
        <p class="bubble" aria-hidden="true"><span lang="udm" class="udm">Ӟечбуресь!</span></p>
      </div>
      <h1 id="welcome-title" class="brand rise" lang="udm">Удмурт кыл</h1>
      <p class="lead rise">Учим удмуртский по 5 минут в день</p>
    </div>

    <ul class="perks">
      {#each perks as p, i (p.title)}
        <li class="perk rise" style:animation-delay="{120 + i * 70}ms">
          <span class="perk-icon" aria-hidden="true">{p.icon}</span>
          <span class="perk-text"><b>{p.title}</b><span>{p.text}</span></span>
        </li>
      {/each}
    </ul>

    <div class="cta rise" style:animation-delay="340ms">
      <button
        type="button"
        class="btn btn--block big"
        data-testid="start-first"
        onclick={() => go('/lesson/' + allLessons[0].lesson.id, 'lesson')}
      >
        Начать первый урок
      </button>
      <a class="btn btn--flat btn--block" href={href('/about')}>Сначала узнать о языке</a>
      <p class="fine muted">Первое слово — через 10 секунд. Имя спросим потом.</p>
    </div>
  </section>
{:else}
  <section class="page home" aria-labelledby="home-title">
    <header class="greet rise">
      <Mascot mood={streak.doneToday ? 'happy' : 'wave'} size={68} />
      <div class="greet-text">
        <h1 id="home-title"><span lang="udm" class="udm">Ӟечбуресь</span>{name ? ', ' : ''}{name}!</h1>
        <p class="muted">{sub}</p>
      </div>
    </header>

    {#if cur}
      <article class="card continue rise" aria-labelledby="cont-title">
        <div class="cont-head">
          <span class="cont-icon" aria-hidden="true">{allDone ? '🏅' : lessonIcon(cur.lesson.icon, cur.lesson.kind)}</span>
          <div class="cont-text">
            <p class="eyebrow">
              {#if allDone}
                Все уроки пройдены
              {:else}
                Юнит {cur.unitIndex + 1} · {cur.lesson.kind === 'story' ? 'история' : `урок ${cur.lessonIndex + 1} из ${unitLessons}`}
              {/if}
            </p>
            <h2 id="cont-title" class="cont-title">
              {#if allDone}
                Молодец! Новые уроки — скоро
              {:else}
                {#if title.prefix}<span class="prefix">{title.prefix}</span>{/if}<span lang="udm" class="udm">{title.udm}</span>
              {/if}
            </h2>
            <p class="muted cont-goal">
              {allDone ? 'А пока повторяйте слова — так они не забудутся.' : personalize(cur.lesson.goal)}
            </p>
          </div>
        </div>
        {#if allDone}
          <button type="button" class="btn btn--block" data-testid="continue" onclick={() => go('/practice', 'lesson')}>
            Повторить слова
          </button>
        {:else}
          <button
            type="button"
            class="btn btn--block cont-btn"
            data-testid="continue"
            onclick={() => go('/lesson/' + cur.lesson.id, 'lesson')}
          >
            <span>Продолжить:</span>
            <span>{title.prefix}<span lang="udm">{title.udm}</span></span>
          </button>
        {/if}
        <a class="to-path" href={href('/learn')}>Весь путь →</a>
      </article>
    {/if}

    <div class="rise" style:animation-delay="80ms">
      <StreakCard />
    </div>

    <div class="pair rise" style:animation-delay="140ms" class:single={due === 0}>
      <article class="card goal" aria-labelledby="goal-title">
        <DailyGoalRing value={xpToday} {goal} size={88} />
        <div class="goal-text">
          <h2 id="goal-title" class="small-title">Цель дня</h2>
          <p class="muted">
            {#if xpToday >= goal}
              Выполнена! +{xpToday} XP сегодня
            {:else}
              Ещё {goal - xpToday} XP — это 1–2 урока
            {/if}
          </p>
          <a class="small-link" href={href('/me')}>Изменить цель</a>
        </div>
      </article>

      {#if due > 0}
        <a class="card review" href={href('/practice')} data-testid="review-tile">
          <span class="review-icon" aria-hidden="true">🔁</span>
          <span class="review-text">
            <b>Повторить {due} {plural(due, ['слово', 'слова', 'слов'])}</b>
            <span class="muted">Пора, пока не забылись</span>
          </span>
        </a>
      {/if}
    </div>

    <div class="rise" style:animation-delay="200ms">
      <WordOfDay />
    </div>

    <a class="card about" href={href('/about')}>
      <span class="about-icon" aria-hidden="true">🗺️</span>
      <span class="about-text">
        <b>О языке</b>
        <span class="muted">История, алфавит, родственные языки</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/read')} data-testid="read-tile">
      <span class="about-icon" aria-hidden="true">📖</span>
      <span class="about-text">
        <b>Читалка</b>
        <span class="muted">Короткие тексты: нажмите на слово — увидите значение</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/phrases')} data-testid="phrases-tile">
      <span class="about-icon" aria-hidden="true">💬</span>
      <span class="about-text">
        <b>Разговорник и шпаргалки</b>
        <span class="muted">Все фразы курса с озвучкой — повторить перед парой</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/game')} data-testid="game-tile">
      <span class="about-icon" aria-hidden="true">🟩</span>
      <span class="about-text">
        <b>Игра «5 букв»</b>
        <span class="muted">Угадайте удмуртское слово дня за 6 попыток</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/help')} data-testid="help-tile">
      <span class="about-icon" aria-hidden="true">🎙️</span>
      <span class="about-text">
        <b>Говорите по-удмуртски?</b>
        <span class="muted">Помогите проверить фразы и запишите их голосом</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/group')} data-testid="group-tile">
      <span class="about-icon" aria-hidden="true">👥</span>
      <span class="about-text">
        <b>Группа</b>
        <span class="muted">Лига недели, общая цель и режим проектора для пары</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
  </section>
{/if}

<style>
  /* ── Приветствие для новичка ── */
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    max-width: 480px;
    padding-top: 28px;
  }
  .hero {
    text-align: center;
  }
  .mascot {
    position: relative;
    display: inline-block;
    margin: 0 auto 8px;
  }
  .bubble {
    position: absolute;
    top: 6px;
    left: calc(100% - 22px);
    max-width: calc(50vw - 24px);
    margin: 0;
    padding: 8px 12px;
    border-radius: 16px 16px 16px 4px;
    background: var(--surface);
    border: 2px solid var(--line);
    box-shadow: 0 3px 0 var(--line);
    font-size: 1rem;
    color: var(--red);
    white-space: nowrap;
  }
  @media (max-width: 380px) {
    .bubble {
      left: auto;
      right: -12px;
      top: -18px;
    }
  }
  .brand {
    margin: 0 0 6px;
    font-size: clamp(2.2rem, 1.6rem + 3vw, 3rem);
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .lead {
    margin: 0 auto 22px;
    max-width: 22ch;
    font-size: 1.2rem;
    line-height: 1.35;
    color: var(--muted);
  }
  .perks {
    list-style: none;
    margin: 0 0 24px;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .perk {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 14px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 2px solid var(--line);
  }
  .perk-icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: var(--red-soft);
    font-size: 22px;
  }
  .perk-text {
    display: grid;
    gap: 2px;
    line-height: 1.3;
  }
  .perk-text b {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .perk-text span {
    font-size: 0.92rem;
    color: var(--muted);
  }
  .cta {
    display: grid;
    gap: 6px;
  }
  .big {
    min-height: 58px;
    font-size: 1.05rem;
  }
  .fine {
    margin: 4px 0 0;
    text-align: center;
    font-size: 0.88rem;
  }

  /* ── Главная для вернувшегося ── */
  .home {
    display: grid;
    gap: 14px;
    max-width: 560px;
  }
  .greet {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .greet-text {
    min-width: 0;
  }
  .greet h1 {
    margin: 0 0 2px;
    font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
    overflow-wrap: anywhere;
  }
  .greet h1 .udm {
    font-weight: 700;
    color: var(--red);
  }
  .greet p {
    margin: 0;
    line-height: 1.35;
  }
  .continue {
    display: grid;
    gap: 14px;
    padding: 16px;
    border-color: color-mix(in srgb, var(--red) 30%, var(--line));
    box-shadow: 0 4px 0 color-mix(in srgb, var(--red) 22%, var(--line));
  }
  .cont-head {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .cont-icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--red);
    box-shadow: 0 4px 0 var(--red-edge);
    font-size: 28px;
  }
  .cont-text {
    min-width: 0;
  }
  .eyebrow {
    margin: 0 0 2px;
    font: 700 0.74rem/1.2 var(--font-head);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--red);
  }
  .cont-title {
    margin: 0 0 2px;
    font-size: 1.3rem;
    overflow-wrap: anywhere;
  }
  .cont-title .udm {
    font-weight: 700;
  }
  .prefix {
    font-weight: 500;
    color: var(--muted);
  }
  .cont-goal {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.35;
  }
  .cont-btn {
    flex-wrap: wrap;
    gap: 6px;
    line-height: 1.2;
    text-align: center;
  }
  .to-path {
    justify-self: center;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin: -8px 0 -6px;
    padding: 0 12px;
    font-weight: 700;
    text-decoration: none;
  }
  .to-path:hover {
    text-decoration: underline;
  }
  .pair {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }
  @media (min-width: 520px) {
    .pair:not(.single) {
      grid-template-columns: 1.25fr 1fr;
    }
  }
  .goal {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .goal-text {
    min-width: 0;
  }
  .small-title {
    margin: 0 0 2px;
    font-size: 1.1rem;
  }
  .goal-text p {
    margin: 0 0 2px;
    font-size: 0.92rem;
    line-height: 1.35;
  }
  .small-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    font-size: 0.9rem;
    font-weight: 700;
    text-decoration: none;
  }
  .review,
  .about {
    display: flex;
    align-items: center;
    gap: 14px;
    color: var(--ink);
    text-decoration: none;
    box-shadow: 0 4px 0 var(--line);
    -webkit-tap-highlight-color: transparent;
  }
  .review {
    border-color: color-mix(in srgb, var(--blue) 35%, var(--line));
    box-shadow: 0 4px 0 color-mix(in srgb, var(--blue) 30%, var(--line));
  }
  .review:active,
  .about:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--line);
  }
  .review-icon,
  .about-icon {
    flex: none;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: var(--blue-soft);
    font-size: 24px;
  }
  .about-icon {
    background: var(--surface-2);
  }
  .review-text,
  .about-text {
    flex: 1;
    min-width: 0;
    display: grid;
    gap: 2px;
    line-height: 1.3;
  }
  .review-text b,
  .about-text b {
    font-family: var(--font-head);
    font-weight: 600;
    font-size: 1.05rem;
  }
  .review-text .muted,
  .about-text .muted {
    font-size: 0.9rem;
  }
  .chev {
    color: var(--muted);
    font-weight: 700;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .review,
    :global(html:not([data-motion='reduce'])) .about {
      transition:
        transform 400ms var(--ease-release),
        box-shadow 400ms var(--ease-release),
        border-color 150ms;
    }
    :global(html:not([data-motion='reduce'])) .review:active,
    :global(html:not([data-motion='reduce'])) .about:active {
      transition-duration: 34ms;
    }
    :global(html:not([data-motion='reduce'])) .bubble {
      animation: bubble-in var(--spring-pop-dur) var(--spring-pop) 500ms both;
      transform-origin: 0 100%;
    }
  }
  @keyframes bubble-in {
    from {
      opacity: 0;
      transform: scale(0.6);
    }
  }
</style>
