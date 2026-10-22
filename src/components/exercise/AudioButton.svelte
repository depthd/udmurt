<script lang="ts">
  /**
   * Кнопка-динамик: проигрывает public/audio/<audio>.mp3 через playAudio().
   * Если аудио у слова нет — ничего не рендерит (кнопка-пустышка только путает).
   *   size  — sm (в строке), md (в карточке), lg (главная кнопка аудирования)
   *   rate  — 1 или 0.75 (медленно, иконка-черепаха)
   *   synth — аудио синтезировано: показываем пометку
   */
  import { playAudio } from '$lib/sfx';

  let {
    audio,
    size = 'md',
    rate = 1,
    synth = false,
    label,
    autoplay = false,
  }: {
    audio?: string;
    size?: 'sm' | 'md' | 'lg';
    rate?: number;
    synth?: boolean;
    label?: string;
    autoplay?: boolean;
  } = $props();

  const slow = $derived(rate < 1);
  const aria = $derived(label ?? (slow ? 'Прослушать медленно' : 'Прослушать'));
  let playing = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  function play() {
    if (!playAudio(audio, rate)) return;
    playing = true;
    clearTimeout(timer);
    timer = setTimeout(() => (playing = false), slow ? 1400 : 1000);
  }

  $effect(() => {
    if (autoplay && audio) {
      const t = setTimeout(play, 250);
      return () => clearTimeout(t);
    }
  });
  $effect(() => () => clearTimeout(timer));
</script>

{#if audio}
  <span class="wrap">
    <button type="button" class="audio audio--{size}" class:slow class:playing onclick={play} aria-label={aria} title={aria}>
      <span class="ring" aria-hidden="true"></span>
      {#if slow}
        <!-- черепаха -->
        <svg viewBox="0 0 32 32" aria-hidden="true" class="ico">
          <path d="M6 20c0-5.5 4.5-9 10-9s10 3.5 10 9H6Z" fill="currentColor" />
          <path d="M11 14.5l3 3m4-4v4m4.5-2.5-3 3" stroke="var(--btn-face)" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="27.5" cy="17" r="2.6" fill="currentColor" />
          <path d="M8.5 20.5v3M23 20.5v3" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" />
        </svg>
      {:else}
        <!-- динамик -->
        <svg viewBox="0 0 32 32" aria-hidden="true" class="ico">
          <path d="M5 12.5h4.5L16 7v18l-6.5-5.5H5a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1Z" fill="currentColor" />
          <path class="w1" d="M20 12.2a5 5 0 0 1 0 7.6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
          <path class="w2" d="M23.2 9a9.5 9.5 0 0 1 0 14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" />
        </svg>
      {/if}
    </button>
    {#if synth}<span class="synth" title="Голос синтезирован, не записан носителем">синтез</span>{/if}
  </span>
{/if}

<style>
  .wrap {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: none;
  }
  .audio {
    --btn-face: var(--blue);
    --btn-edge: color-mix(in srgb, var(--blue) 70%, #000);
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border: 0;
    border-radius: 14px;
    background: var(--btn-face);
    color: var(--on-fill);
    box-shadow: 0 4px 0 var(--btn-edge);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .audio:active {
    transform: translateY(4px);
    box-shadow: 0 0 0 var(--btn-edge);
  }
  .audio--sm {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    box-shadow: 0 3px 0 var(--btn-edge);
  }
  .audio--lg {
    width: 96px;
    height: 96px;
    border-radius: 28px;
    box-shadow: 0 6px 0 var(--btn-edge);
  }
  .audio--lg:active {
    transform: translateY(6px);
  }
  .slow {
    --btn-face: var(--surface);
    --btn-edge: var(--line);
    color: var(--blue);
    border: 2px solid var(--line);
  }
  .ico {
    width: 55%;
    height: 55%;
  }
  .slow .ico {
    width: 62%;
    height: 62%;
  }
  .ring {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
  }
  .synth {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .audio {
      transition:
        transform 600ms var(--ease-release),
        box-shadow 600ms var(--ease-release);
    }
    :global(html:not([data-motion='reduce'])) .audio:active {
      transition-duration: 34ms;
    }
    :global(html:not([data-motion='reduce'])) .playing .ring {
      animation: ring 1s var(--ease-standard) infinite;
    }
    :global(html:not([data-motion='reduce'])) .playing .w1 {
      animation: wave 0.5s ease-in-out infinite alternate;
    }
    :global(html:not([data-motion='reduce'])) .playing .w2 {
      animation: wave 0.5s 0.15s ease-in-out infinite alternate;
    }
  }
  @keyframes ring {
    from {
      box-shadow: 0 0 0 0 color-mix(in srgb, var(--blue) 45%, transparent);
    }
    to {
      box-shadow: 0 0 0 14px color-mix(in srgb, var(--blue) 0%, transparent);
    }
  }
  @keyframes wave {
    to {
      opacity: 0.35;
    }
  }
</style>
