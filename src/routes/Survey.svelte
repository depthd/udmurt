<script lang="ts">
  import { item } from '$lib/course';
  import { calendarMonths, cardinalDay, ordinalDay, seasons } from '$lib/classroom';
  import { href } from '$lib/router.svelte';

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const columns = [days.slice(0, 10), days.slice(10, 20), days.slice(20)];
  const fromDecember = [calendarMonths[11], ...calendarMonths.slice(0, 11)];
</script>

<article class="board">
  <header><h1>Шпаргалка для опроса</h1><a href={href('/practice')}>К занятию</a></header>
  <section aria-label="Разговор в паре" class="models">
    <div class="card">
      <h2 lang="udm">{item('ask-birthday').udm}</h2>
      <p class="translation">{item('ask-birthday').ru}</p>
      <p lang="udm">Мынам вордскем нуналы <strong>{item('date-dec3').udm}</strong>.</p>
    </div>
    <div class="card">
      <h2 lang="udm">{item('ask-season').udm}</h2>
      <p class="translation">{item('ask-season').ru}</p>
      <p lang="udm">Мон тужгес но <strong>{seasons[2].object}</strong> яратӥсько.</p>
    </div>
  </section>
  <div class="reference">
    <section class="card numbers"><h2>Числительные от 1 до 31</h2>
      <div class="columns">
        {#each columns as col}
          <table aria-label={'Числа ' + col[0] + '–' + col[col.length - 1]}>
            <thead><tr><th>№</th><th>Сколько?</th><th>В дате</th></tr></thead>
            <tbody>{#each col as d}<tr data-day={d}><th scope="row">{d}</th><td lang="udm">{cardinalDay(d)}</td><td lang="udm">{ordinalDay(d)}</td></tr>{/each}</tbody>
          </table>
        {/each}
      </div>
    </section>
    <section class="card seasons"><h2>Сезоны и месяцы в дате</h2>
      {#each seasons as season, i}
        <section class="season" data-season={season.id}>
          <h3><span>{item(season.id).ru} · <span lang="udm">{item(season.id).udm}</span></span> <small>люблю — <b lang="udm">{season.object}</b></small></h3>
          {#each fromDecember.slice(i * 3, i * 3 + 3) as m}
            <div class="month"><span>{item(m.id).ru}</span><b lang="udm">{m.when}</b></div>
          {/each}
        </section>
      {/each}
    </section>
  </div>
  <section class="report" aria-label="Ответ преподавателю">
    <h2>Что узнали об Анне?</h2>
    <div>{#each [['ask-other-birthday','other-birthday'],['ask-other-season','other-season']] as [q,a]}
      <p><span lang="udm">{item(q).udm}</span><br/><b lang="udm">{item(a).udm}</b></p>
    {/each}</div>
  </section>
</article>
<style>
  .board { max-width: 1880px; margin: 0 auto; padding: clamp(12px, 1.6vw, 26px); font-size: clamp(1rem, 1.28vw, 1.5rem); line-height: 1.28; }
  header, h3 { display: flex; align-items: baseline; justify-content: space-between; gap: .6em; }
  header { margin-bottom: .55em; }
  h1 { margin: 0; font-size: 1.55em; }
  header a { color: var(--muted); white-space: nowrap; }
  h2, h3, p { margin: 0; }
  h2 { font-size: 1.1em; margin-bottom: .3em; }
  .models, .report > div { display: grid; grid-template-columns: 1fr 1fr; gap: .75em; }
  .card { padding: .65em .85em; }
  .models p { margin-top: .2em; }
  .translation { color: var(--muted); font-size: .9em; }
  .models strong { background: var(--amber-soft); padding: 0 .1em; }
  .reference { display: grid; grid-template-columns: minmax(0, 2.8fr) minmax(0, 1fr); gap: .75em; margin: .65em 0; }
  .columns { display: grid; grid-template-columns: .85fr 1.06fr 1.15fr; gap: .65em; align-items: start; }
  table { width: 100%; border-collapse: collapse; }
  th, td { text-align: left; padding: .32em .12em; line-height: 1.15; border-bottom: 1px solid var(--line); }
  thead th { color: var(--muted); font-size: .83em; }
  tbody td:last-child { font-weight: 700; }
  .season + .season { border-top: 1px solid var(--line); margin-top: .24em; padding-top: .2em; }
  h3 { font-size: 1em; flex-wrap: wrap; gap: 0 .4em; }
  h3 small { font-size: .85em; font-weight: 400; }
  .month { display: grid; grid-template-columns: minmax(5.2em, .8fr) 1.2fr; gap: .35em; }
  .report { padding: .2em .45em; }
  @media (max-width: 1050px) { .reference { grid-template-columns: 1fr; } .seasons { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5em; } .seasons h2 { grid-column: 1/-1; } .season + .season { border: 0; margin: 0; padding: 0; } .month { display: flex; flex-wrap: wrap; gap: 0 .3em; } }
  @media (min-width: 701px) and (max-width: 1050px) {
    .board { padding: 12px; }
    th, td { padding-block: .19em; }
    .season h3 { display: block; }
    .season h3 small { display: block; }
    .seasons { row-gap: .1em; }
  }
  @media (max-width: 700px) { .models, .report > div, .columns { grid-template-columns: 1fr; } .seasons { grid-template-columns: 1fr 1fr; } .numbers table { table-layout: fixed; } .numbers th:first-child { width: 2.1em; } }
  @media (min-width: 701px) and (max-width: 1050px) and (max-height: 700px) {
    .board { font-size: .9rem; padding: 8px; }
    header { margin-bottom: .25em; }
    .card { padding: .4em .65em; }
    .reference { margin: .4em 0; gap: .4em; }
    th, td { padding-block: .1em; }
  }
  @media print { header a { display: none; } .board { font-size: 10pt; } .card { break-inside: avoid; } }
</style>
