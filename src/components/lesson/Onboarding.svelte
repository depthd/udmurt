<script lang="ts">
  /**
   * Знакомство после первого урока (PLAN.md: «сначала дело, потом регистрация»):
   * 1) «Как вас зовут?» — имя подставляется в фразы уроков ({name});
   * 2) «Обещание» — 7 / 14 / 30 дней подряд. Оба шага можно пропустить.
   */
  import Mascot from '../Mascot.svelte';
  import { progress } from '$lib/progress.svelte';
  import { plural } from '$lib/lesson';
  import { sfx, haptic } from '$lib/sfx';
  import { lexicon } from '$lib/course';

  let { ondone }: { ondone: () => void } = $props();

  let step = $state<'name' | 'commit'>('name');
  let name = $state(progress.data.name);
  let days = $state<number | null>(null);
  let input = $state<HTMLInputElement>();
  let heading = $state<HTMLHeadingElement>();

  // Удмуртские фразы — только из словника (у каждой есть источник)
  const ask = lexicon.get('kyzy-tilad-nimdy');
  const hello = lexicon.get('zechbures');
  const me = lexicon.get('mon-name');
  const fill = (s: string, n: string) => s.replaceAll('{name}', n || 'Алёна');

  const clean = $derived(name.trim().replace(/\s+/g, ' ').slice(0, 40));
  const options = [
    { d: 7, label: 'Неделя', hint: 'Лёгкий старт' },
    { d: 14, label: 'Две недели', hint: 'Привычка закрепится' },
    { d: 30, label: 'Месяц', hint: 'Серьёзный настрой' },
  ];

  $effect(() => {
    if (step === 'name') input?.focus();
    else heading?.focus();
  });

  function finish() {
    progress.data.onboarded = true;
    progress.save();
    ondone();
  }

  function saveName(e?: Event) {
    e?.preventDefault();
    if (!clean) return;
    progress.setName(clean);
    sfx.tap();
    step = 'commit';
  }

  function promise() {
    if (!days) return;
    progress.setCommitment(days);
    sfx.unlock();
    haptic.correct();
    finish();
  }

  function pick(d: number) {
    days = d;
    sfx.tap();
    haptic.tap();
  }
</script>

<section class="ob" data-testid="onboarding">
  {#if step === 'name'}
    <form class="body" onsubmit={saveName}>
      <Mascot mood="wave" size={112} />
      {#if ask}<p class="udm ask" lang="udm">{ask.udm}</p>{/if}
      <h1 id="ob-title">Как вас зовут?</h1>
      <p class="muted lead">Имя появится в фразах уроков — будем знакомиться по-удмуртски.</p>

      <label class="field">
        <span class="visually-hidden">Ваше имя</span>
        <input
          bind:this={input}
          bind:value={name}
          type="text"
          name="name"
          autocomplete="given-name"
          autocapitalize="words"
          enterkeyhint="next"
          maxlength="40"
          placeholder="Например, Алёна"
          data-testid="onboarding-name"
        />
      </label>

      <div class="preview" class:placeholder={!clean} aria-live="polite">
        <p class="udm say" lang="udm">{fill(me?.udm ?? 'Мон {name}.', clean)}</p>
        <p class="muted tr">{fill(me?.ru ?? 'Я {name}.', clean)}</p>
      </div>

      <div class="actions">
        <button class="btn btn--ink btn--block" type="submit" disabled={!clean} data-testid="onboarding-next">Дальше</button>
        <button class="btn btn--flat btn--block" type="button" onclick={finish} data-testid="onboarding-skip">Пропустить</button>
      </div>
    </form>
  {:else}
    <div class="body">
      <Mascot mood="happy" size={112} />
      <h1 bind:this={heading} tabindex="-1">Обещание</h1>
      <p class="muted lead">
        {#if hello}<span lang="udm" class="udm">{clean ? hello.udm.replace(/!$/, `, ${clean}!`) : hello.udm}</span>{/if} Сколько дней подряд вы будете заниматься? Хватит одного урока в
        день.
      </p>

      <div class="opts" role="radiogroup" aria-label="Сколько дней подряд">
        {#each options as o (o.d)}
          <button
            class="tile opt"
            class:is-selected={days === o.d}
            type="button"
            role="radio"
            aria-checked={days === o.d}
            onclick={() => pick(o.d)}
            data-testid="commit-{o.d}"
          >
            <span class="days"><b>{o.d}</b> {plural(o.d, ['день', 'дня', 'дней'])}</span>
            <span class="opt-text"><b>{o.label}</b><span class="muted">{o.hint}</span></span>
          </button>
        {/each}
      </div>

      <div class="actions">
        <button class="btn btn--red btn--block" type="button" disabled={!days} onclick={promise} data-testid="commit-promise">Обещаю!</button>
        <button class="btn btn--flat btn--block" type="button" onclick={finish} data-testid="onboarding-skip">Не сейчас</button>
      </div>
    </div>
  {/if}
</section>

<style>
  .ob {
    min-height: 100dvh;
    max-width: 480px;
    margin: 0 auto;
    display: flex;
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 40px var(--gutter) calc(24px + env(safe-area-inset-bottom));
  }
  h1 {
    margin: 12px 0 6px;
    outline: none;
  }
  .lead {
    margin: 0 0 20px;
    max-width: 34ch;
  }
  .field {
    width: 100%;
  }
  input {
    width: 100%;
    min-height: 54px;
    padding: 12px 16px;
    border: 2px solid var(--field-border);
    border-radius: var(--radius);
    background: var(--surface);
    font-size: 1.15rem;
    font-weight: 600;
    text-align: center;
  }
  input:focus-visible {
    outline: none;
    border-color: var(--focus);
    box-shadow: 0 0 0 3px color-mix(in oklab, var(--focus) 30%, transparent);
  }
  .preview {
    margin: 18px 0 8px;
    padding: 14px 18px;
    width: 100%;
    border-radius: var(--radius);
    background: var(--surface-2);
  }
  .preview p {
    margin: 0;
  }
  .ask {
    margin: 12px 0 -6px;
    color: var(--red);
    font-size: 1.05rem;
  }
  .placeholder p {
    opacity: 0.5;
  }
  .say {
    font-size: 1.5rem;
    color: var(--red);
    overflow-wrap: anywhere;
  }
  .tr {
    font-size: 0.95rem;
  }
  .opts {
    display: grid;
    gap: 10px;
    width: 100%;
  }
  .opt {
    min-height: 64px;
  }
  .days {
    flex: none;
    min-width: 84px;
    font: 600 0.95rem/1.1 var(--font-head);
    color: var(--red);
  }
  .days b {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
  }
  .opt-text {
    display: grid;
    line-height: 1.3;
  }
  .opt-text .muted {
    font-size: 0.9rem;
  }
  .actions {
    margin-top: auto;
    padding-top: 24px;
    width: 100%;
    display: grid;
    gap: 6px;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .body {
      animation: rise var(--dur-slow) var(--ease-enter) both;
    }
  }
</style>
