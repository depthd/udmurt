<script lang="ts">
  /**
   * Build — собрать слово из морфем: ним + -ы → нимы.
   * Кубики = морфемы слова + обманки (extra). Суффиксы — с дефисом и синим цветом.
   * Над лотком собранное слово показывается «склеенным» со стежками-швами между морфемами;
   * после проверки под каждым кубиком появляется его значение.
   * Оценка SRS: верно — 3, неверно — 1.
   */
  import type { Exercise } from '$lib/content/schema';
  import type { AnswerResult, ExerciseProps } from './types';
  import { item, personalize } from '$lib/course';
  import PromptBubble from '../components/exercise/PromptBubble.svelte';
  import PieceBoard from '../components/exercise2/PieceBoard.svelte';
  import { buildIsCorrect, glue, morphPieces, spaceBefore } from '../components/exercise2/logic';

  let { ex, locked, api }: ExerciseProps<Extract<Exercise, { type: 'build' }>> = $props();

  const it = $derived(item(ex.item));
  const udm = $derived(personalize(it.udm));
  const ru = $derived(personalize(it.ru));
  const morphemes = $derived(it.morphemes.map((m) => ({ ...m, form: personalize(m.form) })));
  const pieces = $derived(
    morphPieces(
      morphemes,
      ex.extra.map((x) => personalize(x)),
      udm,
      `${ex.id ?? ''}|build|${ex.item}`,
    ),
  );

  let chosen = $state<number[]>([]);
  let verdict = $state<'correct' | 'wrong' | null>(null);
  const parts = $derived(chosen.map((i) => pieces[i]));
  const glued = $derived(glue(parts));

  function check(): AnswerResult {
    const ok = buildIsCorrect(parts, morphemes.length ? morphemes : [{ form: udm, kind: 'root' as const }]);
    verdict = ok ? 'correct' : 'wrong';
    return {
      correct: ok,
      expected: udm,
      meaning: `${udm} — ${ru}`,
      grades: { [it.id]: ok ? 3 : 1 },
    };
  }

  $effect(() => api.setReady(chosen.length > 0));
  $effect(() => api.setChecker(check));
</script>

<div class="build">
  <PromptBubble audio={it.audio} synth={it.audio_synth} audioLabel="Прослушать слово">
    <span lang="ru">«{ru}»</span>
  </PromptBubble>

  <div
    class="preview"
    class:is-empty={!parts.length}
    class:ok={locked && verdict === 'correct'}
    class:bad={locked && verdict === 'wrong'}
    aria-hidden="true"
    data-testid="build-word"
  >
    {#if parts.length}
      <span class="glued udm" lang="udm"
        >{#each parts as p, k (p.key)}{#if spaceBefore(parts, k)}<span class="space"> </span>{:else if k > 0}<span class="seam"
            ></span>{/if}<span class="m m--{p.kind}">{p.text}</span>{/each}</span
      >
    {:else}
      <span class="hint">Нажимайте на кубики по порядку</span>
    {/if}
  </div>
  <p class="visually-hidden" role="status">{glued ? `Слово: ${glued}` : ''}</p>

  <PieceBoard
    {pieces}
    bind:chosen
    {locked}
    verdict={locked ? verdict : null}
    lang="udm"
    variant="morphs"
    notes={locked}
    bankTestId={(i) => `morph-${i}`}
    answerTestId={(i) => `morph-answer-${i}`}
    answerLabel="Собранное слово"
    bankLabel="Морфемы: корни и суффиксы"
  />

  <p class="legend muted" aria-hidden="true">
    <span class="sw sw--root"></span> корень <span class="sw sw--suffix"></span> суффикс
  </p>
</div>

<style>
  .build {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  /* ─── склеенное слово ─── */
  .preview {
    display: grid;
    place-items: center;
    min-height: 64px;
    padding: 4px 12px;
    text-align: center;
  }
  .glued {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    justify-content: center;
    font-size: clamp(1.9rem, 1.5rem + 2vw, 2.4rem);
    line-height: 1.2;
    font-weight: 600;
    letter-spacing: 0.01em;
    padding-bottom: 6px;
    border-bottom: 3px solid var(--line);
  }
  .m--suffix {
    color: var(--blue);
  }
  .m--particle {
    color: var(--amber);
  }
  /* шов между морфемами — красный стежок */
  .seam {
    align-self: stretch;
    width: 0;
    margin: 0.12em 0.06em;
    border-left: 2px dashed var(--red);
    opacity: 0.75;
  }
  .space {
    width: 0.35em;
  }
  .hint {
    color: var(--muted);
    font-size: 0.95rem;
  }
  .ok .glued {
    border-bottom-color: var(--green);
  }
  .ok .m {
    color: var(--green);
  }
  .bad .glued {
    border-bottom-color: var(--red);
  }

  .legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin: 0;
    font-size: 0.82rem;
  }
  .sw {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 2px solid var(--line-strong);
    background: var(--surface);
  }
  .sw--suffix {
    margin-left: 10px;
    border-color: color-mix(in srgb, var(--blue) 55%, var(--line));
    background: var(--blue-soft);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .m {
      display: inline-block;
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .seam {
      animation: fade-in var(--dur-base) var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .ok .glued {
      animation: pop var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .bad .glued {
      animation: shake 400ms var(--ease-standard);
    }
  }
</style>
