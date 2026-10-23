<script lang="ts">
  /**
   * «Читалка»: короткие тексты из проверенных фраз курса.
   * Нажмите на слово — снизу появится значение (из разбора фразы, словника курса или большого словаря).
   * У каждой строки — озвучка и перевод; «Слушать всё» читает текст подряд.
   * В конце — пара вопросов на понимание и XP.
   */
  import { course, lexicon, personalize } from '$lib/course';
  import type { LexItem, ReaderText } from '$lib/content/schema';
  import { href } from '$lib/router.svelte';
  import { progress, type Reward } from '$lib/progress.svelte';
  import { tokenizeLine, buildCourseIndex, glossLocal, glossInDict, buildDictIndex, type Gloss, type DictIndex } from '$lib/reader';
  import { loadDict } from '$lib/dict';
  import { sfx, haptic } from '$lib/sfx';
  import { celebrate } from '$lib/celebrate';
  import { plural } from '$lib/lesson';
  import { prefs } from '$lib/prefs.svelte';
  import AudioButton from '../components/exercise/AudioButton.svelte';
  import MorphemeBreakdown from '../components/exercise/MorphemeBreakdown.svelte';

  let { id }: { id?: string } = $props();

  const texts = course.texts;
  const unitNo = (uid: string) => course.units.findIndex((u) => u.id === uid) + 1;
  const unitTitle = (uid: string) => course.units.find((u) => u.id === uid)?.title ?? '';
  const text = $derived<ReaderText | undefined>(id ? texts.find((t) => t.id === id) : undefined);
  const nextText = $derived(text ? texts[texts.indexOf(text) + 1] : undefined);
  const lines = $derived(
    (text?.lines ?? []).map((l) => {
      const it = lexicon.get(l.item) as LexItem;
      return { ...l, it, udm: personalize(it.udm), ru: personalize(it.ru), who: l.who ? personalize(l.who) : undefined };
    }),
  );

  // ── Значение слова ──
  const courseIdx = buildCourseIndex(course.lexicon);
  let dictIdx: DictIndex | undefined;
  let gloss = $state<(Gloss & { line: number; ru: string }) | null>(null);
  let glossLoading = $state(false);
  let picked = $state<{ line: number; tok: number } | null>(null);

  async function pick(line: number, tok: number, word: string, el?: HTMLElement) {
    sfx.tap();
    haptic.tap();
    picked = { line, tok };
    // слово не должно оказаться под панелью со значением
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight * 0.45)
        requestAnimationFrame(() => window.scrollBy({ top: r.top - window.innerHeight * 0.3, behavior: prefs.reduceMotion ? 'instant' : 'smooth' }));
    }
    const l = lines[line];
    const local = glossLocal(word, l.it, courseIdx);
    if (local) {
      gloss = { ...local, line, ru: l.ru };
      return;
    }
    gloss = { word, gloss: '', from: 'dict', line, ru: l.ru };
    glossLoading = true;
    try {
      dictIdx ??= buildDictIndex((await loadDict()).entries);
      const g = glossInDict(word, dictIdx);
      if (picked?.line === line && picked.tok === tok) gloss = g ? { ...g, line, ru: l.ru } : { word, gloss: '', from: 'dict', line, ru: l.ru };
    } catch {
      /* офлайн без словаря — покажем перевод фразы */
    } finally {
      glossLoading = false;
    }
  }
  function closeGloss() {
    gloss = null;
    picked = null;
  }
  // Для скринридера: значение объявляется в живой области, фокус остаётся на слове (можно идти дальше по тексту).
  const announce = $derived(
    !gloss || glossLoading
      ? ''
      : gloss.gloss
        ? `${gloss.word} — ${personalize(gloss.gloss)}`
        : `${gloss.word}: нет в словаре в такой форме. Перевод фразы: ${gloss.ru}`,
  );

  // ── Перевод и озвучка ──
  let showAll = $state(false);
  let shown = $state<Record<number, boolean>>({});
  let playingLine = $state(-1);
  let playToken = 0;
  let audioEl: HTMLAudioElement | undefined;

  function playOne(path: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        audioEl?.pause();
        audioEl = new Audio(`${import.meta.env.BASE_URL}audio/${path}.mp3`);
        audioEl.onended = audioEl.onerror = () => resolve();
        void audioEl.play().catch(() => resolve());
      } catch {
        resolve();
      }
    });
  }
  async function playAll() {
    if (playingLine >= 0) return stopAll();
    const my = ++playToken;
    for (let i = 0; i < lines.length; i++) {
      if (my !== playToken) return;
      const a = lines[i].it.audio;
      if (!a) continue;
      playingLine = i;
      document.querySelector(`[data-line="${i}"]`)?.scrollIntoView({ block: 'nearest', behavior: prefs.reduceMotion ? 'instant' : 'smooth' });
      await playOne(a);
      await new Promise((r) => setTimeout(r, 350));
    }
    if (my === playToken) playingLine = -1;
  }
  function stopAll() {
    playToken++;
    audioEl?.pause();
    playingLine = -1;
  }
  const anyAudio = $derived(lines.some((l) => l.it.audio));

  // ── Вопросы ──
  let answers = $state<Record<number, string>>({});
  let reward = $state<Reward | null>(null);
  const questions = $derived(text?.questions ?? []);
  const answeredAll = $derived(questions.every((_, i) => answers[i] !== undefined));
  const correctCount = $derived(questions.filter((q, i) => answers[i] === q.answer).length);

  function answer(qi: number, opt: string) {
    if (answers[qi] !== undefined || !text) return;
    answers[qi] = opt;
    const ok = opt === questions[qi].answer;
    if (ok) {
      sfx.correct();
      haptic.correct();
    } else {
      sfx.wrong();
      haptic.wrong();
    }
  }
  function finish() {
    if (!text || reward) return;
    stopAll();
    reward = progress.completeReading(text.id, correctCount, questions.length);
    sfx.complete();
    celebrate(correctCount === questions.length ? 2 : 1);
  }

  // Сброс состояния при переходе к другому тексту
  $effect(() => {
    void id;
    showAll = false;
    shown = {};
    answers = {};
    reward = null;
    gloss = null;
    picked = null;
    return () => stopAll();
  });

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape' && gloss) closeGloss();
  }
