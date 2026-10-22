<script lang="ts">
  import { progress, ACHIEVEMENTS } from '$lib/progress.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { href } from '$lib/router.svelte';
  import { allLessons } from '$lib/course';
  import { dayKey, addDays } from '$lib/dates';
  import Octagram from '../components/Octagram.svelte';

  const d = $derived(progress.data);
  const streak = $derived(progress.streakState);
  const lessonsDone = $derived(Object.values(d.lessons).filter((l) => l.done > 0).length);
  const words = $derived(Object.keys(d.cards).length);
  const since = $derived(new Date(d.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }));
  const initial = $derived((d.name || 'Ученик').trim()[0]?.toUpperCase() ?? 'У');

  // Календарь активности: 12 недель, колонки — недели (пн…вс)
  const WEEKS = 12;
  const cells = $derived.by(() => {
    const today = dayKey();
    const now = new Date();
    const dow = (now.getDay() + 6) % 7; // 0 = понедельник
    const start = addDays(today, -(WEEKS * 7 - 1) - (6 - dow));
    const out: { key: string; xp: number; future: boolean; frozen: boolean }[] = [];
    for (let i = 0; i < WEEKS * 7; i++) {
      const key = addDays(start, i);
      out.push({ key, xp: d.days[key] ?? 0, future: key > today, frozen: d.streak.frozen.includes(key) });
    }
    return out;
  });
  const level = (xp: number) => (xp <= 0 ? 0 : xp < 15 ? 1 : xp < 30 ? 2 : xp < 60 ? 3 : 4);
  const activeDays = $derived(Object.values(d.days).filter((x) => x > 0).length);

  let editing = $state(false);
  let nameDraft = $state('');
  function startEdit() {
    nameDraft = d.name;
    editing = true;
  }
  function saveName() {
    progress.setName(nameDraft);
    editing = false;
  }

  // Перенос прогресса
  let code = $state('');
  let importText = $state('');
  let msg = $state<{ ok: boolean; text: string } | null>(null);
  async function copyCode() {
    code = progress.exportCode();
    try {
      await navigator.clipboard.writeText(code);
      msg = { ok: true, text: 'Код скопирован. Сохраните его в заметках или отправьте себе.' };
    } catch {
      msg = { ok: true, text: 'Выделите код ниже и скопируйте вручную.' };
    }
  }
  function doImport() {
    if (!importText.trim()) return;
    if (!confirm('Заменить текущий прогресс прогрессом из кода?')) return;
    const ok = progress.importCode(importText);
    msg = ok ? { ok: true, text: 'Прогресс перенесён!' } : { ok: false, text: 'Код не подошёл — проверьте, что скопировали его целиком.' };
    if (ok) importText = '';
  }
  function doReset() {
    if (confirm('Точно сбросить весь прогресс? Это нельзя отменить.')) {
      progress.reset();
      msg = { ok: true, text: 'Прогресс сброшен.' };
    }
  }
  const goals = [10, 20, 30, 50];
</script>

