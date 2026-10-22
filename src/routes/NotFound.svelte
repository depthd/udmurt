<script lang="ts">
  import Mascot, { type Mood } from '../components/Mascot.svelte';
  import { href, router } from '$lib/router.svelte';

  // #/что-угодно?gallery — служебная галерея состояний маскота (для проверки дизайна)
  const gallery = $derived(router.current.path.includes('?gallery'));
  const moods: Mood[] = ['idle', 'happy', 'sad', 'celebrate', 'think', 'wave'];
</script>

{#if gallery}
  <section class="page">
    <h1>Юсь</h1>
    <div class="grid">
      {#each moods as m (m)}
        <figure><Mascot mood={m} size={140} /><figcaption>{m}</figcaption></figure>
      {/each}
    </div>
    <div class="grid">
      {#each moods as m (m)}
        <figure><Mascot mood={m} size={56} /></figure>
      {/each}
    </div>
  </section>
{:else}
  <section class="page nf">
    <Mascot mood="sad" size={150} />
    <h1>Такой страницы нет</h1>
    <p class="muted">Возможно, ссылка устарела. Вернёмся к урокам?</p>
    <a class="btn" href={href('/')}>На главную</a>
  </section>
{/if}

<style>
  .nf {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 8px;
    padding-top: 48px;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 24px;
  }
  figure {
    margin: 0;
    display: grid;
    justify-items: center;
    gap: 4px;
  }
  figcaption {
    font: 600 0.85rem var(--font-head);
    color: var(--muted);
  }
</style>