</script>

<svelte:window onkeydown={onKey} />

{#if !id}
  <section class="page reader-list">
    <header class="head rise">
      <h1>Читалка</h1>
      <p class="lead">
        Короткие тексты и диалоги из фраз курса. Нажмите на любое слово — появится его значение. У каждой строки есть
        перевод, у многих — озвучка.
      </p>
    </header>
    <ol class="texts">
      {#each texts as t, n (t.id)}
        {@const times = progress.timesRead(t.id)}
        <li class="rise" style:animation-delay="{n * 40}ms">
          <a class="card text-card" href={href(`/read/${t.id}`)} data-testid="text-{t.id}">
            <span class="ic" aria-hidden="true">{t.icon ?? '📖'}</span>
            <span class="tt">
              <b class="udm" lang="udm">{personalize(t.title)}</b>
              <span class="muted">{personalize(t.title_ru)}</span>
              <span class="meta">Юнит {unitNo(t.after)} · {unitTitle(t.after)} · {t.lines.length} {plural(t.lines.length, ['строка', 'строки', 'строк'])}</span>
            </span>
            {#if times}
              {@const readLabel = `Прочитано ${times} ${plural(times, ['раз', 'раза', 'раз'])}`}
              <span class="done" title={readLabel}><span aria-hidden="true">✓</span><span class="visually-hidden">{readLabel}</span></span>
            {:else}<span class="chev" aria-hidden="true">→</span>{/if}
          </a>
        </li>
      {/each}
    </ol>
    <p class="muted foot">
      Нужны все фразы сразу? Откройте <a href={href('/phrases')}>разговорник</a> — там все фразы курса и шпаргалки юнитов.
    </p>
  </section>
{:else if !text}
  <section class="page">
    <h1>Текст не найден</h1>
    <p><a href={href('/read')}>← Все тексты</a></p>
  </section>
{:else}
  <article class="page reader" class:glossing={!!gloss} data-testid="reader" data-text={text.id}>
    <a class="back" href={href('/read')}>← Все тексты</a>
    <header class="thead">
      <span class="big-ic" aria-hidden="true">{text.icon ?? '📖'}</span>
      <h1 class="udm" lang="udm">{personalize(text.title)}</h1>
      <p class="muted">{personalize(text.title_ru)} · после юнита {unitNo(text.after)}</p>
    </header>

    <div class="tools">
      {#if anyAudio}
        <button class="btn btn--sm" class:btn--red={playingLine >= 0} onclick={playAll} data-testid="play-all">
          {playingLine >= 0 ? '■ Стоп' : '▶ Слушать всё'}
        </button>
      {/if}
      <button class="btn btn--sm btn--ghost" aria-pressed={showAll} onclick={() => (showAll = !showAll)} data-testid="toggle-ru">
        {showAll ? 'Скрыть перевод' : 'Показать перевод'}
      </button>
    </div>
    <p class="hint muted">Нажмите на слово, чтобы узнать значение.</p>

    <div class="lines">
      {#each lines as l, i (i)}
        <div class="line" class:speaking={playingLine === i} class:has-who={l.who} data-line={i}>
          {#if l.who}<span class="who">{l.who}</span>{/if}
          <div class="row">
            <p class="udm-line udm" lang="udm">
              {#each tokenizeLine(l.udm) as tk, k (k)}{#if tk.word}<button
                    class="w"
                    class:on={picked?.line === i && picked.tok === k}
                    onclick={(e) => pick(i, k, tk.text, e.currentTarget)}
                    data-testid="word">{tk.text}</button
                  >{:else}{tk.text}{/if}{/each}
            </p>
            <div class="acts">
              <AudioButton audio={l.it.audio} size="sm" synth={l.it.audio_synth} />
              <button class="ru-btn" aria-pressed={showAll || !!shown[i]} aria-label="RU — перевод строки" onclick={() => (shown[i] = !shown[i])}>RU</button>
            </div>
          </div>
          {#if showAll || shown[i]}<p class="ru">{l.ru}</p>{/if}
        </div>
      {/each}
    </div>

    {#if questions.length}
      <section class="quiz">
        <h2>Проверьте себя</h2>
        {#each questions as q, qi (qi)}
          <div class="q">
            <p class="qq">{personalize(q.q)}</p>
            <div class="opts">
              {#each q.options as o (o)}
                {@const chosen = answers[qi] === o}
                {@const done = answers[qi] !== undefined}
                <button
                  class="opt"
                  class:ok={done && o === q.answer}
                  class:bad={chosen && o !== q.answer}
                  disabled={done}
                  onclick={() => answer(qi, o)}
                  data-testid="q{qi}-opt">{o}</button
                >
              {/each}
            </div>
          </div>
        {/each}
      </section>
    {/if}

    {#if reward}
      <div class="result card" role="status" data-testid="reader-done">
        <b>Прочитано! +{reward.xp} XP</b>
        <span class="muted">
          {#if questions.length}Ответов верно: {correctCount} из {questions.length}.{/if}
          {#if reward.streakExtended}Серия: {reward.streakAfter} 🔥{/if}
        </span>
        {#if reward.newAchievements.includes('reader-3')}<span>📖 Новое достижение: «Читатель»</span>{/if}
        <div class="next">
          {#if nextText}<a class="btn btn--sm" href={href(`/read/${nextText.id}`)}>Следующий текст →</a>{/if}
          <a class="btn btn--sm btn--ghost" href={href('/read')}>Все тексты</a>
        </div>
      </div>
    {:else}
      <button class="btn btn--block finish" disabled={!answeredAll} onclick={finish} data-testid="reader-finish">
        {answeredAll ? 'Готово' : 'Ответьте на вопросы'}
      </button>
    {/if}
  </article>

  <p class="visually-hidden" aria-live="polite" aria-atomic="true">{announce}</p>
  {#if gloss}
    <!-- Не модальное окно: фокус не забирает, значение объявляется через aria-live выше; Esc закрывает -->
    <aside class="gloss" aria-label="Значение слова" data-testid="gloss">
      <button class="x" aria-label="Закрыть значение слова" onclick={closeGloss}>×</button>
      <p class="gw udm" lang="udm">{gloss.word}</p>
      {#if glossLoading}
        <p class="muted">Ищу в словаре…</p>
      {:else if gloss.gloss}
        <p class="gm">{personalize(gloss.gloss)}</p>
        {#if gloss.lemma}<p class="muted small">≈ форма слова <b class="udm" lang="udm">{gloss.lemma}</b> (по словарю, проверьте)</p>{/if}
        {#if gloss.parts}
          <details class="parts">
            <summary>Из чего состоит</summary>
            <MorphemeBreakdown morphemes={gloss.parts} caption="Из чего состоит" />
          </details>
        {/if}
        <p class="src muted small">
          {gloss.from === 'phrase' ? 'Из разбора этой фразы' : gloss.from === 'course' ? 'Из словника курса' : 'Из словаря uniparser-udm'}
          · <a href={href(`/dict/${encodeURIComponent(gloss.lemma ?? gloss.word)}`)}>в словаре →</a>
        </p>
      {:else}
        <p class="muted">Этого слова нет в словаре в такой форме. Перевод всей фразы:</p>
        <p class="gm">{gloss.ru}</p>
      {/if}
    </aside>
  {/if}
{/if}

<style>
  .head h1,
  .thead h1 {
    margin: 0 0 6px;
  }
  .lead {
    margin: 0 0 18px;
    line-height: 1.5;
  }
  .texts {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .text-card {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 14px;
    align-items: center;
    color: inherit;
    text-decoration: none;
  }
  .text-card:hover {
    border-color: var(--line-strong);
  }
  .ic {
    font-size: 1.8rem;
  }
  .tt {
    display: grid;
    gap: 2px;
    min-width: 0;
  }
  .tt b {
    font-size: 1.08rem;
  }
  .meta {
    font-size: 0.8rem;
    color: var(--muted);
  }
  .done {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--green);
    color: var(--on-fill);
    font-weight: 700;
  }
  .chev {
    color: var(--muted);
  }
  .foot {
    margin-top: 18px;
  }

  .back {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-bottom: 2px;
    color: var(--muted);
    text-decoration: none;
    font-weight: 600;
  }
  .thead {
    text-align: center;
    margin-bottom: 14px;
  }
  .big-ic {
    font-size: 2.4rem;
  }
  .tools {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .hint {
    text-align: center;
    font-size: 0.85rem;
    margin: 10px 0 14px;
  }
  .lines {
    display: grid;
    gap: 8px;
  }
  /* место под панелью значения, чтобы до последних строк можно было долистать */
  .reader.glossing {
    padding-bottom: calc(45vh + var(--nav-h));
  }
  .line {
    padding: 10px 12px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 2px solid var(--line);
  }
  .line.speaking {
    border-color: var(--red);
    background: var(--red-soft);
  }
  .who {
    display: inline-block;
    font: 700 0.78rem var(--font-head);
    color: var(--red);
    margin-bottom: 2px;
  }
  .row {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }
  .udm-line {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 1.2rem;
    line-height: 1.6;
  }
  .w {
    font: inherit;
    color: inherit;
    background: none;
    border: 0;
    padding: 0 1px;
    margin: 0;
    border-radius: 6px;
    cursor: pointer;
    text-decoration: underline dotted var(--line-strong);
    text-underline-offset: 5px;
    text-decoration-thickness: 2px;
  }
  .w:hover {
    background: var(--surface-2);
  }
  .w.on {
    background: var(--amber-soft);
    text-decoration-color: var(--amber);
  }
  .acts {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    flex: none;
  }
  .ru-btn {
    position: relative;
    height: 36px;
    min-width: 44px;
    border-radius: 10px;
    border: 2px solid var(--field-border);
    background: var(--surface);
    font: 700 0.72rem var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  /* область нажатия 44×44: продолжается вниз, в поле строки (над кнопкой — озвучка) */
  .ru-btn::after {
    content: '';
    position: absolute;
    inset: -2px -2px -10px;
  }
  .ru-btn[aria-pressed='true'] {
    background: var(--ink);
    color: var(--bg);
    border-color: var(--ink);
  }
  .ru {
    margin: 4px 0 0;
    color: var(--muted);
    line-height: 1.4;
  }

  .quiz {
    margin-top: 22px;
  }
  .quiz h2 {
    font-size: 1.1rem;
    margin: 0 0 10px;
  }
  .q {
    margin-bottom: 14px;
  }
  .qq {
    margin: 0 0 8px;
    font-weight: 600;
  }
  .opts {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .opt {
    border: 2px solid var(--line);
    border-bottom-width: 4px;
    background: var(--surface);
    border-radius: var(--radius-s);
    min-height: 44px;
    padding: 9px 14px;
    font: 600 0.95rem var(--font-text);
    color: inherit;
    cursor: pointer;
  }
  .opt:disabled {
    cursor: default;
    opacity: 0.75;
  }
  .opt.ok {
    opacity: 1;
    background: var(--green-soft);
    border-color: var(--green);
  }
  .opt.bad {
    opacity: 1;
    background: var(--red-soft);
    border-color: var(--red);
  }
  .finish {
    margin-top: 16px;
  }
  .result {
    margin-top: 16px;
    display: grid;
    gap: 6px;
    text-align: center;
  }
  .result b {
    font: 700 1.2rem var(--font-head);
  }
  .next {
    display: flex;
    gap: 8px;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 6px;
  }

  .gloss {
    position: fixed;
    left: 50%;
    bottom: calc(var(--nav-h) + 12px + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    width: min(520px, calc(100% - 2 * var(--gutter)));
    z-index: 30;
    background: var(--surface);
    border: 2px solid var(--line-strong);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow);
    padding: 14px 16px 12px;
    max-height: 40vh;
    overflow: auto;
    overscroll-behavior: contain;
  }
  /* десктоп: навигация — рейка слева (96 px), снизу ничего нет — центр по колонке текста */
  @media (min-width: 900px) {
    .gloss {
      left: calc(50% + 48px);
      bottom: calc(16px + env(safe-area-inset-bottom));
    }
  }
  .x {
    position: absolute;
    top: 2px;
    right: 4px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: none;
    font-size: 1.5rem;
    color: var(--muted);
    cursor: pointer;
  }
  .gw {
    margin: 0;
    font-size: 1.35rem;
    padding-right: 44px;
  }
  .parts {
    margin: 4px 0 0;
  }
  .parts summary {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    cursor: pointer;
    font-weight: 600;
    color: var(--blue);
  }
  .parts :global(.cap) {
    display: none;
  }
  .gm {
    margin: 4px 0 8px;
    font-size: 1.05rem;
    font-weight: 600;
  }
  .small {
    font-size: 0.82rem;
  }
  .src {
    margin: 8px 0 0;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .gloss {
      animation: gloss-in var(--spring-snappy-dur) var(--spring-snappy);
    }
    :global(html:not([data-motion='reduce'])) .text-card {
      transition:
        transform var(--dur-fast) var(--ease-standard),
        border-color var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .text-card:active {
      transform: scale(0.98);
    }
    :global(html:not([data-motion='reduce'])) .line {
      transition:
        border-color var(--dur-base),
        background var(--dur-base);
    }
    :global(html:not([data-motion='reduce'])) .opt {
      transition: transform var(--dur-press) var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .opt:active:not(:disabled) {
      transform: translateY(2px);
    }
  }
  @keyframes gloss-in {
    from {
      opacity: 0;
      transform: translate(-50%, 14px) scale(0.98);
    }
  }
</style>
