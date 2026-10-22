<script lang="ts">
  /**
   * Подтверждение выхода из урока. Нативный <dialog>: фокус внутри, Escape = «остаться».
   */
  import Mascot from '../Mascot.svelte';

  let { open, onstay, onleave }: { open: boolean; onstay: () => void; onleave: () => void } = $props();

  let dlg = $state<HTMLDialogElement>();
  let stayBtn = $state<HTMLButtonElement>();

  $effect(() => {
    const d = dlg;
    if (!d) return;
    if (open && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
      stayBtn?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  });

  function cancel(e: Event) {
    e.preventDefault();
    onstay();
  }
  function backdrop(e: MouseEvent) {
    if (e.target === dlg) onstay();
  }
</script>

<dialog
  bind:this={dlg}
  class="confirm"
  aria-labelledby="exit-title"
  aria-describedby="exit-text"
  oncancel={cancel}
  onclick={backdrop}
  data-testid="exit-confirm"
>
  <div class="box">
    <Mascot mood="sad" size={88} />
    <h2 id="exit-title">Уже уходите?</h2>
    <p id="exit-text" class="muted">Если выйти сейчас, прогресс этого урока не сохранится.</p>
    <div class="actions">
      <button bind:this={stayBtn} class="btn btn--ink btn--block" type="button" onclick={onstay} data-testid="exit-stay">
        Продолжить урок
      </button>
      <button class="btn btn--flat btn--block leave" type="button" onclick={onleave} data-testid="exit-leave">
        Выйти
      </button>
    </div>
  </div>
</dialog>

<style>
  .confirm {
    border: 0;
    padding: 0;
    margin: auto auto 0;
    width: 100%;
    max-width: 480px;
    max-height: 100dvh;
    background: transparent;
    color: var(--ink);
  }
  .confirm::backdrop {
    background: rgb(20 17 16 / 0.45);
  }
  .box {
    background: var(--surface);
    border-radius: var(--radius-l) var(--radius-l) 0 0;
    padding: 24px var(--gutter) calc(20px + env(safe-area-inset-bottom));
    display: grid;
    justify-items: center;
    text-align: center;
    box-shadow: var(--shadow);
  }
  h2 {
    margin: 10px 0 6px;
  }
  p {
    margin: 0 0 18px;
    max-width: 32ch;
  }
  .actions {
    display: grid;
    gap: 8px;
    width: 100%;
  }
  .leave {
    --fg: var(--red);
  }
  @media (min-width: 560px) {
    .confirm {
      margin: auto;
    }
    .box {
      border-radius: var(--radius-l);
      padding-bottom: 20px;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .confirm[open] .box {
      animation: rise var(--spring-soft-dur) var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .confirm[open]::backdrop {
      animation: fade-in var(--dur-fast) var(--ease-standard) both;
    }
  }
</style>
