<script lang="ts">
  /** Восьмиконечная звезда с флага Удмуртии (геометрия по официальному описанию, отчёт 04 §5.1). */
  let { size = 24, color = 'var(--flag-red, #dd2211)', spin = false }: { size?: number; color?: string; spin?: boolean } = $props();
</script>

<svg class:spin width={size} height={size} viewBox="0 0 150 150" aria-hidden="true">
  <polygon points="50,0 150,100 0,100 100,0 100,150 0,50 150,50 50,150" fill={color} />
</svg>

<style>
  svg {
    flex: none;
    display: block;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .spin {
      animation: spin 12s linear infinite;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
