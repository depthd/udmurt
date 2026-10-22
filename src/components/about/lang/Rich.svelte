<script lang="ts">
  /** Текст с мини-разметкой: *удмуртское* (lang="udm") и _иноязычное_ (курсив). */
  import { parseRich } from '../../../data/lang/rich';
  let { text }: { text: string } = $props();
  const parts = $derived(parseRich(text));
</script>

{#each parts as p, i (i)}{#if p.kind === 'udm'}<span lang="udm" class="udm-w">{p.text}</span>{:else if p.kind === 'foreign'}<i class="fw">{p.text}</i>{:else}{p.text}{/if}{/each}

<style>
  .udm-w {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .fw {
    font-style: italic;
  }
</style>
