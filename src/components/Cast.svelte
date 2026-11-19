<script lang="ts">
  import pair from '../assets/characters/pair.webp';
  import bird from '../assets/characters/bird.webp';
  import wave from '../assets/characters/girl-bust-wave.webp';
  import palm from '../assets/characters/girl-bust-show-palm.webp';
  import ear from '../assets/characters/girl-bust-point-ear.webp';
  import head from '../assets/characters/girl-bust-point-head.webp';

  const images = {
    pair: { src: pair, width: 961, height: 1072 },
    bird: { src: bird, width: 595, height: 765 },
    wave: { src: wave, width: 232, height: 230 },
    palm: { src: palm, width: 257, height: 230 },
    ear: { src: ear, width: 234, height: 230 },
    head: { src: head, width: 236, height: 231 },
  };

  let { kind, width, flush = false }: { kind: keyof typeof images; width?: number; flush?: boolean } = $props();
  const image = $derived(images[kind]);
</script>

<img
  class="cast"
  class:flush
  src={image.src}
  width={image.width}
  height={image.height}
  style:--cast-width={width === undefined ? undefined : width + 'px'}
  alt=""
  decoding="async"
  loading={kind === 'pair' ? 'eager' : 'lazy'}
  fetchpriority={kind === 'pair' ? 'high' : undefined}
/>

<style>
  img {
    display: block;
    width: var(--cast-width, auto);
    height: auto;
  }
  .flush {
    align-self: end;
    margin-bottom: 0;
  }
</style>
