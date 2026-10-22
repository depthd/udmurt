<script lang="ts">
  /** «Слово дня»: детерминированно по дате из словника (только проверенные/с источником, не draft). */
  import { course, personalize } from '$lib/course';
  import { dayKey } from '$lib/dates';
  import { href } from '$lib/router.svelte';
  import AudioButton from '../exercise/AudioButton.svelte';

  /** FNV-1a: одна и та же дата → одно и то же слово у всей группы. */
  function hash(s: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  const pool = course.lexicon.filter((i) => i.status !== 'draft' && i.kind !== 'pattern');
  const it = pool.length ? pool[hash(dayKey()) % pool.length] : undefined;
  const udm = it ? personalize(it.udm) : '';
  const query = udm.replace(/[!?.,…«»"]+/g, '').trim();
</script>

{#if it}
  <article class="card wod" aria-labelledby="wod-title" data-testid="word-of-day">
    <div class="head">
      <h2 id="wod-title" class="eyebrow">Слово дня</h2>
      {#if it.status === 'verified'}
        <span class="chip ok" title="Проверено носителем или преподавателем">✓ проверено</span>
      {/if}
    </div>
    <div class="body">
      {#if it.emoji}<span class="emoji" aria-hidden="true">{it.emoji}</span>{/if}
      <div class="words">
        <p class="udm word" lang="udm">{udm}</p>
        <p class="ru">{personalize(it.ru)}</p>
      </div>
      <AudioButton audio={it.audio} synth={it.audio_synth} size="md" label="Послушать «{udm}»" />
    </div>
    {#if it.note}
      <p class="note muted">{personalize(it.note)}</p>
    {/if}
    {#if it.morphemes.length > 1}
      <p class="morph" aria-label="Разбор слова">
        {#each it.morphemes as m, i (i)}
          <span class="m m--{m.kind}"><b lang="udm">{m.form}</b><small>{m.meaning}</small></span>
        {/each}
      </p>
    {/if}
    {#if query}
      <a class="more" href={href('/dict/' + encodeURIComponent(query))}>Найти в словаре →</a>
    {/if}
  </article>
{/if}

<style>
  .wod {
    padding: 14px 16px 12px;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 8px;
  }
  .eyebrow {
    margin: 0;
    font: 700 0.75rem/1.2 var(--font-head);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--red);
  }
  .ok {
    background: var(--green-soft);
    color: var(--green);
    font-size: 0.75rem;
  }
  .body {
    display: flex;
    align-items: center;
    gap: 14px;
  }
  .emoji {
    flex: none;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 30px;
  }
  .words {
    flex: 1;
    min-width: 0;
  }
  .word {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .ru {
    margin: 2px 0 0;
    color: var(--muted);
  }
  .note {
    margin: 10px 0 0;
    font-size: 0.92rem;
    line-height: 1.4;
  }
  .morph {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin: 10px 0 0;
  }
  .m {
    display: inline-grid;
    gap: 2px;
    padding: 6px 10px;
    border-radius: var(--radius-s);
    background: var(--surface-2);
    border-bottom: 3px solid var(--red);
  }
  .m--suffix,
  .m--particle {
    border-bottom-color: var(--blue);
  }
  .m b {
    font: 600 1rem/1 var(--font-head);
  }
  .m small {
    font-size: 0.72rem;
    color: var(--muted);
    line-height: 1.2;
  }
  .more {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: 4px;
    font-weight: 700;
    text-decoration: none;
  }
  .more:hover {
    text-decoration: underline;
  }
</style>
