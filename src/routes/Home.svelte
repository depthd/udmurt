<script lang="ts">
  /**
   * Главная (#/).
   *  • Новичок (xp = 0): персонажи, «Удмурт кыл», три коротких преимущества и одна большая кнопка —
   *    первый урок сразу, без регистрации (PLAN §1, принцип 1).
   *  • Вернувшийся: приветствие по имени, «Продолжить», серия дней, цель дня, повторение, слово дня.
   */
  import Cast from '../components/Cast.svelte';
  import Octagram from '../components/Octagram.svelte';
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
    { tone: 'amber', title: '5 минут', text: 'Короткие уроки с телефона: выбрать, собрать фразу, напечатать.' },
    { tone: 'blue', title: 'Проверено', text: 'У каждой фразы есть источник — словари, учебники, Tatoeba.' },
    { tone: 'green', title: 'Без аккаунта', text: 'Ошибки не наказываются, прогресс хранится у вас в браузере.' },
  ];
</script>

{#if isNew}
  <section class="page welcome" aria-labelledby="welcome-title">
    <div class="hero rise">
      <header class="hero-copy">
        <p class="bubble" aria-hidden="true"><span lang="udm" class="udm">Ӟечбуресь!</span></p>
        <h1 id="welcome-title" class="poster-title brand" lang="udm">Удмурт<br />кыл</h1>
        <div class="thread-rule" aria-hidden="true"></div>
        <p class="lead">Учим удмуртский по 5 минут в день</p>
      </header>
      <div class="hero-art"><Cast kind="pair" flush /></div>
      <div class="cta">
        <button
          type="button"
          class="btn btn--block big"
          data-testid="start-first"
          onclick={() => go('/lesson/' + allLessons[0].lesson.id, 'lesson')}
        >
          Начать первый урок <span aria-hidden="true">→</span>
        </button>
        <a class="btn btn--flat btn--block" href={href('/about')}>Сначала узнать о языке</a>
        <p class="fine muted">Первое слово — через 10 секунд. Имя спросим потом.</p>
      </div>
    </div>

    <ul class="perks">
      {#each perks as p (p.title)}
        <li class="perk" style:--perk-bg="var(--{p.tone}-soft)" style:--perk-accent="var(--{p.tone})">
          <b>{p.title}</b>
          <span>{p.text}</span>
          <div class="perk-star"><Octagram size={18} color="var(--perk-accent)" /></div>
        </li>
      {/each}
    </ul>
  </section>
{:else}
  <section class="page home" aria-labelledby="home-title">
    <header class="greet rise">
      <div class="greet-cast"><Cast kind="wave" width={108} flush /></div>
      <div class="greet-text">
        <h1 id="home-title" class="poster-title"><span lang="udm" class="udm">Ӟечбуресь</span>{name ? ', ' : ''}{name}!</h1>
        <p class="muted">{sub}</p>
      </div>
    </header>

    {#if cur}
      <article class="sticker continue rise" aria-labelledby="cont-title">
        <div class="continue-cast"><Cast kind="head" width={128} flush /></div>
        <div class="continue-body">
          <div class="cont-head">
            <span class="cont-icon" aria-hidden="true">
              {#if allDone}<Octagram size={28} color="var(--red)" />{:else}{lessonIcon(cur.lesson.icon, cur.lesson.kind)}{/if}
            </span>
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
        </div>
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

      <span class="about-text">
        <b>О языке</b>
        <span class="muted">История, алфавит, родственные языки</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/read')} data-testid="read-tile">

      <span class="about-text">
        <b>Читалка</b>
        <span class="muted">Короткие тексты: нажмите на слово — увидите значение</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/phrases')} data-testid="phrases-tile">

      <span class="about-text">
        <b>Разговорник и шпаргалки</b>
        <span class="muted">Все фразы курса с озвучкой — повторить перед парой</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/game')} data-testid="game-tile">

      <span class="about-text">
        <b>Игра «5 букв»</b>
        <span class="muted">Угадайте удмуртское слово дня за 6 попыток</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/help')} data-testid="help-tile">

      <span class="about-text">
        <b>Говорите по-удмуртски?</b>
        <span class="muted">Помогите проверить фразы и запишите их голосом</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
    <a class="card about" href={href('/group')} data-testid="group-tile">

      <span class="about-text">
        <b>Группа</b>
        <span class="muted">Лига недели, общая цель и режим проектора для пары</span>
      </span>
      <span class="chev" aria-hidden="true">→</span>
    </a>
  </section>
{/if}

<style>
  .welcome {
    max-width: 520px;
    padding-top: 20px;
  }
  .hero {
    display: grid;
    grid-template-areas: "copy" "art" "cta";
    text-align: center;
    gap: 12px;
  }
  .hero-copy {
    grid-area: copy;
    min-width: 0;
  }
  .bubble {
    display: inline-block;
    margin: 0 0 12px;
    padding: 5px 12px;
    border-radius: var(--radius-s) var(--radius-s) var(--radius-s) 4px;
    background: var(--red-soft);
    color: var(--red);
    font-size: 0.92rem;
  }
  .brand {
    margin: 0;
    font-size: clamp(2.4rem, 1.4rem + 5vw, 4.6rem);
  }
  .hero .thread-rule {
    margin: 13px auto 8px;
  }
  .lead {
    margin: 0;
    color: var(--muted);
    line-height: 1.35;
  }
  .hero-art {
    grid-area: art;
    position: relative;
    isolation: isolate;
    display: grid;
    place-items: end center;
    padding: 0 12px;
  }
  .hero-art::before {
    content: '';
    position: absolute;
    z-index: -1;
    inset: 12% 4% 0;
    background: var(--sky);
    border-radius: 60% 40% 55% 45%;
  }
  .hero-art :global(.cast) {
    max-height: clamp(185px, 67vw, 300px);
    width: auto;
    object-fit: contain;
  }
  .cta {
    grid-area: cta;
    display: grid;
    gap: 4px;
  }
  .big {
    justify-content: space-between;
    min-height: 56px;
    font-size: 1.05rem;
    text-align: left;
  }
  .fine {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }
  .perks {
    list-style: none;
    margin: 20px 0 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .perk {
    position: relative;
    display: grid;
    align-content: start;
    gap: 5px;
    padding: 14px 40px 14px 16px;
    border-radius: var(--radius);
    background: var(--perk-bg);
    line-height: 1.35;
  }
  .perk b {
    font: 800 1.14rem/1.2 var(--font-head);
  }
  .perk span {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .perk-star {
    position: absolute;
    inset: 14px 14px auto auto;
  }
  @media (min-width: 700px) {
    .welcome {
      max-width: 760px;
    }
    .hero-art::before {
      inset-inline: 22%;
    }
    .cta {
      width: min(100%, 360px);
      justify-self: center;
    }
    .perks {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (min-width: 900px) {
    .welcome {
      max-width: 1136px;
      padding-top: 28px;
    }
    .hero {
      grid-template: "copy art" 1fr "cta art" 1fr / minmax(0, 1.1fr) minmax(0, 0.9fr);
      column-gap: 0;
      padding-left: clamp(26px, 5vw, 68px);
      border: 2.5px solid var(--outline);
      border-radius: var(--radius-l);
      background: var(--surface);
      box-shadow: 0 4px 0 var(--hard-shadow);
      overflow: hidden;
      text-align: left;
    }
    .hero-copy {
      align-self: end;
      padding-top: 28px;
    }
    .hero .thread-rule {
      margin-inline: 0;
    }
    .hero-art {
      padding: 18px 20px 0 0;
    }
    .hero-art::before {
      inset: 8% -24% -10% 0;
    }
    .hero-art :global(.cast) {
      max-height: min(39vw, 520px);
    }
    .cta {
      align-self: start;
      justify-self: start;
      padding-bottom: 28px;
    }
    .cta .btn--flat {
      justify-content: start;
      padding-inline: 0;
    }
    .perks {
      margin-top: 22px;
      gap: 14px;
    }
    .perk {
      padding: 18px 44px 18px 20px;
    }
  }

  /* ── Главная для вернувшегося ── */
  .home {
    display: grid;
    gap: 14px;
    max-width: 680px;
  }
  .greet {
    display: flex;
    align-items: center;
    gap: 14px;
    overflow: hidden;
    padding: 0 12px;
    background: var(--sky);
    border-radius: var(--radius);
  }
  .greet-cast,
  .continue-cast {
    display: none;
  }
  @media (min-width: 360px) and (max-width: 479px) {
    .greet-cast {
      display: grid;
      align-self: end;
      flex: 0 0 108px;
    }
  }
  @media (min-width: 480px) {
    .continue-cast {
      display: grid;
      align-self: end;
      flex: 0 0 128px;
      margin-bottom: -16px;
    }
  }
  .greet-text {
    min-width: 0;
    padding-block: 16px;
  }
  .greet h1 {
    margin: 0 0 2px;
    font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
    overflow-wrap: anywhere;
  }
  .greet h1 .udm {
    font-weight: inherit;
    color: var(--red);
  }
  .greet p {
    margin: 0;
    line-height: 1.35;
  }
  .continue {
    display: flex;
    gap: 16px;
    padding: 16px;
    overflow: hidden;
  }
  .continue-body {
    display: grid;
    gap: 10px;
    flex: 1;
    min-width: 0;
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
    background: var(--red-soft);
    font-size: 28px;
  }
  .cont-text {
    min-width: 0;
  }
  .eyebrow {
    margin: 0 0 2px;
    font: 700 0.75rem/1.2 var(--font-head);
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
    background: var(--blue-soft);
    border-color: transparent;
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
    -webkit-tap-highlight-color: transparent;
  }
  .review {
    background: var(--green-soft);
    border-color: transparent;
  }
  .review:hover,
  .about:hover,
  .small-link:hover {
    text-decoration: underline;
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
    :global(html:not([data-motion='reduce'])) .hero {
      animation: hero-in var(--dur-slow) var(--ease-enter) both;
    }
  }
  @keyframes hero-in {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
  }
</style>
