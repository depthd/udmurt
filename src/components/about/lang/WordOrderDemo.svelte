<script lang="ts">
  /** Порядок слов SOV (перестановка с анимацией) и послелоги с местными падежами (сцена-SVG). */
  import { flip } from 'svelte/animate';
  import { prefs } from '$lib/prefs.svelte';
  import { POSTP_INFO, POSTPOSITIONS, WORD_ORDER } from '../../../data/lang/grammar';
  import Chips from './Chips.svelte';
  import Rich from './Rich.svelte';
  import Sources from './Sources.svelte';

  let order = $state<'udm' | 'ru'>('udm');
  const words = $derived(
    order === 'udm' ? WORD_ORDER.udm : WORD_ORDER.ruOrder.map((r) => WORD_ORDER.udm.find((w) => w.role === r)!),
  );
  const roleRu = { S: 'кто', O: 'что', V: 'делает' } as const;

  let pid = $state(POSTPOSITIONS[0].id);
  let dir = $state<'at' | 'to' | 'from'>('at');
  const pp = $derived(POSTPOSITIONS.find((p) => p.id === pid) ?? POSTPOSITIONS[0]);
  const form = $derived(pp.forms.find((f) => f.dir === dir) ?? pp.forms[0]);
  const up = $derived(pid === 'vyl');
</script>

