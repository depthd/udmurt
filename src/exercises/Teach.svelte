<script lang="ts">
  /**
   * Teach — карточка нового слова: крупно слово, картинка-эмодзи, динамик (если есть аудио),
   * перевод, разбор по морфемам и пояснение. Не проверяется и НЕ ставит оценку SRS
   * (это знакомство, а не извлечение из памяти): оболочка сразу показывает «Продолжить».
   */
  import type { Exercise } from '$lib/content/schema';
  import type { ExerciseProps } from './types';
  import { item, personalize, sources } from '$lib/course';
  import { normalize } from '$lib/answer';
  import { prefs } from '$lib/prefs.svelte';
  import AudioButton from '../components/exercise/AudioButton.svelte';
  import MorphemeBreakdown from '../components/exercise/MorphemeBreakdown.svelte';

  let { ex, api }: ExerciseProps<Extract<Exercise, { type: 'teach' }>> = $props();

  const it = $derived(item(ex.item));
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  /** Другие переводы — без тех, что отличаются от основного только регистром/пунктуацией. */
  const alts = $derived.by(() => {
    const seen = new Set([normalize(ru)]);
    return it.ru_alt.map(personalize).filter((a) => !seen.has(normalize(a)) && seen.add(normalize(a)));
  });
  const kindLabel = $derived(it.kind === 'phrase' ? 'фраза' : it.kind === 'pattern' ? 'образец' : (it.pos ?? 'слово'));
  /** Разбор показываем, если он включён в настройках; иначе — по кнопке. */
  let openMorph = $state(false);
  const showMorph = $derived(prefs.value.morphemes || openMorph);

  const sourceText = $derived.by(() => {
    const s = it.sources[0] && sources.get(it.sources[0].id);
    const title = s ? s.title.split(' — ')[0] : '';
    const short = title.length > 38 ? title.slice(0, 36).trimEnd() + '…' : title;
    return short;
  });

  $effect(() => {
    const result = { correct: true, expected: udm, meaning: ru, grades: {} };
    api.setReady(true);
    api.setChecker(() => result);
  });
</script>

<article class="teach" data-testid="teach-card" aria-label="Новое слово: {udm} — {ru}">
  <div class="top">
    <span class="badge">
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 0.8 9.9 6.1 15.2 8 9.9 9.9 8 15.2 6.1 9.9 0.8 8 6.1 6.1Z" fill="currentColor" /></svg>
      Новое слово
    </span>
    <span class="kind">{kindLabel}</span>
  </div>

  {#if it.emoji}
    <div class="pic" aria-hidden="true"><span>{it.emoji}</span></div>
  {/if}

  <div class="word-row">
    <AudioButton audio={it.audio} synth={it.audio_synth} autoplay={prefs.value.sound} label="Прослушать «{udm}»" />
    <p class="word udm" lang="udm">{udm}</p>
  </div>
  <p class="ru">{ru}</p>
  {#if alts.length}
    <p class="alt">также: {alts.join(' · ')}</p>
  {/if}

  {#if it.morphemes.length}
    <svg class="stitch" aria-hidden="true" height="4" width="100%"><line x1="3" y1="2" x2="100%" y2="2" /></svg>
    {#if showMorph}
      <MorphemeBreakdown morphemes={it.morphemes} />
    {:else}
      <button type="button" class="btn btn--flat btn--sm" onclick={() => (openMorph = true)}>Показать разбор слова</button>
    {/if}
  {/if}

  {#if it.note}
    <p class="note"><span class="bulb" aria-hidden="true">💡</span><span>{personalize(it.note)}</span></p>
  {/if}

  {#if sourceText}
    <p class="src">
      {#if it.status === 'verified'}
        <span class="ok">✓ проверено носителем</span> · {sourceText}
      {:else}
        Источник: {sourceText} · ждёт проверки носителем
      {/if}
    </p>
  {/if}
</article>

<style>
  .teach {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 16px 16px 14px;
    border: 2px solid var(--line);
    border-radius: var(--radius-l);
    background: var(--surface);
    box-shadow: var(--shadow);
    text-align: center;
  }
  .top {
    align-self: stretch;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px 5px 10px;
    border-radius: 999px;
    background: var(--red-soft);
    color: var(--red);
    font: 700 0.75rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
  .badge svg {
    width: 12px;
    height: 12px;
  }
  .kind {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
  }
  .pic {
    display: grid;
    place-items: center;
    width: 88px;
    height: 88px;
    margin: 0 0 4px;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 48px;
    line-height: 1;
  }
  .word-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    max-width: 100%;
  }
  .word {
    margin: 0;
    font: 700 clamp(2rem, 1.6rem + 2vw, 2.6rem) / 1.15 var(--font-head);
    letter-spacing: -0.01em;
    overflow-wrap: anywhere;
    color: var(--ink);
  }
  .ru {
    margin: 2px 0 0;
    font: 500 1.2rem/1.35 var(--font-text);
    color: var(--muted);
  }
  .alt {
    margin: 0;
    font-size: 0.85rem;
    color: var(--muted);
  }
  /* «стежок» красной нитью */
  .stitch {
    display: block;
    align-self: stretch;
    width: auto;
    height: 4px;
    margin: 10px 8px 8px;
    overflow: visible;
  }
  .stitch line {
    stroke: var(--red);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 10 12;
    opacity: 0.55;
  }
  .note {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    align-self: stretch;
    margin: 12px 0 0;
    padding: 10px 14px;
    border-radius: var(--radius);
    background: var(--surface-2);
    font-size: 0.93rem;
    line-height: 1.45;
    text-align: left;
  }
  .bulb {
    flex: none;
    font-size: 1.1rem;
    line-height: 1.3;
  }
  .src {
    margin: 10px 0 0;
    font-size: 0.75rem;
    color: var(--muted);
  }
  .ok {
    color: var(--green);
    font-weight: 700;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .teach {
      animation: rise var(--dur-slow) var(--ease-enter) both;
    }
    :global(html:not([data-motion='reduce'])) .pic span {
      display: inline-block;
      animation: pic-pop var(--spring-pop-dur) var(--spring-pop) 120ms both;
    }
    :global(html:not([data-motion='reduce'])) .word-row,
    :global(html:not([data-motion='reduce'])) .ru {
      animation: rise var(--dur-slow) var(--ease-enter) 180ms both;
    }
    :global(html:not([data-motion='reduce'])) .note {
      animation: rise var(--dur-slow) var(--ease-enter) 420ms both;
    }
  }
  @keyframes pic-pop {
    from {
      opacity: 0;
      transform: scale(0.4) rotate(-12deg);
    }
    30% {
      opacity: 1;
    }
  }
</style>
