<script lang="ts">
  import type { Snippet } from 'svelte';
  import ProgressBar from './ProgressBar.svelte';

  let {
    mode, done, total, combo = 0, onexit, exitLabel = 'Выйти из урока',
    stageEl = $bindable(), children, footer, fullFooter = false,
  }: {
    mode: 'lesson' | 'practice';
    done: number;
    total: number;
    combo?: number;
    onexit: () => void;
    exitLabel?: string;
    stageEl?: HTMLElement;
    children: Snippet;
    footer: Snippet;
    fullFooter?: boolean;
  } = $props();
</script>

<div class="runner" data-testid="lesson" data-mode={mode}>
  <header class="top">
    <div class="top-in">
      <button class="x" type="button" aria-label={exitLabel} data-testid="exit" onclick={onexit}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
      <ProgressBar value={done} max={total} {combo} />
    </div>
  </header>

  <section class="stage" bind:this={stageEl} aria-label="Задание">
    {@render children()}
  </section>

  <footer class="foot">
    {#if fullFooter}
      {@render footer()}
    {:else}
      <div class="bar"><div class="bar-in">{@render footer()}</div></div>
    {/if}
  </footer>
</div>

<style>
  .runner {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
  }
  .top {
    position: sticky;
    top: 0;
    z-index: 5;
    background: var(--bg);
    padding: 16px var(--gutter) 8px;
    padding-top: max(16px, env(safe-area-inset-top));
  }
  .top-in {
    max-width: var(--page-max);
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .x {
    flex: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: -10px;
    border: 0;
    border-radius: 12px;
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .x:hover {
    background: var(--surface-2);
    color: var(--ink);
  }
  .x svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .stage {
    flex: 1;
    display: grid;
    width: 100%;
    max-width: var(--page-max);
    margin: 0 auto;
    padding: 12px var(--gutter) 28px;
    overflow-x: clip;
  }
  .foot {
    position: sticky;
    bottom: 0;
    z-index: 5;
  }
  .bar {
    background: var(--bg);
    border-top: 2px solid var(--line);
    padding: 16px var(--gutter) calc(16px + env(safe-area-inset-bottom));
  }
  .bar-in {
    max-width: var(--page-max);
    margin: 0 auto;
    display: flex;
    justify-content: flex-end;
  }
  .bar-in :global(.go) {
    width: 100%;
  }
  @media (min-width: 640px) {
    .bar-in :global(.go) {
      width: auto;
      min-width: 200px;
    }
  }
</style>
