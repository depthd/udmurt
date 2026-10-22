<script lang="ts">
  /**
   * Шпаргалка юнита: панель выезжает снизу. Нативный <dialog> даёт фокус-ловушку, Esc и подложку.
   * Markdown рендерится нашим безопасным рендером (HTML из контента экранируется).
   * Закрыть: крестик, Esc, тап по подложке или свайп вниз за «ручку».
   */
  import type { Unit } from '$lib/content/schema';
  import { personalize } from '$lib/course';
  import { renderMarkdown } from '$lib/markdown';
  import { prefs } from '$lib/prefs.svelte';

  let { unit, onclose }: { unit: Unit | null; onclose: () => void } = $props();

  let dlg: HTMLDialogElement | undefined = $state();
  let closing = $state(false);
  let drag = $state(0);
  let startY = $state<number | null>(null);

  const html = $derived(
    unit?.guide ? renderMarkdown(personalize(unit.guide), { headingShift: 1, strongLang: 'udm', strongClass: 'udm' }) : '',
  );

  $effect(() => {
    if (!dlg) return;
    if (unit && !dlg.open) {
      closing = false;
      drag = 0;
      dlg.showModal();
      dlg.querySelector<HTMLElement>('.body')?.scrollTo({ top: 0 });
    }
  });

  function close() {
    if (!dlg?.open || closing) return;
    if (prefs.reduceMotion) return finish();
    closing = true;
    setTimeout(finish, 220);
  }
  function finish() {
    closing = false;
    drag = 0;
    if (dlg?.open) dlg.close();
  }

  function oncancel(e: Event) {
    e.preventDefault();
    close();
  }
  function onclick(e: MouseEvent) {
    // Клик по самому <dialog> (вне .sheet) — это подложка.
    if (e.target === dlg) close();
  }

  function down(e: PointerEvent) {
    startY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (startY == null) return;
    drag = Math.max(0, e.clientY - startY);
  }
  function up() {
    if (startY == null) return;
    startY = null;
    if (drag > 90) close();
    else drag = 0;
  }
</script>

<dialog
  bind:this={dlg}
  class="guide"
  class:closing
  aria-labelledby="guide-title"
  data-testid="guide-sheet"
  {oncancel}
  {onclick}
  onclose={onclose}
>
  {#if unit}
    <div class="sheet" style:transform={drag ? `translateY(${drag}px)` : undefined} class:dragging={startY != null}>
      <div class="head" onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} role="presentation">
        <span class="handle" aria-hidden="true"></span>
        <div class="titles">
          <p class="eyebrow">Шпаргалка</p>
          <h2 id="guide-title">
            {unit.title}
            {#if unit.title_udm}<span class="udm sub" lang="udm">{unit.title_udm}</span>{/if}
          </h2>
        </div>
        <button type="button" class="close" aria-label="Закрыть шпаргалку" onclick={close}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div class="body md">
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- renderMarkdown экранирует весь ввод -->
        {@html html}
      </div>
    </div>
  {/if}
</dialog>

<style>
  .guide {
    position: fixed;
    inset: auto 0 0;
    margin: 0 auto;
    padding: 0;
    width: min(100%, 720px);
    max-width: 100%;
    max-height: min(88dvh, 900px);
    border: 0;
    background: transparent;
    color: var(--ink);
    overflow: visible;
  }
  .guide::backdrop {
    background: rgb(20 17 16 / 0.42);
  }
  .sheet {
    display: flex;
    flex-direction: column;
    max-height: min(88dvh, 900px);
    background: var(--surface);
    border-radius: var(--radius-l) var(--radius-l) 0 0;
    border: 2px solid var(--line);
    border-bottom: 0;
    box-shadow: var(--shadow);
  }
  .head {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 22px 14px 12px 20px;
    border-bottom: 2px solid var(--line);
    touch-action: none;
    cursor: grab;
  }
  .handle {
    position: absolute;
    top: 8px;
    left: 50%;
    width: 44px;
    height: 5px;
    margin-left: -22px;
    border-radius: 99px;
    background: var(--line-strong);
  }
  .titles {
    flex: 1;
    min-width: 0;
  }
  .eyebrow {
    margin: 0 0 2px;
    font: 700 0.75rem/1.2 var(--font-head);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--red);
  }
  h2 {
    margin: 0;
    font-size: 1.4rem;
  }
  .sub {
    margin-left: 6px;
    font-size: 1rem;
    color: var(--muted);
  }
  .close {
    flex: none;
    appearance: none;
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 0;
    background: var(--surface-2);
    color: var(--ink);
    cursor: pointer;
  }
  .close:hover {
    background: var(--line);
  }
  .close svg {
    fill: none;
    stroke: currentColor;
    stroke-width: 2.4;
    stroke-linecap: round;
  }
  .body {
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 6px 20px calc(28px + env(safe-area-inset-bottom));
  }

  /* Типографика шпаргалки */
  .md :global(h3) {
    margin: 22px 0 8px;
    font-size: 1.08rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .md :global(h3::before) {
    content: '';
    flex: none;
    width: 10px;
    height: 10px;
    background: var(--red);
    transform: rotate(45deg);
    border-radius: 2px;
  }
  .md :global(h4) {
    margin: 16px 0 6px;
    font-size: 1rem;
  }
  .md :global(p) {
    margin: 0 0 10px;
    line-height: 1.5;
  }
  .md :global(ul),
  .md :global(ol) {
    margin: 0 0 12px;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 6px;
  }
  .md :global(li) {
    position: relative;
    padding: 9px 12px 9px 14px;
    border-radius: var(--radius-s);
    background: var(--surface-2);
    line-height: 1.4;
  }
  .md :global(li::before) {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 3px;
    border-radius: 3px;
    background: var(--red);
  }
  .md :global(strong) {
    font-weight: 700;
  }
  .md :global(strong.udm) {
    font-family: var(--font-head);
    font-weight: 600;
    color: var(--red);
  }
  .md :global(code) {
    font-family: ui-monospace, monospace;
    font-size: 0.92em;
    padding: 1px 5px;
    border-radius: 6px;
    background: var(--surface-2);
  }

  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .guide[open] .sheet {
      animation: sheet-in var(--spring-soft-dur) var(--spring-soft);
    }
    :global(html:not([data-motion='reduce'])) .guide[open]::backdrop {
      animation: fade 200ms var(--ease-standard);
    }
    :global(html:not([data-motion='reduce'])) .guide.closing .sheet {
      animation: sheet-out 220ms var(--ease-exit) forwards;
    }
    :global(html:not([data-motion='reduce'])) .guide.closing::backdrop {
      animation: fade 220ms var(--ease-exit) reverse forwards;
    }
    :global(html:not([data-motion='reduce'])) .sheet:not(.dragging) {
      transition: transform 300ms var(--ease-enter);
    }
  }
  @keyframes sheet-in {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes sheet-out {
    to {
      transform: translateY(100%);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
</style>
