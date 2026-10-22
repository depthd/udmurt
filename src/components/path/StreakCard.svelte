<script lang="ts">
  /**
   * Карточка серии дней: огонь, число, неделя из 7 кружков (Пн–Вс) с отметками занятий,
   * мягкий текст при угрозе потери серии или при заморозке. Без стыда за пропуски (отчёт 01 §5.1).
   */
  import { progress } from '$lib/progress.svelte';
  import { dayKey, addDays } from '$lib/dates';
  import { plural } from './geometry';

  const LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const FULL = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];

  const s = $derived(progress.streakState);
  const today = dayKey();
  const monday = addDays(today, -((new Date().getDay() + 6) % 7));

  const week = $derived(
    LABELS.map((label, i) => {
      const key = addDays(monday, i);
      const done = (progress.data.days[key] ?? 0) > 0;
      const frozen = !done && progress.data.streak.frozen.includes(key);
      return { key, label, full: FULL[i], done, frozen, today: key === today, future: key > today };
    }),
  );

  const freezes = $derived(progress.data.streak.freezes);
  const repair = $derived(progress.repair);
  const message = $derived.by(() => {
    if (repair && repair.left > 0)
      return {
        tone: 'freeze',
        text: `Серию в ${repair.value} ${plural(repair.value, ['день', 'дня', 'дней'])} можно вернуть: ещё ${repair.left} ${plural(repair.left, ['урок', 'урока', 'уроков'])} до конца завтрашнего дня.`,
      };
    if (s.doneToday) return { tone: 'ok', text: 'Сегодня занятие есть — серия продлена. До завтра!' };
    if (s.canFreeze) return { tone: 'freeze', text: 'Пропуск закроет заморозка ❄. Пройдите урок сегодня, чтобы серия продолжилась.' };
    if (s.atRisk) return { tone: 'risk', text: 'Пройдите урок, чтобы не потерять серию' };
    if (s.broken) return { tone: 'soft', text: 'Серия прервалась — так бывает. Один урок, и начнётся новая!' };
    return { tone: 'soft', text: 'Пройдите урок — и начнётся серия дней.' };
  });
  const dayWord = $derived(plural(s.value, ['день', 'дня', 'дней']));
</script>

<article class="card streak" class:lit={s.doneToday} aria-labelledby="streak-title" data-testid="streak-card">
  <div class="top">
    <span class="flame" aria-hidden="true">🔥</span>
    <div class="num-wrap">
      <h2 id="streak-title" class="num">
        {s.value}
        <span class="unit">{dayWord} подряд</span>
      </h2>
      <p class="best muted">
        Рекорд: {progress.data.streak.best}
        {#if freezes > 0}
          <span class="chip freeze-chip" title="Заморозка закрывает один пропущенный день">❄ {freezes}</span>
          <span class="visually-hidden">{plural(freezes, ['заморозка', 'заморозки', 'заморозок'])} в запасе</span>
        {/if}
      </p>
    </div>
  </div>

  <ol class="week" aria-label="Эта неделя">
    {#each week as d (d.key)}
      <li
        class="day"
        class:done={d.done}
        class:frozen={d.frozen}
        class:today={d.today}
        class:future={d.future}
        aria-label="{d.full}: {d.done ? 'занятие было' : d.frozen ? 'заморозка' : d.future ? 'впереди' : d.today ? 'сегодня, ещё нет занятия' : 'нет занятия'}"
      >
        <span class="dot" aria-hidden="true">
          {#if d.done}
            <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3.5 8.5l3 3 6-7" /></svg>
          {:else if d.frozen}
            ❄
          {/if}
        </span>
        <span class="lbl" aria-hidden="true">{d.label}</span>
      </li>
    {/each}
  </ol>

  <p class="msg msg--{message.tone}">{message.text}</p>
</article>

<style>
  .streak {
    padding: 16px 16px 14px;
  }
  .top {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .flame {
    flex: none;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 30px;
    filter: grayscale(1);
    opacity: 0.7;
  }
  .lit .flame {
    background: var(--amber-soft);
    filter: none;
    opacity: 1;
  }
  .num-wrap {
    min-width: 0;
  }
  .num {
    margin: 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 2rem;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font-size: 1rem;
    font-weight: 600;
    color: var(--muted);
  }
  .best {
    margin: 6px 0 0;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }
  .freeze-chip {
    background: var(--blue-soft);
    color: var(--blue);
    padding: 2px 8px;
  }
  .week {
    list-style: none;
    margin: 0 0 12px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  .day {
    display: grid;
    justify-items: center;
    gap: 4px;
  }
  .dot {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 2px solid transparent;
    font-size: 0.85rem;
  }
  .done .dot {
    background: var(--red);
    color: var(--on-fill);
  }
  .done .dot svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .frozen .dot {
    background: var(--blue-soft);
    color: var(--blue);
  }
  .today:not(.done) .dot {
    background: var(--surface);
    border: 2px dashed var(--red);
  }
  .future .dot {
    background: transparent;
    border: 2px solid var(--line);
  }
  .lbl {
    font: 600 0.72rem/1 var(--font-head);
    color: var(--muted);
  }
  .today .lbl {
    color: var(--red);
    font-weight: 700;
  }
  .msg {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--radius-s);
    font-size: 0.92rem;
    font-weight: 600;
    line-height: 1.35;
    background: var(--surface-2);
  }
  .msg--ok {
    background: var(--green-soft);
    color: var(--green);
  }
  .msg--risk {
    background: var(--amber-soft);
    color: var(--amber);
  }
  .msg--freeze {
    background: var(--blue-soft);
    color: var(--blue);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .lit .flame {
      animation: flicker 2.8s ease-in-out infinite;
    }
    :global(html:not([data-motion='reduce'])) .done .dot {
      animation: pop var(--spring-pop-dur) var(--spring-pop) both;
    }
  }
  @keyframes flicker {
    0%,
    100% {
      transform: scale(1) rotate(0);
    }
    40% {
      transform: scale(1.06) rotate(-3deg);
    }
    70% {
      transform: scale(0.98) rotate(2deg);
    }
  }
</style>
