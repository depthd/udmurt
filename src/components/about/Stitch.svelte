<script lang="ts">
  /** Разделитель-«вышивка»: строчка стежков и три ромба. Вышивается, когда попадает в экран. */
  import { inview } from './reveal';
  let shown = $state(false);
</script>

<div class="stitch" class:shown use:inview={() => (shown = true)} aria-hidden="true">
  <svg viewBox="0 0 240 24" width="240" height="24">
    <path class="ln l" d="M6 12 H92" pathLength="1" />
    <path class="ln r" d="M148 12 H234" pathLength="1" />
    <path class="dm d1" d="M98 12 L104 6 L110 12 L104 18 Z" />
    <path class="dm d2" d="M112 12 L120 4 L128 12 L120 20 Z" />
    <path class="dm d3" d="M130 12 L136 6 L142 12 L136 18 Z" />
  </svg>
</div>

<style>
  .stitch {
    display: flex;
    justify-content: center;
    margin: 56px 0;
  }
  svg {
    display: block;
    overflow: visible;
    max-width: 100%;
  }
  .ln {
    fill: none;
    stroke: var(--red);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 0.045 0.035;
    opacity: 0.75;
    transform-box: fill-box;
  }
  .l {
    transform-origin: right center;
  }
  .r {
    transform-origin: left center;
  }
  .dm {
    fill: none;
    stroke: var(--red);
    stroke-width: 2;
    stroke-linejoin: round;
    transform-box: fill-box;
    transform-origin: center;
  }
  .d2 {
    fill: var(--red);
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .stitch:not(.shown) .ln {
      scale: 0 1;
    }
    :global(html:not([data-motion='reduce'])) .ln {
      transition: scale 900ms var(--ease-enter) 140ms;
    }
    :global(html:not([data-motion='reduce'])) .stitch:not(.shown) .dm {
      scale: 0;
      rotate: -90deg;
    }
    :global(html:not([data-motion='reduce'])) .dm {
      transition:
        scale var(--spring-pop-dur) var(--spring-pop),
        rotate var(--spring-pop-dur) var(--spring-pop);
    }
    :global(html:not([data-motion='reduce'])) .d1 {
      transition-delay: 90ms;
    }
    :global(html:not([data-motion='reduce'])) .d3 {
      transition-delay: 180ms;
    }
  }
</style>
