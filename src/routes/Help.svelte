<script lang="ts">
  /**
   * «Помочь проекту»: носитель языка или преподаватель проверяет фразы курса и записывает их голосом.
   * Ничего не отправляется само: отметки хранятся в браузере (localStorage), записи — в IndexedDB,
   * в конце человек скачивает один архив и прикрепляет его к заявке на GitHub (или отдаёт старосте).
   */
  import { itemsByUnit, personalize } from '$lib/course';
  import type { LexItem } from '$lib/content/schema';
  import { readJSON, writeJSON } from '$lib/storage';
  import { idbGet, idbSet, idbDel, idbKeys } from '$lib/idb';
  import { makeZip } from '$lib/zip';
  import { archiveEntries, extFor, issueUrl, pickMime, reviewMarkdown, REPO, type Marks, type Speaker } from '$lib/native';
  import { sfx, haptic } from '$lib/sfx';
  import { href } from '$lib/router.svelte';
  import AudioButton from '../components/exercise/AudioButton.svelte';

  const KEY = 'udm.native.v1';
  const saved = readJSON<{ speaker: Speaker; marks: Marks }>(KEY, { speaker: { name: '', place: '', consent: false }, marks: {} });
  let speaker = $state<Speaker>(saved.speaker);
  let marks = $state<Marks>(saved.marks);
  $effect(() => writeJSON(KEY, { speaker: $state.snapshot(speaker), marks: $state.snapshot(marks) }));

  // Фразы с {name} не записываем голосом (имя у каждого своё), но проверить их можно.
  const groups = itemsByUnit.filter((g) => g.items.length);
  const all = groups.flatMap((g) => g.items);
  let unit = $state(1);
  let onlyNew = $state(false);
  let phrasesOnly = $state(true);
  const shown = $derived(
    (groups.find((g) => g.n === unit)?.items ?? []).filter(
      (it) => (!phrasesOnly || it.kind === 'phrase') && (!onlyNew || !marks[it.id]),
    ),
  );

  // ── Отметки ──
  let editing = $state<string | null>(null);
  let fixText = $state('');
  let comment = $state('');
  function markOk(it: LexItem) {
    marks[it.id] = { ok: true, at: Date.now() };
    editing = null;
    sfx.correct();
    haptic.correct();
  }
  function startFix(it: LexItem) {
    editing = it.id;
    fixText = marks[it.id]?.fix ?? personalize(it.udm);
    comment = marks[it.id]?.comment ?? '';
  }
  function saveFix(it: LexItem) {
    marks[it.id] = { ok: false, fix: fixText.trim(), comment: comment.trim(), at: Date.now() };
    editing = null;
    sfx.tap();
  }
  function unmark(id: string) {
    delete marks[id];
  }

  // ── Запись голоса ──
  let recorded = $state<Record<string, string>>({}); // id → objectURL
  let recId = $state<string | null>(null);
  let recMs = $state(0);
  let micError = $state('');
  let recorder: MediaRecorder | undefined;
  let stream: MediaStream | undefined;
  let tick: ReturnType<typeof setInterval> | undefined;
  const canRecord = typeof window !== 'undefined' && 'MediaRecorder' in window && !!navigator.mediaDevices?.getUserMedia;
  const MAX_MS = 12_000;

  $effect(() => {
    void idbKeys().then(async (keys) => {
      for (const k of keys.filter((k) => k.startsWith('rec:'))) {
        const r = await idbGet<{ blob: Blob }>(k);
        if (r?.blob) recorded[k.slice(4)] = URL.createObjectURL(r.blob);
      }
    });
    return () => {
      stopStream();
      Object.values(recorded).forEach((u) => URL.revokeObjectURL(u));
    };
  });

  function stopStream() {
    clearInterval(tick);
    stream?.getTracks().forEach((t) => t.stop());
    stream = undefined;
  }

  async function record(it: LexItem) {
    if (recId) return stop();
    micError = '';
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      micError = 'Нет доступа к микрофону. Разрешите его в настройках браузера и попробуйте ещё раз.';
      return;
    }
    const mime = pickMime((t) => MediaRecorder.isTypeSupported(t));
    const chunks: BlobPart[] = [];
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = async () => {
      stopStream();
      const type = recorder?.mimeType || mime || 'audio/webm';
      const blob = new Blob(chunks, { type });
      recId = null;
      if (blob.size < 800) return; // случайное нажатие
      await idbSet(`rec:${it.id}`, { blob, mime: type, text: it.udm, at: Date.now() });
      if (recorded[it.id]) URL.revokeObjectURL(recorded[it.id]);
      recorded[it.id] = URL.createObjectURL(blob);
      sfx.unlock();
    };
    recId = it.id;
    recMs = 0;
    const t0 = performance.now();
    tick = setInterval(() => {
      recMs = performance.now() - t0;
      if (recMs >= MAX_MS) stop();
    }, 100);
    recorder.start();
    haptic.tap();
  }
  function stop() {
    if (recorder?.state === 'recording') recorder.stop();
  }
  function play(id: string) {
    const a = new Audio(recorded[id]);
    void a.play().catch(() => {});
  }
  async function removeRec(id: string) {
    await idbDel(`rec:${id}`);
    URL.revokeObjectURL(recorded[id]);
    delete recorded[id];
  }

  // ── Итог и архив ──
  const nMarked = $derived(Object.keys(marks).length);
  const nWrong = $derived(Object.values(marks).filter((m) => !m.ok).length);
  const nRec = $derived(Object.keys(recorded).length);
  let busy = $state(false);

  async function download() {
    busy = true;
    try {
      const recs: { id: string; ext: string; data: Uint8Array }[] = [];
      for (const id of Object.keys(recorded)) {
        const r = await idbGet<{ blob: Blob; mime: string }>(`rec:${id}`);
        if (r?.blob) recs.push({ id, ext: extFor(r.mime), data: new Uint8Array(await r.blob.arrayBuffer()) });
      }
      const zip = makeZip(archiveEntries(all, $state.snapshot(marks), $state.snapshot(speaker), recs));
      const url = URL.createObjectURL(new Blob([zip as BlobPart], { type: 'application/zip' }));
      const a = document.createElement('a');
      const who = (speaker.name || 'nositel').replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 30);
      a.href = url;
      a.download = `udmurt-proverka-${who}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      sfx.complete();
    } finally {
      busy = false;
    }
  }
  const report = $derived(reviewMarkdown(all, marks, speaker, Object.keys(recorded)));
  const issue = $derived(issueUrl(`Проверка носителем: ${speaker.name || 'без имени'}, ${nMarked} фраз`, report + '\n\n(архив с записями приложу к заявке)'));
  const fmt = (ms: number) => `${Math.floor(ms / 1000)},${Math.floor((ms % 1000) / 100)} с`;
</script>

<section class="page help">
  <header class="rise">
    <h1>Помочь проекту</h1>
    <p class="lead">
      Вы говорите по-удмуртски или преподаёте его? Проверьте фразы курса и запишите их голосом — так тренажёр
      заговорит живым голосом вместо синтеза. Ничего не отправляется само: в конце вы скачаете архив и
      приложите его к <a href="{REPO}/issues/new" target="_blank" rel="noopener">заявке на GitHub</a> или отдадите старосте группы.
    </p>
  </header>

  <div class="card who">
    <label>Как вас подписать в «Источниках» <input bind:value={speaker.name} placeholder="Имя и фамилия" autocomplete="name" /></label>
    <label>Откуда вы, какой говор <input bind:value={speaker.place} placeholder="Например: Глазов, северный говор" /></label>
    <label class="consent">
      <input type="checkbox" bind:checked={speaker.consent} />
      <span>Согласен(на), чтобы мои записи опубликовали на сайте под лицензией CC BY 4.0 с указанием имени</span>
    </label>
  </div>

  <div class="chips" role="group" aria-label="Юнит">
    {#each groups as g (g.unit.id)}
      {@const left = g.items.filter((i) => !marks[i.id]).length}
      <button class="fchip" class:on={unit === g.n} aria-pressed={unit === g.n} onclick={() => (unit = g.n)}>
        {g.n}. {g.unit.title}{#if !left} ✓{/if}
      </button>
    {/each}
  </div>
  <div class="filters">
    <label><input type="checkbox" bind:checked={onlyNew} /> только непроверенные</label>
    <label><input type="checkbox" bind:checked={phrasesOnly} /> только фразы (без отдельных слов)</label>
  </div>
  {#if micError}<p class="err" role="alert">{micError}</p>{/if}
  {#if !canRecord}<p class="muted small">Этот браузер не умеет записывать звук — проверять фразы всё равно можно.</p>{/if}

  <ul class="list">
    {#each shown as it (it.id)}
      {@const m = marks[it.id]}
      <li class="row" class:ok={m?.ok} class:bad={m && !m.ok} data-testid="help-item">
        <div class="txt">
          <p class="u udm" lang="udm">{personalize(it.udm)}</p>
          <p class="r">{personalize(it.ru)}</p>
          {#if m && !m.ok}<p class="fix small">✎ {m.fix}{m.comment ? ` — ${m.comment}` : ''}</p>{/if}
        </div>
        <div class="acts">
          <AudioButton audio={it.audio} size="sm" synth={it.audio_synth} label="Послушать синтез" />
          <button class="act ok-btn" aria-pressed={!!m?.ok} onclick={() => (m?.ok ? unmark(it.id) : markOk(it))} data-testid="mark-ok">✓ Верно</button>
          <button class="act bad-btn" aria-pressed={!!m && !m.ok} onclick={() => startFix(it)} data-testid="mark-bad">✎ Ошибка</button>
          {#if canRecord && !it.udm.includes('{name}')}
            <button class="act rec" class:live={recId === it.id} disabled={!!recId && recId !== it.id} onclick={() => record(it)} data-testid="rec">
              {recId === it.id ? `■ ${fmt(recMs)}` : recorded[it.id] ? '🎙 Заново' : '🎙 Записать'}
            </button>
            {#if recorded[it.id] && recId !== it.id}
              <button class="act" onclick={() => play(it.id)} aria-label="Прослушать мою запись">▶ Моя запись</button>
              <button class="act del" onclick={() => removeRec(it.id)} aria-label="Удалить запись">🗑</button>
            {/if}
          {/if}
        </div>
        {#if editing === it.id}
          <div class="edit">
            <label>Как правильно <input class="udm" lang="udm" bind:value={fixText} /></label>
            <label>Комментарий (необязательно) <textarea rows="2" bind:value={comment} placeholder="Например: так говорят только на юге"></textarea></label>
            <div class="edit-acts">
              <button class="btn btn--sm" onclick={() => saveFix(it)} data-testid="save-fix">Сохранить</button>
              <button class="btn btn--sm btn--ghost" onclick={() => (editing = null)}>Отмена</button>
            </div>
          </div>
        {/if}
      </li>
    {:else}
      <li class="muted">В этом юните всё проверено. Спасибо! 🙏</li>
    {/each}
  </ul>

  <p class="muted small foot">
    Записывайте в тихой комнате, держите телефон в 20–30 см, говорите обычным темпом. Запись — до 12 секунд,
    нажмите ещё раз, чтобы остановить. Прочитать, как используются записи: <a href={href('/credits')}>Источники</a>.
  </p>
</section>

<div class="bar" class:has={nMarked || nRec}>
  <span class="sum" role="status">Проверено <b>{nMarked}</b>{#if nWrong} · замечаний <b>{nWrong}</b>{/if} · записей <b>{nRec}</b></span>
  <div class="bar-acts">
    <button class="btn btn--sm" disabled={busy || (!nMarked && !nRec)} onclick={download} data-testid="download-zip">⬇ Архив</button>
    <a class="btn btn--sm btn--ghost" class:off={!nMarked && !nRec} href={issue} target="_blank" rel="noopener">Заявка на GitHub</a>
  </div>
</div>

<style>
  h1 {
    margin: 0 0 6px;
  }
  .lead {
    line-height: 1.5;
    margin: 0 0 14px;
  }
  .who {
    display: grid;
    gap: 10px;
    margin-bottom: 14px;
  }
  .who label,
  .edit label {
    display: grid;
    gap: 4px;
    font-size: 0.88rem;
    font-weight: 600;
  }
  input:not([type='checkbox']),
  textarea {
    font: inherit;
    font-weight: 400;
    color: inherit;
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius-s);
    padding: 10px 12px;
    min-width: 0;
  }
  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--focus);
  }
  .consent {
    display: flex !important;
    grid-template-columns: none;
    gap: 10px !important;
    align-items: flex-start;
    font-weight: 400 !important;
    line-height: 1.4;
  }
  .consent input,
  .filters input {
    width: 20px;
    height: 20px;
    flex: none;
    accent-color: var(--red);
  }
  .chips {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
  }
  .fchip {
    flex: none;
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 999px;
    padding: 7px 12px;
    font: 600 0.88rem var(--font-head);
    cursor: pointer;
    white-space: nowrap;
    color: inherit;
  }
  .fchip.on {
    background: var(--ink);
    border-color: var(--ink);
    color: var(--bg);
  }
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 16px;
    margin: 6px 0 10px;
    font-size: 0.9rem;
    color: var(--muted);
  }
  .filters label {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .err {
    color: var(--red);
    font-weight: 600;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .row {
    background: var(--surface);
    border: 2px solid var(--line);
    border-radius: var(--radius);
    padding: 10px 12px;
    transition: border-color var(--dur-base);
  }
  .row.ok {
    border-color: var(--green);
  }
  .row.bad {
    border-color: var(--amber);
  }
  .u {
    margin: 0;
    font-size: 1.15rem;
    overflow-wrap: anywhere;
  }
  .r {
    margin: 2px 0 0;
    color: var(--muted);
  }
  .fix {
    margin: 4px 0 0;
    color: var(--amber-edge, var(--amber));
  }
  .acts {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
    align-items: center;
  }
  .act {
    min-height: 40px;
    border: 2px solid var(--line);
    background: var(--surface);
    border-radius: 12px;
    padding: 6px 12px;
    font: 600 0.88rem var(--font-head);
    color: inherit;
    cursor: pointer;
  }
  .act:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .ok-btn[aria-pressed='true'] {
    background: var(--green-soft);
    border-color: var(--green);
  }
  .bad-btn[aria-pressed='true'] {
    background: var(--amber-soft);
    border-color: var(--amber);
  }
  .rec.live {
    background: var(--red);
    border-color: var(--red);
    color: var(--on-fill);
  }
  .edit {
    display: grid;
    gap: 8px;
    margin-top: 10px;
  }
  .edit-acts {
    display: flex;
    gap: 8px;
  }
  .small {
    font-size: 0.82rem;
  }
  .foot {
    margin-top: 16px;
    line-height: 1.5;
  }
  .help {
    padding-bottom: calc(var(--nav-h) + 110px + env(safe-area-inset-bottom));
  }
  .bar {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    bottom: calc(var(--nav-h) + 10px + env(safe-area-inset-bottom));
    width: min(560px, calc(100% - 2 * var(--gutter)));
    z-index: 25;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    background: var(--surface);
    border: 2px solid var(--line-strong);
    border-radius: var(--radius-l);
    box-shadow: var(--shadow);
  }
  .sum {
    font-size: 0.9rem;
  }
  .bar-acts {
    display: flex;
    gap: 6px;
  }
  .off {
    pointer-events: none;
    opacity: 0.5;
  }
  @media (prefers-reduced-motion: no-preference) {
    :global(html:not([data-motion='reduce'])) .rec.live {
      animation: pulse 1.2s ease-in-out infinite;
    }
  }
  @keyframes pulse {
    50% {
      box-shadow: 0 0 0 6px var(--red-soft);
    }
  }
</style>
