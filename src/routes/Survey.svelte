<script lang="ts">
  import { item } from '$lib/course';
  import { calendarMonths, ordinalDay, seasons } from '$lib/classroom';
  import { href } from '$lib/router.svelte';

  let month = $state(11);
  let day = $state(3);
  let season = $state(2);
  let report = $state(false);
  const birthdayQuestion = $derived(item(report ? 'ask-other-birthday' : 'ask-birthday'));
  const seasonQuestion = $derived(item(report ? 'ask-other-season' : 'ask-season'));
  const date = $derived(ordinalDay(day) + ' ' + calendarMonths[month].when);
  function changeMonth(value: number) {
    month = value;
    day = Math.min(day, calendarMonths[month].days);
  }
</script>
<section class="page sheet">
  <h1>Шпаргалка для опроса</h1>
  <p>В каждой паре задайте друг другу два вопроса. Запишите по-удмуртски имя, дату рождения и любимое время года. Поменяйте собеседника.</p>
  <div class="switch" aria-label="Чей ответ">
    <button class="btn btn--sm" class:btn--ghost={report} aria-pressed={!report} onclick={() => report = false}>В паре</button>
    <button class="btn btn--sm" class:btn--ghost={!report} aria-pressed={report} onclick={() => report = true}>Рассказ об Анне</button>
  </div>
  <section class="card">
    <h2 lang="udm">{birthdayQuestion.udm}</h2><p class="muted">{birthdayQuestion.ru}</p>
    <div class="fields">
      <label>Число
        <select bind:value={day}>
          {#each Array.from({length: calendarMonths[month].days}, (_, i) => i + 1) as d}<option value={d}>{d}</option>{/each}
        </select>
      </label>
      <label>Месяц
        <select value={month} onchange={(e) => changeMonth(Number(e.currentTarget.value))}>
          {#each calendarMonths as m, i}<option value={i}>{item(m.id).ru} · {item(m.id).udm}</option>{/each}
        </select>
      </label>
    </div>
    <p class="model" lang="udm" aria-live="polite">{report ? 'Анналэн вордскем нуналыз' : 'Мынам вордскем нуналы'} {date}.</p>
  </section>
  <section class="card">
    <h2 lang="udm">{seasonQuestion.udm}</h2><p class="muted">{seasonQuestion.ru}</p>
    <label>Время года
      <select bind:value={season}>
        {#each seasons as s, i}<option value={i}>{item(s.id).ru} · {item(s.id).udm}</option>{/each}
      </select>
    </label>
    <p class="model" lang="udm" aria-live="polite">{report ? 'Анна' : 'Мон'} тужгес но {seasons[season].object} {report ? 'яратэ' : 'яратӥсько'}.</p>
  </section>
  <a class="btn btn--flat" href={href('/practice')}>К повторению</a>
</section>
<style>
  .sheet { max-width: 740px; }
  .card { padding: 20px; margin: 16px 0; }
  h2 { font-size: 1.25rem; margin: 0; }
  .muted { margin: 4px 0 14px; }
  .switch, .fields { display: flex; gap: 10px; flex-wrap: wrap; }
  label { display: grid; gap: 4px; width: fit-content; max-width: 100%; font-size: .9rem; }
  select { font: inherit; color: var(--ink); background: var(--surface); border: 2px solid var(--line); border-radius: 10px; padding: 8px; }
  .model { margin: 16px 0 0; font: 650 1.15rem var(--font-head); }
</style>
