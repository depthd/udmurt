<script lang="ts">
  import type { Src } from '../../data/about/types';
  let { items }: { items: Src[] } = $props();
  // Убираем повторы (один источник может прийти из нескольких списков).
  const list = $derived(items.filter((s, i) => items.findIndex((x) => x.label === s.label) === i));
</script>

<p class="src">
  <span class="h">Источники:</span>
  {#each list as s, i (s.label)}
    {#if s.url}<a href={s.url} target="_blank" rel="noopener">{s.label}<span class="visually-hidden"> (откроется в новой вкладке)</span></a>{:else}<span>{s.label}</span>{/if}{i < list.length - 1 ? '; ' : '.'}
  {/each}
</p>

<style>
  .src {
    margin: 20px 0 0;
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .h {
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  a {
    color: var(--muted);
    text-decoration-color: color-mix(in srgb, var(--muted) 45%, transparent);
  }
  a:hover {
    color: var(--blue);
  }
</style>