<div class="wo">
  <h4>Глагол — в конце</h4>
  <div class="switch" role="group" aria-label="Порядок слов">
    <button type="button" aria-pressed={order === 'udm'} onclick={() => (order = 'udm')}>Как по-удмуртски</button>
    <button type="button" aria-pressed={order === 'ru'} onclick={() => (order = 'ru')}>Как по-русски</button>
  </div>
  <ol class="sent" aria-label={order === 'udm' ? 'Удмуртский порядок: подлежащее, дополнение, глагол' : 'Русский порядок: подлежащее, глагол, дополнение'}>
    {#each words as w (w.role)}
      <li class="w r-{w.role}" animate:flip={{ duration: prefs.reduceMotion ? 0 : 520 }}>
        <span class="role">{w.role} · {roleRu[w.role]}</span>
        <span class="u" lang="udm">{w.udm}</span>
        <span class="t">{w.ru}</span>
      </li>
    {/each}
  </ol>
  <p class="cap">
    {#if order === 'udm'}
      <span lang="udm" class="uu">Мон та книгаез лыдӟо.</span> — дословно «я эту книгу прочту».
    {:else}
      Так по-русски: «я прочту эту книгу». По-удмуртски глагол обычно уходит в конец.
    {/if}
  </p>
  <p class="note">{WORD_ORDER.note}</p>
  <Sources source={WORD_ORDER.source} />

  <h4>Послелоги вместо предлогов</h4>
  <p class="sum"><Rich text={POSTP_INFO.summary} /></p>
  <div class="ctrls">
    <Chips label="Послелог" options={POSTPOSITIONS.map((p) => ({ id: p.id, label: `*${p.root}* «${p.rootRu}»` }))} bind:value={pid} small />
    <Chips label="Вопрос" options={pp.forms.map((f) => ({ id: f.dir, label: f.q }))} bind:value={dir} small />
  </div>

  <div class="scene">
    <svg viewBox="0 0 240 130" role="img" aria-label="{form.udm} — {form.ru}">
      <line x1="10" y1="118" x2="230" y2="118" class="ground" />
      {#if up}
        <!-- стол -->
        <rect x="70" y="62" width="100" height="10" rx="4" class="obj" />
        <line x1="82" y1="72" x2="82" y2="118" class="leg" />
        <line x1="158" y1="72" x2="158" y2="118" class="leg" />
      {:else}
        <!-- дом на сваях -->
        <path d="M70 52 L120 22 L170 52 Z" class="roof" />
        <rect x="78" y="52" width="84" height="40" rx="3" class="obj" />
        <rect x="112" y="64" width="16" height="16" rx="2" class="win" />
        <line x1="84" y1="92" x2="84" y2="118" class="leg" />
        <line x1="156" y1="92" x2="156" y2="118" class="leg" />
      {/if}
      {#if dir !== 'at'}
        <path
          class="arrow"
          d={dir === 'to'
            ? up ? 'M28 40 C 60 20, 95 25, 112 46' : 'M20 108 C 50 108, 80 108, 106 106'
            : up ? 'M128 46 C 150 22, 185 20, 214 40' : 'M134 106 C 160 108, 190 108, 220 108'}
        />
      {/if}
      <circle class="ball pos-{pid}-{dir}" r="9" cx="0" cy="0" />
    </svg>
    <p class="ph" aria-hidden="true"><span lang="udm" class="uu">{form.udm}</span> — {form.ru}</p>
  </div>
  <p class="visually-hidden" role="status" aria-live="polite">{form.udm} — {form.ru}</p>
  <Sources source={[...pp.source, ...POSTP_INFO.source.slice(1)]} />
</div>

<style>
  .wo {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  h4 {
    margin: 4px 0 0;
    font-size: 1rem;
  }
  .switch {
    display: inline-flex;
    width: fit-content;
    max-width: 100%;
    padding: 4px;
    border-radius: 999px;
    background: var(--surface-2);
  }
  .switch button {
    appearance: none;
    min-height: 40px;
    padding: 6px 14px;
    border: 0;
    border-radius: 999px;
    background: transparent;
    font: 700 0.88rem/1.1 var(--font-head);
    color: var(--muted);
    cursor: pointer;
  }
  .switch button[aria-pressed='true'] {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 1px 0 var(--line-strong), 0 2px 8px rgb(0 0 0 / 0.08);
  }
  .sent {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .w {
    display: grid;
    gap: 2px;
    padding: 8px 12px;
    border-radius: var(--radius-s);
    border: 2px solid var(--line);
    background: var(--surface);
  }
  .r-S {
    border-color: var(--blue);
  }
  .r-O {
    border-color: var(--amber);
  }
  .r-V {
    border-color: var(--red);
    background: var(--red-soft);
  }
  .role {
    font: 700 0.7rem/1 var(--font-head);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .u {
    font: 700 1.15rem/1.2 var(--font-head);
  }
  .t {
    font-size: 0.85rem;
    color: var(--muted);
  }
  .cap,
  .note,
  .sum {
    margin: 0;
  }
  .note {
    font-size: 0.9rem;
    color: var(--muted);
  }
  .uu {
    font-family: var(--font-head);
    font-weight: 600;
  }
  .ctrls {
    display: grid;
    gap: 8px;
  }
  .scene {
    padding: 10px;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .scene svg {
    display: block;
    width: 100%;
    max-width: 360px;
    height: auto;
    margin: 0 auto;
    overflow: visible;
  }
  .ground {
    stroke: var(--line-strong);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 10 12;
  }
  .obj {
    fill: var(--surface);
    stroke: var(--ink);
    stroke-width: 2.5;
  }
  .roof {
    fill: var(--red-soft);
    stroke: var(--red);
    stroke-width: 2.5;
    stroke-linejoin: round;
  }
  .win {
    fill: var(--blue-soft);
    stroke: var(--ink);
    stroke-width: 1.5;
  }
  .leg {
    stroke: var(--ink);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .arrow {
    fill: none;
    stroke: var(--red);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-dasharray: 8 8;
  }
  .ball {
    fill: var(--red);
    transform: translate(120px, 53px);
  }
  /* выл «верх»: на столе / на стол / со стола */
  .pos-vyl-at,
  .pos-vyl-to {
    transform: translate(120px, 53px);
  }
  .pos-vyl-from {
    transform: translate(214px, 46px);
  }
  /* ул «низ»: под домом / под дом / из-под дома */
  .pos-ul-at,
  .pos-ul-to {
    transform: translate(120px, 108px);
  }
  .pos-ul-from {
    transform: translate(222px, 108px);
  }
  .ph {
    margin: 6px 0 0;
    text-align: center;
  }
  @keyframes fly-to-vyl {
    from {
      transform: translate(28px, 40px);
    }
  }
  @keyframes fly-from-vyl {
    from {
      transform: translate(120px, 53px);
    }
  }
  @keyframes fly-to-ul {
    from {
      transform: translate(20px, 108px);
    }
  }
  @keyframes fly-from-ul {
    from {
      transform: translate(120px, 108px);
    }
  }
  @keyframes dash {
    to {
      stroke-dashoffset: -32;
    }
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .ball {
      transition: transform var(--spring-soft-dur) var(--spring-soft);
    }
    :global(html:not([data-motion='reduce'])) .pos-vyl-to {
      animation: fly-to-vyl 700ms var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .pos-vyl-from {
      animation: fly-from-vyl 700ms var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .pos-ul-to {
      animation: fly-to-ul 700ms var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .pos-ul-from {
      animation: fly-from-ul 700ms var(--spring-soft) both;
    }
    :global(html:not([data-motion='reduce'])) .arrow {
      animation: dash 1.2s linear 2;
    }
    :global(html:not([data-motion='reduce'])) .switch button {
      transition:
        background-color var(--dur-fast),
        color var(--dur-fast),
        box-shadow var(--dur-fast);
    }
  }
</style>
