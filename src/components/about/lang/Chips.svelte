<script lang="ts" generics="T extends string">
  /**
   * Группа взаимоисключающих кнопок-чипов (aria-pressed). Подписи поддерживают *удм.* разметку.
   * value — двусторонняя привязка.
   */
  import Rich from './Rich.svelte';
  let {
    options,
    value = $bindable(),
    label,
    small = false,
  }: {
    options: { id: T; label: string; disabled?: boolean }[];
    value: T;
    label: string;
    small?: boolean;
  } = $props();
</script>

<div class="chips" class:small role="group" aria-label={label}>
  {#each options as o (o.id)}
    <button type="button" class="chipbtn" aria-pressed={value === o.id} disabled={o.disabled} onclick={() => (value = o.id)}>
      <Rich text={o.label} />
    </button>
  {/each}
</div>

<style>
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chipbtn {
    appearance: none;
    min-height: 44px;
    padding: 8px 14px;
    border: 2px solid var(--line);
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font: 600 0.9rem/1.2 var(--font-text);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .small .chipbtn {
    min-height: 38px;
    padding: 6px 12px;
    font-size: 0.85rem;
  }
  .chipbtn:hover:not(:disabled) {
    border-color: var(--line-strong);
  }
  .chipbtn[aria-pressed='true'] {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .chipbtn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .chipbtn {
      transition:
        background-color var(--dur-fast) var(--ease-standard),
        border-color var(--dur-fast) var(--ease-standard),
        color var(--dur-fast) var(--ease-standard),
        transform var(--spring-snappy-dur) var(--spring-snappy);
    }
    :global(html:not([data-motion='reduce'])) .chipbtn:active:not(:disabled) {
      transform: scale(0.96);
      transition-duration: 60ms;
    }
  }
</style>
