<script lang="ts">
  /** Текст с размеченными иноязычными словами: {udm:ву} → <span lang="udm">ву</span>. */
  import { parseRich } from '../../data/about/rich';
  let { text }: { text: string } = $props();
  const segs = $derived(parseRich(text));
</script>

{#each segs as s, i (i)}{#if s.lang}<span lang={s.lang} class={s.lang === 'udm' ? 'w-udm' : 'w-for'}>{s.t}</span>{:else}{s.t}{/if}{/each}

<style>
  .w-udm {
    font-family: var(--font-head);
    font-weight: 600;
    color: var(--ab-udm, var(--red));
    white-space: nowrap;
  }
  .w-for {
    font-style: italic;
  }
</style>
