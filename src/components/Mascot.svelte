<script lang="ts">
  /**
   * Маскот «Юсь» — лебедёнок (отчёт 04 §5.7). ЗАГЛУШКА: полноценный SVG с анимациями
   * делается в фазе сборки. Контракт props менять нельзя — его используют другие экраны.
   */
  export type Mood = 'idle' | 'happy' | 'sad' | 'celebrate' | 'think' | 'wave';
  let { mood = 'idle', size = 120, label = 'Юсь, лебедёнок-помощник' }: { mood?: Mood; size?: number; label?: string } = $props();
</script>

<div class="mascot" style:width="{size}px" style:height="{size}px" role="img" aria-label={label} data-mood={mood}>
  <svg viewBox="0 0 100 100" width={size} height={size}><circle cx="50" cy="55" r="34" fill="var(--surface)" stroke="var(--line)" stroke-width="3" /></svg>
</div>
