<script lang="ts">
  import { course } from '$lib/course';
  import { href } from '$lib/router.svelte';

  const used = $derived(
    new Map(
      course.sources.map((s) => [s.id, course.lexicon.filter((i) => i.sources.some((r) => r.id === s.id)).length] as const),
    ),
  );

  const data = [
    {
      title: 'Словарь (38 842 леммы с переводами)',
      who: 'uniparser-grammar-udm — Т. Архангельский, М. Медведева, УдмФИЦ УрО РАН, Е. Кашкин',
      url: 'https://github.com/timarkh/uniparser-grammar-udm',
      license: 'MIT',
    },
    {
      title: 'Фразы с переводами (4 896 пар)',
      who: 'Tatoeba — участники проекта (больше всего удмуртских фраз добавили kalmez и Kartinapai)',
      url: 'https://tatoeba.org/ru/sentences/show_all_in/udm/rus',
      license: 'CC BY 2.0 FR',
    },
    {
      title: 'Значения, примеры, произношение (1 433 статьи)',
      who: 'Русский Викисловарь, выгрузка kaikki.org',
      url: 'https://ru.wiktionary.org/wiki/Категория:Удмуртский_язык',
      license: 'CC BY-SA 4.0',
    },
  ];

  const audio = {
    title: 'Озвучка фраз (синтез речи)',
    who: 'Meta MMS-TTS, модель facebook/mms-tts-udm. Каждая запись проверена обратным распознаванием (MMS ASR); записи с ошибками не используются',
    url: 'https://huggingface.co/facebook/mms-tts-udm',
    license: 'CC BY-NC 4.0 — только некоммерческое использование',
  };

  const tech = [
    { title: 'Шрифты Rubik и Nunito', who: 'Google Fonts', license: 'SIL Open Font License 1.1', url: 'https://fonts.google.com/' },
    { title: 'Svelte', who: 'Svelte contributors', license: 'MIT', url: 'https://svelte.dev/' },
    { title: 'canvas-confetti', who: 'Kiril Vatev', license: 'ISC', url: 'https://github.com/catdad/canvas-confetti' },
  ];
</script>

<section class="page credits">
  <h1>Источники и благодарности</h1>
  <p class="lead">
    Этот тренажёр сделан для группы студентов, которые учат удмуртский. Каждое удмуртское слово в уроках взято из
    источника — их список ниже. Спасибо всем, кто бережёт и описывает удмуртский язык.
  </p>

  <div class="card rules">
    <h2>Правила</h2>
    <ul>
      <li>Удмуртский текст в уроках — только из источников: словарей, учебников, Tatoeba. Машинный перевод не используется.</li>
      <li>У каждой фразы есть статус: <b>«ждёт проверки носителем»</b> или <b>«проверено»</b>. Черновики в уроки не попадают.</li>
      <li>Книги под авторским правом не копируются. По ним только сверяем факты языка и даём ссылки в разделе <a href={href('/library')}>«Материалы»</a>.</li>
      <li>Нашли ошибку? Напишите на <a href="https://github.com/depthd/udmurt/issues/new" target="_blank" rel="noopener">GitHub</a>.</li>
    </ul>
  </div>

  <h2>Источники уроков</h2>
  <ul class="list">
    {#each course.sources as s (s.id)}
      <li class="card">
        <p class="t">{#if s.url}<a href={s.url} target="_blank" rel="noopener">{s.title}</a>{:else}{s.title}{/if}</p>
        {#if s.author}<p class="muted">{s.author}</p>{/if}
        <p class="meta"><span class="chip">{s.license}</span>{#if used.get(s.id)}<span class="muted">· слов и фраз в уроках: {used.get(s.id)}</span>{/if}</p>
        {#if s.note}<p class="muted small">{s.note}</p>{/if}
      </li>
    {/each}
  </ul>

  <h2>Открытые данные в словаре</h2>
  <ul class="list">
    {#each data as s (s.title)}
      <li class="card">
        <p class="t"><a href={s.url} target="_blank" rel="noopener">{s.title}</a></p>
        <p class="muted">{s.who}</p>
        <p class="meta"><span class="chip">{s.license}</span></p>
      </li>
    {/each}
  </ul>

  <h2>Озвучка</h2>
  <ul class="list">
    <li class="card">
      <p class="t"><a href={audio.url} target="_blank" rel="noopener">{audio.title}</a></p>
      <p class="muted">{audio.who}</p>
      <p class="meta"><span class="chip">{audio.license}</span></p>
      <p class="muted small">Синтезированные записи помечены словом «синтез». Голос носителя лучше — если хотите записать фразы, напишите нам.</p>
    </li>
  </ul>

  <h2>Технологии</h2>
  <ul class="list">
    {#each tech as s (s.title)}
      <li class="card">
        <p class="t"><a href={s.url} target="_blank" rel="noopener">{s.title}</a></p>
        <p class="muted">{s.who}</p>
        <p class="meta"><span class="chip">{s.license}</span></p>
      </li>
    {/each}
  </ul>

  <p class="muted small foot">
    Код сайта открыт (лицензия MIT): <a href="https://github.com/depthd/udmurt" target="_blank" rel="noopener">github.com/depthd/udmurt</a>.
    Символ — восьмиконечная звезда с флага Удмуртии, маскот — лебедёнок Юсь.
  </p>
</section>

<style>
  .lead {
    font-size: 1.05rem;
  }
  h2 {
    font-size: 1.15rem;
    margin: 26px 0 10px;
  }
  .rules h2 {
    margin-top: 0;
  }
  .rules ul {
    margin: 0;
    padding-left: 20px;
    display: grid;
    gap: 6px;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  .list p {
    margin: 0 0 4px;
  }
  .t {
    font-weight: 700;
  }
  .meta {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    font-size: 0.85rem;
  }
  .small {
    font-size: 0.85rem;
  }
  .foot {
    margin-top: 24px;
  }
</style>
