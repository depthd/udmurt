<script lang="ts">
  /** Обёртка раздела: заголовок, лид, содержимое, строка «Источники». */
  import type { Snippet } from 'svelte';
  import type { Src } from '../../data/about/types';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';
  import { reveal } from './reveal';

  let {
    id,
    kicker,
    title,
    lead,
    sources = [],
    children,
  }: { id: string; kicker?: string; title: string; lead?: string; sources?: Src[]; children: Snippet } = $props();
</script>

<section {id} class="ab-sec" aria-labelledby="{id}-title" tabindex="-1">
  <header class="head" use:reveal>
    {#if kicker}
      <p class="kicker"><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true"><path d="M5 0 10 5 5 10 0 5z" /></svg>{kicker}</p>
    {/if}
    <h2 id="{id}-title"><Rich text={title} /></h2>
    {#if lead}<p class="lead"><Rich text={lead} /></p>{/if}
  </header>
  {@render children()}
  {#if sources.length}<Sources items={sources} />{/if}
</section>

<style>
  .head {
    margin-bottom: 20px;
  }
  .kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font: 700 0.78rem/1 var(--font-head);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--red);
  }
  .kicker path {
    fill: currentColor;
  }
  h2 {
    margin-bottom: 10px;
    text-wrap: balance;
  }
  .lead {
    font-size: 1.12rem;
    line-height: 1.5;
    margin: 0;
    text-wrap: pretty;
  }
</style>
