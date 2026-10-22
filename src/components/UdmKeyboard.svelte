<script lang="ts">
  /**
   * Ряд кнопок с удмуртскими буквами над полем ввода: ӝ ӟ ӥ ӧ ӵ (с Shift — заглавные).
   * Вставляет букву в позицию курсора в `target` и генерирует событие input.
   * Контракт props менять нельзя — используется в упражнении «type» и в поиске словаря.
   */
  let { target, oninsert }: { target?: HTMLInputElement | HTMLTextAreaElement | null; oninsert?: (ch: string) => void } = $props();
  let upper = $state(false);
  const letters = ['ӝ', 'ӟ', 'ӥ', 'ӧ', 'ӵ'];

  function insert(ch: string) {
    const c = upper ? ch.toUpperCase() : ch;
    if (target) {
      const start = target.selectionStart ?? target.value.length;
      const end = target.selectionEnd ?? start;
      target.setRangeText(c, start, end, 'end');
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.focus();
    }
    oninsert?.(c);
    upper = false;
  }
</script>

<div class="udm-kb" role="group" aria-label="Удмуртские буквы">
  {#each letters as l (l)}
    <button type="button" class="key" lang="udm" onmousedown={(e) => e.preventDefault()} onclick={() => insert(l)} aria-label="Вставить букву {upper ? l.toUpperCase() : l}">
      {upper ? l.toUpperCase() : l}
    </button>
  {/each}
  <button type="button" class="key shift" class:on={upper} aria-pressed={upper} onmousedown={(e) => e.preventDefault()} onclick={() => (upper = !upper)} aria-label="Заглавная буква">⇧</button>
</div>

<style>
  .udm-kb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .key {
    min-width: 44px;
    height: 44px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 3px 0 var(--line);
    font: 600 1.15rem/1 var(--font-head);
    cursor: pointer;
  }
  .key:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--line);
  }
  .shift.on {
    border-color: var(--focus);
    box-shadow: 0 3px 0 var(--focus);
  }
</style>
