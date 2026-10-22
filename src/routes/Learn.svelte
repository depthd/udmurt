<script lang="ts">
  /**
   * Путь уроков (#/learn): баннер юнита → узлы на синусоиде, связанные «нитью» → полоса-вышивка.
   * Нажатие на узел — всплывашка «Начать»/«Повторить» (или подсказка для закрытого).
   * При открытии путь плавно прокручивается к текущему узлу; новый отрезок нити прорисовывается.
   */
  import { onMount, tick } from 'svelte';
  import { course, allLessons, isUnlocked, type LessonRef } from '$lib/course';
  import type { Unit } from '$lib/content/schema';
  import { progress } from '$lib/progress.svelte';
  import { prefs } from '$lib/prefs.svelte';
  import { href } from '$lib/router.svelte';
  import { sfx, haptic } from '$lib/sfx';
  import { NODE, pathLayout } from '../components/path/geometry';
  import { readSeen, writeSeen } from '../components/path/seen';
  import PathThread from '../components/path/PathThread.svelte';
  import LessonNode, { type NodeState } from '../components/path/LessonNode.svelte';
  import StartPopover from '../components/path/StartPopover.svelte';
  import UnitBanner from '../components/path/UnitBanner.svelte';
  import GuideSheet from '../components/path/GuideSheet.svelte';
  import StitchBand from '../components/path/StitchBand.svelte';

  function nodeState(ref: LessonRef): NodeState {
    const st = progress.lesson(ref.lesson.id);
    if (st && st.done > 0) return st.best >= 1 ? 'perfect' : 'done';
    return isUnlocked(ref) ? 'current' : 'locked';
  }

  const units = $derived(
    course.units.map((unit, ui) => {
      const refs = allLessons.filter((l) => l.unitIndex === ui);
      const states = refs.map(nodeState);
      const done = states.filter((s) => s === 'done' || s === 'perfect').length;
      const layout = pathLayout(refs.length);
      const firstOpen = states.findIndex((s) => s === 'current');
      // Индекс точки нити: 0 — старт у баннера, i+1 — узел i, n+1 — финиш у вышивки.
      const doneTo = done === refs.length ? refs.length + 1 : firstOpen >= 0 ? firstOpen + 1 : 0;
      return { unit, ui, refs, states, done, layout, doneTo, locked: states[0] === 'locked' };
    }),
  );

  // Что ученик видел в прошлый раз — фиксируем на входе (не реактивно).
  const seenMap = readSeen();
  const animate = !prefs.reduceMotion;
  const seenOf = (id: string, doneTo: number) => Math.min(seenMap?.[id] ?? 0, doneTo);
  /** Узел «только что открылся»: нить дошла до него с прошлого визита. */
  const isFresh = (id: string, doneTo: number, i: number) =>
    !!seenMap && animate && i + 1 === doneTo && seenOf(id, doneTo) < doneTo && doneTo > 1;

  let selected = $state<string | null>(null);
  let guideUnit = $state<Unit | null>(null);
  let guideOpener: HTMLElement | null = null;

  function select(ref: LessonRef, el: HTMLButtonElement) {
    sfx.tap();
    haptic.tap();
    selected = selected === ref.lesson.id ? null : ref.lesson.id;
    if (!selected) el.focus();
  }

  function closePop(refocus = false) {
    const id = selected;
    selected = null;
    if (refocus && id) document.querySelector<HTMLElement>(`[data-testid="node-${id}"]`)?.focus();
  }

  function onpointerdown(e: PointerEvent) {
    if (!selected) return;
    const t = e.target as Element | null;
    if (t?.closest('.pop, .node')) return;
    closePop();
  }

  function openGuide(unit: Unit, opener: HTMLButtonElement) {
    guideOpener = opener;
    selected = null;
    guideUnit = unit;
  }
  function guideClosed() {
    guideUnit = null;
    guideOpener?.focus();
  }

  onMount(() => {
    // Запомнить, докуда «прошита» нить, — следующая прорисовка только при новом прогрессе.
    writeSeen(Object.fromEntries(units.map((u) => [u.unit.id, u.doneTo])));

    let unlockTimer: ReturnType<typeof setTimeout> | undefined;
    if (units.some((u) => u.refs.some((r, i) => isFresh(u.unit.id, u.doneTo, i)))) {
      unlockTimer = setTimeout(() => sfx.unlock(), 1150);
    }

    const t = setTimeout(async () => {
      await tick();
      const cur = document.querySelector<HTMLElement>('[data-current="true"]');
      if (!cur) return;
      const r = cur.getBoundingClientRect();
      if (r.top > innerHeight * 0.62 || r.bottom < 90) {
        cur.scrollIntoView({ block: 'center', behavior: prefs.reduceMotion ? 'auto' : 'smooth' });
      }
    }, 120);
    return () => {
      clearTimeout(t);
      clearTimeout(unlockTimer);
    };
  });
