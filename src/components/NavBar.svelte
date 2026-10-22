<script lang="ts">
  import { href } from '$lib/router.svelte';
  import { progress } from '$lib/progress.svelte';

  let { current }: { current: string } = $props();

  const due = $derived(progress.dueCards().length);

  const items = [
    { name: 'learn', path: '/learn', label: 'Учиться', icon: 'M4 19V8l8-5 8 5v11h-5v-6H9v6z', match: ['learn', 'home'] },
    { name: 'practice', path: '/practice', label: 'Повторять', icon: 'M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-1.76-4.24L14 10h6V4l-2.35 2.35A7.97 7.97 0 0 0 12 4z', match: ['practice'] },
    { name: 'about', path: '/about', label: 'О языке', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2zm0-8h-2V7h2z', match: ['about'] },
    { name: 'dict', path: '/dict', label: 'Словарь', icon: 'M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 3v2h9V6zm0 4v2h9v-2zm0 4v2h6v-2z', match: ['dict'] },
    { name: 'library', path: '/library', label: 'Материалы', icon: 'M4 4h4v16H4zm6 0h4v16h-4zm6.2.6 3.8-1 4.1 15.4-3.8 1z', match: ['library', 'credits'] },
    { name: 'me', path: '/me', label: 'Профиль', icon: 'M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zm0 2c-4.4 0-8 2.2-8 5v2h16v-2c0-2.8-3.6-5-8-5z', match: ['me'] },
  ];
</script>

<nav class="nav" aria-label="Основная навигация">
  <ul>
    {#each items as it (it.name)}
      {@const active = it.match.includes(current)}
      <li>
        <a href={href(it.path)} class:active aria-current={active ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={it.icon} fill="currentColor" /></svg>
          <span>{it.label}</span>
          {#if it.name === 'practice' && due > 0}
            <b class="badge" aria-label="{due} слов пора повторить">{due > 99 ? '99+' : due}</b>
          {/if}
        </a>
      </li>
    {/each}
  </ul>
</nav>

<style>
  .nav {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 30;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
  }
  ul {
    list-style: none;
    margin: 0 auto;
    padding: 0 4px;
    max-width: 720px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
  }
  a {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 2px 6px;
    min-height: var(--nav-h);
    color: var(--muted);
    text-decoration: none;
    font: 600 0.68rem/1.1 var(--font-head);
    border-radius: 12px;
    -webkit-tap-highlight-color: transparent;
  }
  a.active {
    color: var(--red);
  }
  a.active svg {
    transform: translateY(-1px) scale(1.08);
  }
  svg {
    transition: transform var(--dur-fast) var(--ease-overshoot);
  }
  .badge {
    position: absolute;
    top: 4px;
    left: calc(50% + 6px);
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: var(--red);
    color: var(--on-fill);
    font: 700 0.65rem/18px var(--font-head);
  }
  @media (min-width: 900px) {
    .nav {
      inset: 64px auto 0 0;
      width: 96px;
      border-top: 0;
      border-right: 1px solid var(--line);
      padding: 16px 0;
    }
    ul {
      grid-template-columns: 1fr;
      gap: 4px;
    }
    :global(main:not(.lesson-mode)) {
      padding-left: 96px;
    }
  }
</style>
