<script lang="ts">
  // ЗАГЛУШКА упражнения «Teach» — реализуется в фазе сборки. Контракт: src/exercises/types.ts
  import type { ExerciseProps } from './types';
  let { ex, locked, api }: ExerciseProps = $props();
  $effect(() => {
    api.setReady(true);
    api.setChecker(() => ({ correct: true, expected: '', grades: {} }));
  });
</script>

<div class="stub">{ex.type} {locked ? '✓' : ''}</div>
