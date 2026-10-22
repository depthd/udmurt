<script lang="ts">
  /**
   * ЗАГЛУШКА. Проигрыватель последовательности упражнений (используется уроком и повторением).
   * Контракт props (менять нельзя):
   *   runId      — id урока или 'practice-…' (для статистики)
   *   title      — заголовок (для экрана итогов)
   *   exercises  — список упражнений
   *   mode       — 'lesson' | 'practice'
   *   onfinish   — вызывается с итогом, когда ученик прошёл все задания (до экрана итогов)
   *   onexit     — выход по крестику / после экрана итогов
   */
  import type { Exercise } from '$lib/content/schema';
  import type { LessonResult } from '$lib/progress.svelte';
  let {
    runId,
    title,
    exercises,
    mode = 'lesson',
    onfinish,
    onexit,
  }: {
    runId: string;
    title: string;
    exercises: Exercise[];
    mode?: 'lesson' | 'practice';
    onfinish?: (r: LessonResult) => void;
    onexit: () => void;
  } = $props();
</script>

<div class="page"><h1>{title}</h1><p>{exercises.length} заданий ({mode}, {runId})</p><button class="btn" onclick={onexit}>Выйти</button></div>
