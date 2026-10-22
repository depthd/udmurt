/**
 * «Помочь проекту»: проверка фраз носителем и запись голоса.
 * Чистые помощники: отметки, отчёт для заявки, состав архива.
 */
import type { LexItem } from './content/schema';
import type { ZipEntry } from './zip';

export type Mark = { ok: boolean; fix?: string; comment?: string; at: number };
export type Marks = Record<string, Mark>;
export type Speaker = { name: string; place: string; consent: boolean };

export const REPO = 'https://github.com/depthd/udmurt';

/** Расширение файла по MIME-типу записи (Chrome — webm/opus, Safari — mp4/aac). */
export function extFor(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('aac')) return 'm4a';
  if (mime.includes('wav')) return 'wav';
  return 'bin';
}

/** Лучший поддерживаемый формат записи. */
export function pickMime(isSupported: (t: string) => boolean): string | undefined {
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(isSupported);
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');

/** Отчёт о проверке в Markdown — для заявки на GitHub и для архива. */
export function reviewMarkdown(items: LexItem[], marks: Marks, speaker: Speaker, recorded: string[]): string {
  const checked = items.filter((i) => marks[i.id]);
  const wrong = checked.filter((i) => !marks[i.id].ok);
  const lines = [
    `## Проверка носителем`,
    '',
    `- Кто проверял: ${speaker.name || '—'}${speaker.place ? ` (${speaker.place})` : ''}`,
    `- Проверено фраз: ${checked.length}, из них с замечаниями: ${wrong.length}`,
    `- Записано голосом: ${recorded.length}`,
    `- Согласие на публикацию записей под CC BY 4.0: ${speaker.consent ? 'да' : 'нет'}`,
    '',
  ];
  if (wrong.length) {
    lines.push('### Замечания', '', '| id | сейчас | как правильно | комментарий |', '|---|---|---|---|');
    for (const i of wrong) {
      const m = marks[i.id];
      lines.push(`| \`${i.id}\` | ${cell(i.udm)} | ${cell(m.fix ?? '')} | ${cell(m.comment ?? '')} |`);
    }
    lines.push('');
  }
  const ok = checked.filter((i) => marks[i.id].ok);
  if (ok.length) lines.push('### Верно', '', ok.map((i) => `\`${i.id}\``).join(', '), '');
  return lines.join('\n');
}

/** Ссылка на новую заявку с отчётом (GitHub ограничивает длину адреса — длинный отчёт урезаем). */
export function issueUrl(title: string, body: string, max = 6000): string {
  const b = body.length > max ? body.slice(0, max) + '\n\n…(полный отчёт — в архиве review.md)' : body;
  return `${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(b)}`;
}

/** Состав архива: записи, отчёт, данные для импорта. */
export function archiveEntries(
  items: LexItem[],
  marks: Marks,
  speaker: Speaker,
  recs: { id: string; ext: string; data: Uint8Array }[],
): ZipEntry[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const recorded = recs.map((r) => r.id);
  const meta = {
    v: 1,
    speaker,
    marks,
    recordings: recs.map((r) => ({ id: r.id, file: `audio/${r.id}.${r.ext}`, text: byId.get(r.id)?.udm ?? '' })),
  };
  return [
    { name: 'review.md', data: reviewMarkdown(items, marks, speaker, recorded) },
    { name: 'review.json', data: JSON.stringify(meta, null, 1) },
    ...recs.map((r) => ({ name: `audio/${r.id}.${r.ext}`, data: r.data })),
    {
      name: 'README.txt',
      data:
        'Архив для проекта «Удмурт кыл» (' + REPO + ').\n' +
        'Прикрепите его к заявке на GitHub или передайте старосте группы.\n' +
        'review.md — замечания по фразам, review.json — те же данные для импорта, audio/ — записи (имя файла = id фразы).\n' +
        'Импорт: python3 scripts/tts/import_native.py <архив.zip>\n',
    },
  ];
}
