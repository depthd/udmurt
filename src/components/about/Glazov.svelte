<script lang="ts">
  /** «Наш город»: Глазов — название, Иднакар, первая столица, бесермяне рядом и спор о происхождении названия. */
  import Section from './Section.svelte';
  import Rich from './Rich.svelte';
  import { reveal } from './reveal';
  import { GLAZOV_FACTS, GLAZOV_SOURCES, NAME_VERSIONS } from '../../data/about/glazov';

</script>

<Section
  id="glazov"
  kicker="Наш город"
  title={'Глазов — {udm:Глаз кар}'}
  lead={'По-удмуртски Глазов — {udm:Глаз} или {udm:Глаз кар} ({udm:кар} — «город»); встречается и слитное {udm:Глазкар}. Город стоит на Чепце, в самом сердце северного наречия.'}
  sources={GLAZOV_SOURCES}
>
  <ul class="gf">
    {#each GLAZOV_FACTS as f, i (f.title)}
      <li class="g" use:reveal={{ delay: (i % 2) * 70 }}>
        <span class="big" lang={f.bigLang}>{f.big}</span>
        <span class="t">{f.title}</span>
        <span class="x"><Rich text={f.text} /></span>
      </li>
    {/each}
  </ul>

  <div class="debate" use:reveal>
    <h3>Откуда название? Спор версий</h3>
    <p class="muted dl">Единого ответа у исследователей нет — вот две главные точки зрения.</p>
    <div class="vs">
      {#each NAME_VERSIONS as v, i (v.who)}
        <div class="ver">
          <span class="n">Версия {i + 1}</span>
          <span class="who">{v.who}</span>
          <span class="claim"><Rich text={v.claim} /></span>
        </div>
        {#if i === 0}<span class="or" aria-hidden="true">или</span>{/if}
      {/each}
    </div>
    <p class="sum">
      Так что если вам скажут «Глазов — от слова <i>глаз</i>», можно улыбнуться и ответить: «Это одна из версий». Достоверно известно другое: впервые город упомянут в
      переписной книге 1678 года.
    </p>
  </div>
</Section>

<style>
  .gf {
    list-style: none;
    margin: 0 0 22px;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
  .g {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 14px;
    border-radius: var(--radius);
    background: var(--surface);
    border: 2px solid var(--line);
    min-width: 0;
  }
  .big {
    font: 800 1.45rem/1.1 var(--font-head);
    color: var(--red);
    overflow-wrap: break-word;
  }
  .t {
    font-weight: 700;
    line-height: 1.25;
  }
  .x {
    font-size: 0.86rem;
    line-height: 1.4;
    color: var(--muted);
  }
  @media (min-width: 640px) {
    .gf {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .debate {
    padding: 16px;
    border-radius: var(--radius-l);
    background: var(--surface-2);
  }
  .debate h3 {
    margin-bottom: 4px;
  }
  .dl {
    font-size: 0.9rem;
    margin-bottom: 12px;
  }
  .vs {
    display: grid;
    gap: 8px;
  }
  .or {
    justify-self: center;
    font: 700 0.75rem/1 var(--font-head);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .ver {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    width: 100%;
    padding: 14px 16px;
    border-radius: var(--radius);
    border: 2px solid var(--line);
    background: var(--surface);
    color: var(--ink);
  }
  .n {
    font: 700 0.75rem/1 var(--font-head);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--red);
  }
  .who {
    font-weight: 700;
  }
  .claim {
    font-size: 0.95rem;
  }
  .sum {
    margin: 14px 0 0;
    font-size: 0.95rem;
  }
  @media (min-width: 640px) {
    .vs {
      grid-template-columns: 1fr auto 1fr;
      align-items: stretch;
    }
    .or {
      align-self: center;
    }
  }
</style>
