<script lang="ts">
  /**
   * Маскот «Юсь» — белый лебедёнок с вышитым красным воротничком (отчёт 04 §5.7).
   * Лебедь на гербе Удмуртии — символ возрождения; герб не копируем, рисуем своего персонажа.
   * Контракт props менять нельзя — его используют другие экраны.
   */
  export type Mood = 'idle' | 'happy' | 'sad' | 'celebrate' | 'think' | 'wave';
  let { mood = 'idle', size = 120, label = 'Юсь, лебедёнок-помощник' }: { mood?: Mood; size?: number; label?: string } = $props();

  const closedEyes = $derived(mood === 'happy' || mood === 'celebrate');
</script>

<div class="mascot m-{mood}" style:width="{size}px" style:height="{size}px" role="img" aria-label={label}>
  <svg viewBox="0 0 120 120" width={size} height={size} aria-hidden="true">
    <!-- тень -->
    <ellipse class="shadow" cx="60" cy="112" rx="30" ry="5" />
    <g class="body-wrap">
      <!-- крыло дальнее -->
      <g class="wing wing-back">
        <path d="M30 70 C14 64 10 50 16 42 C24 48 32 56 38 66 Z" class="feather" />
      </g>
      <!-- тело -->
      <path class="feather" d="M60 44 C84 44 98 62 96 80 C94 98 78 108 60 108 C42 108 26 98 24 80 C22 62 36 44 60 44 Z" />
      <!-- пушок на груди -->
      <path class="fluff" d="M46 90 q6 6 14 6 q8 0 14 -6" />
      <!-- вышитый воротничок -->
      <g class="collar">
        <path d="M38 62 Q60 74 82 62 L84 68 Q60 82 36 68 Z" class="collar-band" />
        <g class="stitch">
          <path d="M44 67 l3 -3 l3 3 l-3 3 z" />
          <path d="M54 70 l3 -3 l3 3 l-3 3 z" />
          <path d="M64 70 l3 -3 l3 3 l-3 3 z" />
          <path d="M74 67 l3 -3 l3 3 l-3 3 z" />
        </g>
      </g>
      <!-- крыло ближнее (машет в wave/celebrate, у клюва в think) -->
      <g class="wing wing-front">
        <path d="M86 70 C104 62 110 48 104 40 C96 46 88 56 82 66 Z" class="feather" />
      </g>
      <!-- голова -->
      <g class="head">
        <circle cx="60" cy="34" r="22" class="feather" />
        <!-- хохолок -->
        <path class="feather" d="M56 13 q4 -9 10 -4 q-6 1 -6 6 z" />
        <!-- щёчки -->
        <ellipse cx="44" cy="40" rx="4.5" ry="3" class="cheek" />
        <ellipse cx="76" cy="40" rx="4.5" ry="3" class="cheek" />
        <!-- глаза -->
        {#if closedEyes}
          <path class="eye-closed" d="M45 33 q5 -5 10 0" />
          <path class="eye-closed" d="M65 33 q5 -5 10 0" />
        {:else}
          <g class="eyes" class:sad={mood === 'sad'}>
            <ellipse cx="50" cy="32" rx="4" ry="5" class="eye" />
            <ellipse cx="70" cy="32" rx="4" ry="5" class="eye" />
            <circle cx="51.4" cy="30.2" r="1.4" class="glint" />
            <circle cx="71.4" cy="30.2" r="1.4" class="glint" />
          </g>
          {#if mood === 'sad'}
            <path class="brow" d="M44 27 l9 -3" />
            <path class="brow" d="M76 27 l-9 -3" />
          {/if}
        {/if}
        <!-- клюв -->
        <g class="beak">
          <path d="M53 40 Q60 36 67 40 Q63 47 60 47 Q57 47 53 40 Z" class="beak-top" />
          {#if mood === 'happy' || mood === 'celebrate' || mood === 'wave'}
            <path d="M55 42 Q60 50 65 42" class="beak-open" />
          {/if}
        </g>
      </g>
      {#if mood === 'sad'}
        <path class="tear" d="M78 38 q3 5 0 7 q-3 -2 0 -7 z" />
      {/if}
    </g>
    {#if mood === 'think'}
      <g class="dots">
        <circle cx="94" cy="20" r="3" />
        <circle cx="103" cy="12" r="3.6" />
        <circle cx="113" cy="5" r="4.2" />
      </g>
    {/if}
    {#if mood === 'celebrate'}
      <g class="sparks">
        <polygon class="spark s1" points="18,10 24,16 12,16 20,10 20,22 12,12 24,12 16,22" transform="translate(-4 -2) scale(.9)" />
        <polygon class="spark s2" points="18,10 24,16 12,16 20,10 20,22 12,12 24,12 16,22" transform="translate(84 2) scale(.8)" />
        <polygon class="spark s3" points="18,10 24,16 12,16 20,10 20,22 12,12 24,12 16,22" transform="translate(88 40) scale(.6)" />
      </g>
    {/if}
  </svg>
</div>

<style>
  .mascot {
    display: inline-block;
    flex: none;
    line-height: 0;
  }
  svg {
    overflow: visible;
  }
  .shadow {
    fill: var(--ink);
    opacity: 0.08;
  }
  .feather {
    fill: #fffdf8;
    stroke: #d9cfc2;
    stroke-width: 2.2;
    stroke-linejoin: round;
  }
  :global(:root[data-theme='dark']) .feather {
    fill: #f6f1e8;
    stroke: #9b9187;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) .feather {
      fill: #f6f1e8;
      stroke: #9b9187;
    }
  }
  .fluff {
    fill: none;
    stroke: #e6ddd1;
    stroke-width: 2;
    stroke-linecap: round;
  }
  .collar-band {
    fill: var(--flag-red, #dd2211);
  }
  .stitch path {
    fill: #fffdf8;
  }
  .cheek {
    fill: #f6a9a0;
    opacity: 0.6;
  }
  .eye {
    fill: #1f1a17;
  }
  .glint {
    fill: #fff;
  }
  .eye-closed,
  .brow {
    fill: none;
    stroke: #1f1a17;
    stroke-width: 2.6;
    stroke-linecap: round;
  }
  .beak-top {
    fill: #f2a33a;
    stroke: #c97a16;
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
  .beak-open {
    fill: #c2410c;
  }
  .tear {
    fill: #8ec1f0;
  }
  .dots circle {
    fill: var(--line-strong, #cfc6ba);
  }
  .spark {
    fill: var(--flag-red, #dd2211);
  }

  .wing,
  .head,
  .body-wrap {
    transform-box: fill-box;
  }
  .wing-front {
    transform-origin: 0% 100%;
  }
  .wing-back {
    transform-origin: 100% 100%;
  }
  .head {
    transform-origin: 50% 100%;
  }
  .body-wrap {
    transform-origin: 50% 100%;
  }
  .m-sad .head {
    transform: rotate(-6deg) translateY(3px);
  }
  .m-think .wing-front {
    transform: rotate(-38deg) translate(-6px, -6px);
  }
  .m-think .head {
    transform: rotate(5deg);
  }
  .m-celebrate .wing-front {
    transform: rotate(-24deg);
  }
  .m-celebrate .wing-back {
    transform: rotate(24deg);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .wing,
    :global(html:not([data-motion='reduce'])) .head {
      transition: transform 400ms var(--ease-overshoot, cubic-bezier(0.3, 0.7, 0.4, 1.5));
    }
    :global(html:not([data-motion='reduce'])) .m-idle .body-wrap {
      animation: breathe 3.2s ease-in-out infinite;
    }
    :global(html:not([data-motion='reduce'])) .m-idle .eyes {
      animation: blink 5s infinite;
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }
    :global(html:not([data-motion='reduce'])) .m-happy .body-wrap {
      animation: hop 900ms var(--ease-standard) infinite;
    }
    :global(html:not([data-motion='reduce'])) .m-celebrate .body-wrap {
      animation: jump 700ms cubic-bezier(0.3, 0.7, 0.4, 1) infinite alternate;
    }
    :global(html:not([data-motion='reduce'])) .m-celebrate .wing-front {
      animation: flap-f 350ms ease-in-out infinite alternate;
    }
    :global(html:not([data-motion='reduce'])) .m-celebrate .wing-back {
      animation: flap-b 350ms ease-in-out infinite alternate;
    }
    :global(html:not([data-motion='reduce'])) .m-wave .wing-front {
      animation: wave 1.1s ease-in-out infinite;
    }
    :global(html:not([data-motion='reduce'])) .m-think .dots circle {
      animation: dot 1.4s ease-in-out infinite;
    }
    :global(html:not([data-motion='reduce'])) .m-think .dots circle:nth-child(2) {
      animation-delay: 0.2s;
    }
    :global(html:not([data-motion='reduce'])) .m-think .dots circle:nth-child(3) {
      animation-delay: 0.4s;
    }
    :global(html:not([data-motion='reduce'])) .m-sad .tear {
      animation: drip 2.2s ease-in infinite;
    }
    :global(html:not([data-motion='reduce'])) .spark {
      animation: twinkle 1s ease-in-out infinite;
      transform-box: fill-box;
      transform-origin: 50% 50%;
    }
    :global(html:not([data-motion='reduce'])) .s2 {
      animation-delay: 0.3s;
    }
    :global(html:not([data-motion='reduce'])) .s3 {
      animation-delay: 0.6s;
    }
  }
  @keyframes breathe {
    50% {
      transform: scale(1.025, 0.985);
    }
  }
  @keyframes blink {
    0%,
    92%,
    100% {
      transform: scaleY(1);
    }
    95% {
      transform: scaleY(0.1);
    }
  }
  @keyframes hop {
    0%,
    60%,
    100% {
      transform: translateY(0);
    }
    30% {
      transform: translateY(-6px);
    }
  }
  @keyframes jump {
    from {
      transform: translateY(0) scale(1.02, 0.98);
    }
    to {
      transform: translateY(-10px) scale(0.98, 1.02);
    }
  }
  @keyframes flap-f {
    from {
      transform: rotate(-10deg);
    }
    to {
      transform: rotate(-40deg);
    }
  }
  @keyframes flap-b {
    from {
      transform: rotate(10deg);
    }
    to {
      transform: rotate(36deg);
    }
  }
  @keyframes wave {
    0%,
    100% {
      transform: rotate(0);
    }
    25% {
      transform: rotate(-34deg);
    }
    50% {
      transform: rotate(-12deg);
    }
    75% {
      transform: rotate(-34deg);
    }
  }
  @keyframes dot {
    0%,
    100% {
      opacity: 0.3;
    }
    50% {
      opacity: 1;
    }
  }
  @keyframes drip {
    0% {
      transform: translateY(0);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: translateY(12px);
      opacity: 0;
    }
  }
  @keyframes twinkle {
    0%,
    100% {
      transform: scale(0.7) rotate(0);
      opacity: 0.6;
    }
    50% {
      transform: scale(1.1) rotate(20deg);
      opacity: 1;
    }
  }
</style>
