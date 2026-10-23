<script lang="ts">
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { progress } from '$lib/progress.svelte';
  import { group, makeCode, parseCode, parseMany, weekKey, weekXp, type Member } from '$lib/group.svelte';
  import { href } from '$lib/router.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import Mascot from '../components/Mascot.svelte';

  let { code = '' }: { code?: string } = $props();

  const week = weekKey();
  const me = $derived<Member>({
    name: progress.data.name || 'Я',
    xp: weekXp(progress.data.days),
    streak: progress.streakState.value,
    words: Object.keys(progress.data.cards).length,
    week,
    at: Date.now(),
  });
  const myCode = $derived(makeCode(me));
  const myLink = $derived(`${location.origin}${import.meta.env.BASE_URL}#/group/${myCode}`);

  const others = $derived(Object.values(group.data.members).filter((m) => m.name.toLowerCase() !== me.name.toLowerCase()));
  const board = $derived(
    [{ ...me, isMe: true }, ...others.filter((m) => m.week === week).map((m) => ({ ...m, isMe: false }))].sort((a, b) => b.xp - a.xp),
  );
  const stale = $derived(others.filter((m) => m.week !== week));
  const total = $derived(board.reduce((s, m) => s + m.xp, 0));
  const pct = $derived(Math.min(1, total / Math.max(1, group.data.goal)));

  let paste = $state('');
  let msg = $state<{ ok: boolean; text: string } | null>(null);
  const dur = $derived(prefs.reduceMotion ? 0 : 300);

  function addFrom(text: string) {
    const found = parseMany(text);
    if (!found.length) {
      msg = { ok: false, text: 'Код не распознан. Скопируйте его целиком — он начинается с G1.' };
      return;
    }
    let added = 0;
    for (const m of found) if (m.name.toLowerCase() !== me.name.toLowerCase() && group.add(m) !== 'old') added++;
    msg = { ok: true, text: added ? `Добавлено: ${added}. Лига обновлена!` : 'Эти результаты уже есть.' };
    paste = '';
  }

  onMount(() => {
    if (code) {
      const m = parseCode(decodeURIComponent(code));
      if (m && m.name.toLowerCase() !== me.name.toLowerCase()) {
        group.add(m);
        msg = { ok: true, text: `${m.name} добавлен(а) в вашу лигу!` };
      }
      history.replaceState(null, '', '#/group');
    }
  });

  async function share() {
    const text = `Мой результат в «Удмурт кыл» за неделю: ${me.xp} XP, серия ${me.streak} 🔥\nДобавь меня в лигу: ${myLink}\nКод: ${myCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Удмурт кыл — лига недели', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      msg = { ok: true, text: 'Скопировано — отправьте в чат группы.' };
    } catch {
      msg = { ok: true, text: 'Скопируйте ссылку ниже вручную.' };
    }
  }

  const medal = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`;
  const goals = [150, 300, 500, 1000];
</script>

<section class="page group">
  <header class="hero rise">
    <Mascot mood="happy" size={96} />
    <div>
      <h1>Группа</h1>
      <p class="muted">Учитесь вместе: делитесь кодом в чате, следите за лигой недели и закрывайте общую цель.</p>
    </div>
  </header>

  {#if !progress.data.name}
    <div class="card warn">Чтобы друзья узнали вас в лиге, укажите имя в <a href={href('/me')}>профиле</a>.</div>
  {/if}

  <div class="card goal rise">
    <div class="goal-top">
      <h2>Цель группы на неделю</h2>
      <b class="num">{total} / {group.data.goal} XP</b>
    </div>
    <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax={group.data.goal} aria-valuenow={total} aria-label="Общая цель группы">
      <i style:width="{pct * 100}%"></i>
    </div>
    <p class="muted small">
      {#if pct >= 1}Цель недели выполнена! 🎉 Ӟеч! Можно поднять планку.{:else}Осталось {group.data.goal - total} XP на всех — это примерно {Math.ceil((group.data.goal - total) / 15)} уроков.{/if}
    </p>
    <div class="goals" role="radiogroup" aria-label="Цель группы">
      {#each goals as g (g)}
        <button role="radio" aria-checked={group.data.goal === g} class:on={group.data.goal === g} onclick={() => group.setGoal(g)}>{g}</button>
      {/each}
    </div>
  </div>

  <h2 class="sec">Лига недели <span class="muted wk">{week.replace('-W', ', неделя ')}</span></h2>
  <ol class="board">
    {#each board as m, i (m.name + m.isMe)}
      <li class:me={m.isMe} animate:flip={{ duration: dur }}>
        <span class="pos" aria-label="Место {i + 1}">{medal(i)}</span>
        <span class="nm">{m.name}{#if m.isMe} <small>(вы)</small>{/if}</span>
        <span class="st muted">🔥 {m.streak} · 🧠 {m.words}</span>
        <b class="xp">{m.xp} XP</b>
        {#if !m.isMe}<button class="rm" aria-label="Убрать {m.name}" onclick={() => group.remove(m.name)}>✕</button>{/if}
      </li>
    {/each}
  </ol>
  {#if board.length === 1}
    <p class="muted small">Пока в лиге только вы. Отправьте свой код в чат группы и вставьте коды друзей ниже.</p>
  {/if}
  {#if stale.length}
    <p class="muted small">Ещё {stale.length} — с результатами прошлых недель: попросите их прислать свежий код.</p>
  {/if}

  <div class="card share">
    <h2>Мой код</h2>
    <p class="muted small">Код обновляется сам: в нём ваше имя, XP за неделю и серия. Отправляйте его в чат раз в несколько дней.</p>
    <button class="btn" onclick={share} data-testid="share-code">Поделиться</button>
    <input class="code" readonly value={myLink} onfocus={(e) => e.currentTarget.select()} aria-label="Моя ссылка для лиги" />
  </div>

  <div class="card add">
    <h2>Добавить друзей</h2>
    <textarea rows="3" bind:value={paste} placeholder="Вставьте код или целое сообщение из чата — коды найдутся сами" aria-label="Коды друзей"></textarea>
    <button class="btn btn--ghost" disabled={!paste.trim()} onclick={() => addFrom(paste)} data-testid="add-codes">Добавить</button>
    {#if msg}<p class="msg" class:bad={!msg.ok} role="status">{msg.text}</p>{/if}
  </div>

  <a class="card projector" href={href('/projector')}>
    <span class="pi" aria-hidden="true">📽️</span>
    <span>
      <b>Режим проектора</b>
      <span class="muted">Игра для пары: вопрос на большом экране, отвечают командами, очки на табло.</span>
    </span>
  </a>
</section>

<style>
  .hero {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 16px;
  }
  .hero h1 {
    margin-bottom: 4px;
  }
  .hero p {
    margin: 0;
  }
  .warn {
    margin-bottom: 12px;
    background: var(--amber-soft);
    border-color: var(--amber);
  }
  .goal h2,
  .share h2,
  .add h2 {
    font-size: 1.05rem;
    margin: 0;
  }
  .goal-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 10px;
  }
  .num {
    font: 700 1rem var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .bar {
    height: 16px;
    border-radius: 999px;
    background: var(--surface-2);
    overflow: hidden;
  }
  .bar i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--amber), var(--red));
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .bar i {
      transition: width var(--spring-soft-dur) var(--spring-soft);
    }
  }
  .small {
    font-size: 0.85rem;
  }
  .goals {
    display: flex;
    gap: 6px;
  }
  .goals button {
    flex: 1;
    min-height: 44px;
    border: 2px solid var(--field-border);
    background: var(--surface);
    border-radius: 12px;
    padding: 6px;
    font: 600 0.85rem var(--font-head);
    cursor: pointer;
  }
  .goals button.on {
    border-color: var(--red);
    background: var(--red-soft);
  }
  .sec {
    font-size: 1.15rem;
    margin: 24px 0 10px;
  }
  .wk {
    font-size: 0.85rem;
    font-weight: 500;
  }
  .board {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .board li {
    display: grid;
    grid-template-columns: 36px 1fr auto auto;
    grid-template-rows: auto auto;
    align-items: center;
    column-gap: 10px;
    padding: 10px 12px;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
  }
  .board li.me {
    border-color: var(--red);
    background: var(--red-soft);
  }
  .pos {
    grid-row: 1 / 3;
    font: 700 1.2rem var(--font-head);
    text-align: center;
  }
  .nm {
    font: 700 1rem var(--font-head);
  }
  .st {
    grid-row: 2;
    grid-column: 2;
    font-size: 0.8rem;
  }
  .xp {
    grid-row: 1 / 3;
    grid-column: 3;
    font: 700 1.05rem var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .rm {
    grid-row: 1 / 3;
    grid-column: 4;
    border: 0;
    background: none;
    color: var(--muted);
    cursor: pointer;
    width: 44px;
    height: 44px;
    margin-right: -8px;
  }
  .share,
  .add {
    display: grid;
    gap: 10px;
    justify-items: start;
    margin-top: 14px;
  }
  .share p,
  .add p {
    margin: 0;
  }
  .code,
  textarea {
    width: 100%;
    padding: 10px;
    border: 2px solid var(--field-border);
    border-radius: 12px;
    background: var(--surface-2);
    font: 0.85rem/1.4 ui-monospace, monospace;
  }
  textarea {
    font-family: var(--font-text);
    background: var(--surface);
    resize: vertical;
  }
  .msg {
    color: var(--green);
    font-weight: 600;
  }
  .msg.bad {
    color: var(--red);
  }
  .projector {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-top: 14px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 0 var(--line);
  }
  .projector:active {
    transform: translateY(3px);
    box-shadow: 0 1px 0 var(--line);
  }
  .projector .pi {
    font-size: 2rem;
  }
  .projector b {
    display: block;
    font-family: var(--font-head);
  }
  .projector .muted {
    font-size: 0.9rem;
  }
</style>