<section class="page me">
  <header class="profile rise">
    <div class="avatar" aria-hidden="true">
      <span>{initial}</span>
      <i class="star"><Octagram size={22} /></i>
    </div>
    <div class="who">
      {#if editing}
        <form class="name-edit" onsubmit={(e) => { e.preventDefault(); saveName(); }}>
          <input bind:value={nameDraft} maxlength="40" aria-label="Ваше имя" />
          <button class="btn btn--sm" type="submit">Сохранить</button>
        </form>
      {:else}
        <h1>{d.name || 'Ученик'}</h1>
        <button class="btn btn--flat btn--sm" onclick={startEdit}>Изменить имя</button>
      {/if}
      <p class="muted">Учится с {since}</p>
    </div>
  </header>

  <div class="stats">
    <div class="stat card"><b>🔥 {streak.value}</b><span>дней подряд</span></div>
    <div class="stat card"><b>🏆 {d.streak.best}</b><span>лучшая серия</span></div>
    <div class="stat card"><b>⚡ {d.xp}</b><span>XP всего</span></div>
    <div class="stat card"><b>📘 {lessonsDone}/{allLessons.length}</b><span>уроков</span></div>
    <div class="stat card"><b>🧠 {words}</b><span>слов в повторении</span></div>
    <div class="stat card"><b>❄️ {d.streak.freezes}</b><span>заморозки серии</span></div>
  </div>

  <h2>Активность</h2>
  <div class="cal card">
    <div class="dows" aria-hidden="true"><span>пн</span><span></span><span>ср</span><span></span><span>пт</span><span></span><span>вс</span></div>
    <div class="grid" role="img" aria-label="Календарь занятий за 12 недель: {activeDays} дней с занятиями">
      {#each cells as c (c.key)}
        <i class="c l{level(c.xp)}" class:future={c.future} class:frozen={c.frozen} title="{c.key}: {c.xp} XP{c.frozen ? ' (заморозка)' : ''}"></i>
      {/each}
    </div>
    <p class="muted small">Каждая клетка — день. Чем темнее, тем больше XP. ❄️ — день, закрытый заморозкой.</p>
  </div>

  <h2>Достижения</h2>
  <ul class="ach">
    {#each Object.entries(ACHIEVEMENTS) as [id, a] (id)}
      {@const got = d.achievements.includes(id)}
      <li class="card" class:got>
        <span class="ai" aria-hidden="true">{a.icon}</span>
        <span class="at">{a.title}</span>
        <span class="as muted">{a.text}</span>
        <span class="visually-hidden">{got ? 'получено' : 'ещё не получено'}</span>
      </li>
    {/each}
  </ul>

  <h2>Цель на день</h2>
  <div class="goals" role="radiogroup" aria-label="Сколько XP в день">
    {#each goals as g (g)}
      <button role="radio" aria-checked={d.dailyGoal === g} class:on={d.dailyGoal === g} onclick={() => progress.setDailyGoal(g)}>
        <b>{g} XP</b><span>{g === 10 ? 'спокойно' : g === 20 ? 'нормально' : g === 30 ? 'серьёзно' : 'интенсив'}</span>
      </button>
    {/each}
  </div>

  <h2>Настройки</h2>
  <div class="card settings">
    <label class="toggle"><span>Звуки</span><input type="checkbox" role="switch" checked={prefs.value.sound} onchange={(e) => prefs.set('sound', e.currentTarget.checked)} /></label>
    <label class="toggle"><span>Вибрация (Android)</span><input type="checkbox" role="switch" checked={prefs.value.haptics} onchange={(e) => prefs.set('haptics', e.currentTarget.checked)} /></label>
    <label class="toggle"><span>Меньше анимации</span><input type="checkbox" role="switch" checked={prefs.value.motion === 'reduce'} onchange={(e) => prefs.set('motion', e.currentTarget.checked ? 'reduce' : 'auto')} /></label>
    <div class="theme" role="radiogroup" aria-label="Тема">
      <span>Тема</span>
      <div class="seg">
        {#each [['auto', 'Авто'], ['light', 'Светлая'], ['dark', 'Тёмная']] as [v, l] (v)}
          <button role="radio" aria-checked={prefs.value.theme === v} class:on={prefs.value.theme === v} onclick={() => prefs.set('theme', v as 'auto' | 'light' | 'dark')}>{l}</button>
        {/each}
      </div>
    </div>
  </div>

  <h2>Перенос прогресса</h2>
  <div class="card transfer">
    <p class="muted">Прогресс хранится только в этом браузере. Чтобы продолжить на другом устройстве или не потерять его, скопируйте код и вставьте там.</p>
    <button class="btn btn--ghost" onclick={copyCode} data-testid="export-code">Скопировать код</button>
    {#if code}<textarea class="code" readonly rows="3" onfocus={(e) => e.currentTarget.select()}>{code}</textarea>{/if}
    <textarea class="code" rows="3" bind:value={importText} placeholder="Вставьте код UDM1.…" aria-label="Код прогресса"></textarea>
    <button class="btn btn--ghost" onclick={doImport} disabled={!importText.trim()} data-testid="import-code">Вставить код</button>
    {#if msg}<p class="msg" class:bad={!msg.ok} role="status">{msg.text}</p>{/if}
  </div>

  <div class="links">
    <a href={href('/group')}>Группа и лига недели</a>
    <a href={href('/credits')}>Источники и благодарности</a>
    <a href="https://github.com/depthd/udmurt" target="_blank" rel="noopener">Проект на GitHub</a>
    <button class="btn btn--flat danger" onclick={doReset} data-testid="reset">Сбросить прогресс</button>
  </div>
</section>

<style>
  .profile {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .avatar {
    position: relative;
    flex: none;
    width: 84px;
    height: 84px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: var(--red-soft);
    border: 3px solid var(--red);
    font: 700 2.2rem var(--font-head);
    color: var(--red);
    box-shadow: 0 0 0 5px var(--surface), 0 0 0 7px var(--line);
  }
  .star {
    position: absolute;
    right: -6px;
    bottom: -4px;
    background: var(--surface);
    border-radius: 50%;
    padding: 3px;
  }
  .who h1 {
    margin: 0;
    font-size: 1.7rem;
  }
  .who p {
    margin: 2px 0 0;
  }
  .who .btn--flat {
    padding-left: 0;
  }
  .name-edit {
    display: flex;
    gap: 8px;
  }
  .name-edit input {
    flex: 1;
    min-width: 0;
    height: 40px;
    padding: 0 12px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
  }
  h2 {
    font-size: 1.1rem;
    margin: 26px 0 10px;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 10px;
  }
  .stat {
    display: grid;
    gap: 2px;
    padding: 12px 14px;
  }
  .stat b {
    font: 700 1.25rem var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .stat span {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .cal {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 8px;
  }
  .dows {
    display: grid;
    grid-template-rows: repeat(7, 1fr);
    font-size: 0.65rem;
    color: var(--muted);
    align-items: center;
  }
  .grid {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, 1fr);
    gap: 3px;
  }
  .c {
    aspect-ratio: 1;
    border-radius: 4px;
    background: var(--surface-2);
  }
  .c.l1 {
    background: color-mix(in srgb, var(--red) 30%, var(--surface));
  }
  .c.l2 {
    background: color-mix(in srgb, var(--red) 55%, var(--surface));
  }
  .c.l3 {
    background: color-mix(in srgb, var(--red) 78%, var(--surface));
  }
  .c.l4 {
    background: var(--red);
  }
  .c.frozen {
    background: var(--blue-soft);
    outline: 1px solid var(--blue);
  }
  .c.future {
    opacity: 0.3;
  }
  .small {
    grid-column: 1 / -1;
    font-size: 0.8rem;
    margin: 4px 0 0;
  }
  .ach {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }
  .ach li {
    display: grid;
    gap: 2px;
    padding: 12px;
    filter: grayscale(1);
    opacity: 0.55;
  }
  .ach li.got {
    filter: none;
    opacity: 1;
    border-color: var(--amber);
    box-shadow: 0 3px 0 var(--amber);
  }
  .ai {
    font-size: 1.6rem;
  }
  .at {
    font: 700 0.95rem var(--font-head);
  }
  .as {
    font-size: 0.8rem;
  }
  .goals {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }
  .goals button,
  .seg button {
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 14px;
    padding: 10px 4px;
    display: grid;
    gap: 2px;
    cursor: pointer;
    box-shadow: 0 3px 0 var(--line);
  }
  .goals button span {
    font-size: 0.75rem;
    color: var(--muted);
  }
  .goals button.on,
  .seg button.on {
    border-color: var(--red);
    box-shadow: 0 3px 0 var(--red);
    background: var(--red-soft);
  }
  .settings {
    display: grid;
    gap: 4px;
    padding: 8px 16px;
  }
  .toggle {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 48px;
    border-bottom: 1px solid var(--line);
    cursor: pointer;
  }
  .toggle input {
    appearance: none;
    width: 50px;
    height: 30px;
    border-radius: 999px;
    background: var(--line-strong);
    position: relative;
    cursor: pointer;
    flex: none;
    transition: background-color var(--dur-fast);
  }
  .toggle input::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgb(0 0 0 / 0.25);
    transition: transform var(--spring-snappy-dur) var(--spring-snappy);
  }
  .toggle input:checked {
    background: var(--green);
  }
  .toggle input:checked::after {
    transform: translateX(20px);
  }
  .theme {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: 56px;
    gap: 8px;
  }
  .seg {
    display: flex;
    gap: 6px;
  }
  .seg button {
    padding: 8px 10px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .transfer {
    display: grid;
    gap: 10px;
    justify-items: start;
  }
  .transfer p {
    margin: 0;
  }
  .code {
    width: 100%;
    font: 0.8rem/1.4 ui-monospace, monospace;
    padding: 10px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface-2);
    resize: vertical;
    word-break: break-all;
  }
  .msg {
    margin: 0;
    color: var(--green);
    font-weight: 600;
  }
  .msg.bad {
    color: var(--red);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    margin-top: 24px;
  }
  .danger {
    --fg: var(--red);
  }
</style>
