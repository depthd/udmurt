<script lang="ts">
  /**
   * Ряд кнопок с удмуртскими буквами над полем ввода: ӝ ӟ ӥ ӧ ӵ (с Shift — заглавные).
   * Вставляет букву в позицию курсора в `target` и генерирует событие input.
   * Контракт props менять нельзя — используется в упражнении «type» и в поиске словаря.
   */
  import { sfx, haptic } from '$lib/sfx';

  let { target, oninsert }: { target?: HTMLInputElement | HTMLTextAreaElement | null; oninsert?: (ch: string) => void } = $props();
  let upper = $state(false);
  const letters = ['ӝ', 'ӟ', 'ӥ', 'ӧ', 'ӵ'];

  function insert(ch: string) {
    const c = upper ? ch.toUpperCase() : ch;
    sfx.tap();
    haptic.tap();
    if (target && !target.readOnly && !target.disabled) {
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
    <button
      type="button"
      class="key"
      lang="udm"
      onmousedown={(e) => e.preventDefault()}
      onclick={() => insert(l)}
      aria-label="Вставить букву {upper ? l.toUpperCase() : l}"
      data-testid="udm-key-{l}"
    >
      {upper ? l.toUpperCase() : l}
    </button>
  {/each}
  <button
    type="button"
    class="key shift"
    class:on={upper}
    aria-pressed={upper}
    onmousedown={(e) => e.preventDefault()}
    onclick={() => (upper = !upper)}
    aria-label="Заглавная буква"
  >
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 4 4 12.5h4.5V20h7v-7.5H20z" /></svg>
  </button>
</div>

<style>
  .udm-kb {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .key {
    display: inline-grid;
    place-items: center;
    min-width: 48px;
    height: 48px;
    padding: 0 10px;
    border: 2px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 3px 0 var(--line);
    font: 600 1.25rem/1 var(--font-head);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }
  .key:hover {
    border-color: var(--line-strong);
    box-shadow: 0 3px 0 var(--line-strong);
  }
  .key:active {
    transform: translateY(3px);
    box-shadow: 0 0 0 var(--line);
  }
  .shift svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linejoin: round;
  }
  .shift.on {
    border-color: var(--focus);
    background: var(--blue-soft);
    color: var(--focus);
    box-shadow: 0 3px 0 var(--focus);
  }
  .shift.on svg {
    fill: currentColor;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .key {
      transition:
        transform 120ms var(--ease-release),
        box-shadow 120ms var(--ease-release),
        border-color var(--dur-fast),
        background-color var(--dur-fast);
    }
    :global(html:not([data-motion='reduce'])) .key:active {
      transition-duration: 34ms;
    }
  }
</style>
