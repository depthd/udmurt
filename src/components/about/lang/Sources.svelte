<script lang="ts">
  /** Строка «Источники: …» под карточкой. Внешние ссылки открываются в новой вкладке. */
  import type { Source } from '../../../data/lang/sources';
  let { source, compact = false }: { source: Source[]; compact?: boolean } = $props();
</script>

<p class="src" class:compact>
  <span class="lbl">{source.length > 1 ? 'Источники' : 'Источник'}:</span>
  {#each source as s, i (i)}{#if i > 0}<span class="sep" aria-hidden="true"> · </span>{/if}{#if s.url}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>{:else}<span>{s.title}</span>{/if}{/each}
</p>

<style>
  .src {
    margin: 12px 0 0;
    font-size: 0.8rem;
    line-height: 1.45;
    color: var(--muted);
    overflow-wrap: anywhere;
  }
  .compact {
    margin-top: 4px;
    font-size: 0.75rem;
  }
  .lbl {
    font-weight: 700;
  }
  a {
    color: var(--muted);
    text-decoration-color: var(--line-strong);
  }
  a:hover {
    color: var(--blue);
  }
</style>