</script>

<svelte:window {onpointerdown} />

<section class="page learn" aria-labelledby="learn-title">
  <h1 id="learn-title" class="visually-hidden">Учиться: путь уроков</h1>

  {#each units as u (u.unit.id)}
    <section class="unit" aria-labelledby="unit-{u.unit.id}-title">
      <UnitBanner unit={u.unit} index={u.ui} done={u.done} total={u.refs.length} locked={u.locked} onguide={openGuide} />

      <div class="path" style:height="{u.layout.height}px">
        <PathThread
          points={u.layout.thread}
          height={u.layout.height}
          amp={u.layout.amp}
          doneTo={u.doneTo}
          seenTo={seenOf(u.unit.id, u.doneTo)}
          {animate}
        />
        <ol class="nodes" aria-label="Уроки юнита «{u.unit.title}»">
          {#each u.refs as ref, i (ref.lesson.id)}
            {@const p = u.layout.nodes[i]}
            <li style:top="{p.y - NODE / 2}px" style:left="calc(50% + {p.x - NODE / 2}px)">
              <LessonNode
                {ref}
                state={u.states[i]}
                expanded={selected === ref.lesson.id}
                popId="pop-{ref.lesson.id}"
                justUnlocked={isFresh(u.unit.id, u.doneTo, i)}
                onselect={select}
              />
            </li>
          {/each}
        </ol>
        {#each u.refs as ref, i (ref.lesson.id)}
          {#if selected === ref.lesson.id}
            <StartPopover
              {ref}
              state={u.states[i]}
              id="pop-{ref.lesson.id}"
              top={u.layout.nodes[i].y + NODE / 2 + 22}
              x={u.layout.nodes[i].x}
              total={u.refs.length}
              onclose={closePop}
            />
          {/if}
        {/each}
      </div>

      <StitchBand
        total={u.refs.length}
        done={u.done}
        seen={Math.min(Math.max(0, seenOf(u.unit.id, u.doneTo) - 1), u.done)}
        animate={animate && !!seenMap}
      />
    </section>
  {/each}

  <aside class="soon card">
    <p class="soon-title">Дальше — новые юниты</p>
    <p class="muted">Числа, семья, учёба, город и еда появятся в следующих обновлениях. А пока можно повторять слова.</p>
    <div class="soon-links">
      <a class="btn btn--ghost btn--sm" href={href('/practice')}>Повторять</a>
      <a class="btn btn--flat btn--sm" href={href('/dict')}>Словарь</a>
    </div>
  </aside>
</section>

<GuideSheet unit={guideUnit} onclose={guideClosed} />

<style>
  .learn {
    padding-top: 20px;
  }
  .unit + .unit {
    margin-top: 8px;
  }
  .path {
    position: relative;
    margin: 0 auto;
    max-width: 420px;
  }
  .nodes {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nodes li {
    position: absolute;
    width: 72px;
    height: 72px;
  }
  .soon {
    margin-top: 4px;
    text-align: center;
    border-style: dashed;
    background: transparent;
  }
  .soon-title {
    margin: 0 0 4px;
    font: 700 1.05rem/1.3 var(--font-head);
  }
  .soon .muted {
    margin: 0 0 12px;
    font-size: 0.95rem;
  }
  .soon-links {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
