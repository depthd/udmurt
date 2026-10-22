<script lang="ts">
  import { progress } from '$lib/progress.svelte';
  import { href } from '$lib/router.svelte';
  import Octagram from './Octagram.svelte';

  const streak = $derived(progress.streakState);
</script>

<header class="top">
  <div class="inner">
    <a class="brand" href={href('/')} aria-label="Удмурт кыл — на главную">
      <Octagram size={26} />
      <span class="name">Удмурт кыл</span>
    </a>
    <div class="stats">
      <a class="stat" href={href('/me')} title={streak.doneToday ? 'Серия дней: сегодня занятие уже было' : 'Серия дней: сегодня ещё нет занятия'}>
        <span class="ic" class:lit={streak.doneToday} aria-hidden="true">🔥</span>
        <span class="num">{streak.value}</span>
        <span class="visually-hidden">дней подряд</span>
      </a>
      <a class="stat" href={href('/me')} title="Опыт (XP)">
        <span class="ic" aria-hidden="true">⚡</span>
        <span class="num">{progress.data.xp}</span>
        <span class="visually-hidden">XP</span>
      </a>
    </div>
  </div>
</header>

<style>
  .top {
    position: sticky;
    top: 0;
    z-index: 20;
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--line);
  }
  .inner {
    max-width: 1040px;
    margin: 0 auto;
    padding: 10px var(--gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
    text-decoration: none;
    font: 700 1.1rem/1 var(--font-head);
  }
  .stats {
    display: flex;
    gap: 6px;
  }
  .stat {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    color: var(--ink);
    text-decoration: none;
    font: 700 1rem/1 var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .stat:hover {
    background: var(--surface-2);
  }
  .ic {
    filter: grayscale(1) opacity(0.55);
  }
  .ic.lit,
  .stat:last-child .ic {
    filter: none;
  }
  @media (max-width: 360px) {
    .name {
      display: none;
    }
  }
</style>
