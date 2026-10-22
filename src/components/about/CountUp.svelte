<script lang="ts">
  /** Число, которое «досчитывается» до значения, когда появляется на экране. */
  import { prefs } from '$lib/prefs.svelte';
  import { inview } from './reveal';

  let { value, from = 0, plain = false, duration = 1400 }: { value: number; from?: number; plain?: boolean; duration?: number } = $props();

  let current = $state<number | null>(null);
  const shown = $derived(current ?? (prefs.reduceMotion ? value : from));
  const fmt = (n: number) => (plain ? String(n) : n.toLocaleString('ru-RU'));

  let raf = 0;
  function start() {
    if (prefs.reduceMotion) {
      current = value;
      return;
    }
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const e = 1 - Math.pow(1 - k, 4);
      current = Math.round(from + (value - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  $effect(() => () => cancelAnimationFrame(raf));
</script>

<span class="cu" use:inview={start} aria-hidden="true">{fmt(shown)}</span><span class="visually-hidden">{fmt(value)}</span>

<style>
  .cu {
    font-variant-numeric: tabular-nums;
  }
</style>
