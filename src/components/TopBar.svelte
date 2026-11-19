<script lang="ts">
  import { progress } from '$lib/progress.svelte';
  import { href } from '$lib/router.svelte';
  import Octagram from './Octagram.svelte';

  const streak = $derived(progress.streakState);
</script>

<header class="top no-print">
  <div class="inner">
    <a class="brand" href={href('/')} aria-label="Удмурт кыл — на главную">
      <Octagram size={26} color="var(--red)" />
      <span class="name">Удмурт кыл</span>
    </a>
    <div class="stats">
      <a class="stat" href={href('/me')} title={streak.doneToday ? 'Серия дней: сегодня занятие уже было' : 'Серия дней: сегодня ещё нет занятия'}>
        <svg class="ic" class:lit={streak.doneToday} viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path fill="currentColor" d="M12 2c.6 5-3.5 6.5-3.5 10 0 1.2.6 2 1.4 2.5-.4-2.2 1.6-3.2 2.3-4.6 1 1.4 3.3 2.8 3.3 5.4 0 1.5-.9 2.9-2.2 3.7 2.8-.6 4.7-3 4.7-5.7 0-2-1-4-2-5.3 3.5 2.1 5 4.4 5 7.6 0 4-3.8 7.4-8.8 7.4-5.2 0-9.2-3.2-9.2-8C3 8.8 10.4 7.5 12 2Z" />
        </svg>
        <span class="num">{streak.value}</span>
        <span class="visually-hidden">дней подряд</span>
      </a>
      <a class="stat" href={href('/me')} title="Опыт (XP)">
        <svg class="ic xp" viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
          <path fill="currentColor" d="M13.6 2 5 13h6l-.6 9L19 11h-6z" />
        </svg>
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
    background: var(--surface);
    border-bottom: 1px solid var(--line);
  }
  .inner {
    max-width: 1280px;
    margin: 0 auto;
    min-height: 63px;
    padding: 8px var(--gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .brand {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--ink);
    text-decoration: none;
    font: 800 clamp(0.9rem, 4.2vw, 1.15rem)/1.1 var(--font-head);
    min-height: 44px;
    min-width: 44px;
  }
  .stats {
    display: flex;
    gap: 6px;
  }
  .stat {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    color: var(--ink);
    background: var(--amber-soft);
    text-decoration: none;
    min-height: 44px;
    min-width: 44px;
    font: 700 1rem/1 var(--font-head);
    font-variant-numeric: tabular-nums;
  }
  .stat:last-child {
    background: var(--blue-soft);
  }
  .stat:hover .num {
    text-decoration: underline;
  }
  .ic {
    flex: none;
    color: var(--muted);
  }
  .ic.lit {
    color: var(--amber);
  }
  .ic.xp {
    color: var(--blue);
  }
</style>
