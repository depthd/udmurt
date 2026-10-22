<script lang="ts">
  /**
   * Вопрос упражнения в «пузыре» рядом с маленьким маскотом-эмодзи (как реплика персонажа у Duolingo).
   *   avatar — эмодзи персонажа: 🦢 Юсь (по умолчанию), 🥟 Пельнянь — для аудирования
   *   audio  — аудио вопроса: слева от текста появится кнопка-динамик (если аудио нет — не появится)
   */
  import type { Snippet } from 'svelte';
  import AudioButton from './AudioButton.svelte';

  let {
    avatar = '🦢',
    children,
    audio,
    synth = false,
    audioLabel,
    big = false,
  }: {
    avatar?: string;
    children: Snippet;
    audio?: string;
    synth?: boolean;
    audioLabel?: string;
    /** Крупный текст — для коротких фраз-вопросов. */
    big?: boolean;
  } = $props();
</script>

<div class="prompt">
  <span class="avatar" aria-hidden="true">{avatar}</span>
  <div class="bubble" class:big>
    {#if audio}<span class="aside"><AudioButton {audio} {synth} size="sm" label={audioLabel} /></span>{/if}
    <div class="text">{@render children()}</div>
  </div>
</div>

<style>
  .prompt {
    display: flex;
    align-items: flex-end;
    gap: 14px;
    min-width: 0;
  }
  .avatar {
    flex: none;
    display: grid;
    place-items: center;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: var(--surface-2);
    font-size: 32px;
    line-height: 1;
  }
  .bubble {
    position: relative;
    flex: 1 1 auto;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 60px;
    padding: 12px 18px;
    border: 2px solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
    transform-origin: 0 100%;
  }
  /* хвостик пузыря к маскоту */
  .bubble::before {
    content: '';
    position: absolute;
    left: -9px;
    bottom: 18px;
    width: 14px;
    height: 14px;
    background: var(--surface);
    border-left: 2px solid var(--line);
    border-bottom: 2px solid var(--line);
    transform: rotate(45deg);
    border-bottom-left-radius: 3px;
  }
  .aside {
    flex: none;
    display: inline-flex;
  }
  .text {
    min-width: 0;
    font: 600 1.15rem/1.35 var(--font-head);
    overflow-wrap: anywhere;
  }
  .big .text {
    font-size: clamp(1.3rem, 1.1rem + 1.2vw, 1.6rem);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .bubble {
      animation: bubble-in var(--spring-pop-dur) var(--spring-pop) both;
      animation-delay: 60ms;
    }
    :global(html:not([data-motion='reduce'])) .avatar {
      animation: avatar-in var(--spring-soft-dur) var(--spring-soft) both;
    }
  }
  @keyframes bubble-in {
    from {
      opacity: 0;
      transform: scale(0.85);
    }
    30% {
      opacity: 1;
    }
  }
  @keyframes avatar-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.8);
    }
  }
</style>
