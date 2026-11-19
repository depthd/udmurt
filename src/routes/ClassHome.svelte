<script lang="ts">
  import { classLessonPath, classLessons } from '$lib/classroom';
  import { href } from '$lib/router.svelte';

  const steps = [
    { path: '/practice/body', label: 'Повторение частей тела', minutes: 4 },
    ...classLessons.map(({ id, label, minutes }) => ({ path: classLessonPath(id), label, minutes })),
  ];
</script>

<section class="page plan">
  <header>
    <h1>Материалы к занятию</h1>
    <p class="muted">День рождения и любимое время года · около 37 минут</p>
  </header>

  <nav aria-label="Этапы занятия">
    <ol>
      {#each steps as step}
        <li>
          <a class="card step" href={href(step.path)}>
            <span>{step.label}</span><small>{step.minutes} мин</small>
          </a>
        </li>
      {/each}
    </ol>
  </nav>

  <section class="card pairs">
    <h2>Опрос в парах</h2>
    <p>За 9 минут каждый опрашивает трёх одногруппников и записывает их ответы. Затем отведите 5 минут на рассказ об одном из собеседников.</p>
    <a class="btn btn--ink" href={href('/class/survey')}>Открыть шпаргалку на проекторе</a>
  </section>

  <section class="materials">
    <h2>Для подготовки</h2>
    <ul>
      <li><a href="{import.meta.env.BASE_URL}class/survey-sheet.pdf">Лист для опроса · PDF, 1 лист на студента</a></li>
      <li><a href="https://github.com/depthd/udmurt/releases/tag/untagged-1b21156c05b7811348fc">Сценарий преподавателя · Word в GitHub</a></li>
      <li><a href={href(classLessonPath('u10-body'))}>Полный урок «Части тела»</a></li>
    </ul>
  </section>
</section>

<style>
  .plan { padding-bottom: 28px; }
  header p { margin: 0 0 20px; }
  h1 { margin-bottom: 4px; }
  h2 { font-size: 1.2rem; }
  ol, ul { list-style: none; margin: 0; padding: 0; }
  ol { display: grid; gap: 8px; }
  .step { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; text-decoration: none; color: var(--ink); font: 700 1.08rem/1.35 var(--font-head); box-shadow: 0 3px 0 var(--line); }
  .step:hover { border-color: var(--line-strong); }
  small { color: var(--muted); font: 500 .93rem var(--font-text); white-space: nowrap; }
  .pairs { margin: 18px 0; }
  .pairs p { margin: 0 0 12px; }
  .btn { text-align: center; line-height: 1.25; }
  .materials li + li { margin-top: 5px; }
</style>
