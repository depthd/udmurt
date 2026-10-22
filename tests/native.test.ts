import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { crc32, makeZip } from '../src/lib/zip.ts';
import { archiveEntries, extFor, issueUrl, pickMime, reviewMarkdown } from '../src/lib/native.ts';
import type { LexItem } from '../src/lib/content/schema.ts';

const item = (id: string, udm: string): LexItem => ({ id, udm, ru: 'x', status: 'sourced', sources: [], morphemes: [], kind: 'phrase' }) as unknown as LexItem;
const items = [item('a', 'Мон студент.'), item('b', 'Тау | спасибо'), item('c', 'Ӟечбур!')];
const speaker = { name: 'Анна', place: 'Глазов', consent: true };

describe('zip', () => {
  it('crc32 — контрольное значение', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('архив распаковывается стандартным zip (имена в UTF-8)', () => {
    const z = makeZip([
      { name: 'review.md', data: 'Ӟечбуресь!' },
      { name: 'audio/mon-student.webm', data: new Uint8Array([1, 2, 3, 255]) },
    ]);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-'));
    const f = path.join(dir, 't.zip');
    fs.writeFileSync(f, z);
    const out = execFileSync('python3', ['-I', '-c', 'import sys,zipfile;z=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None;print(z.read("review.md").decode());print(list(z.read("audio/mon-student.webm")))', f], { encoding: 'utf8' });
    expect(out).toContain('Ӟечбуресь!');
    expect(out).toContain('[1, 2, 3, 255]');
  });
});

describe('помочь проекту', () => {
  it('расширение по типу записи', () => {
    expect(extFor('audio/webm;codecs=opus')).toBe('webm');
    expect(extFor('audio/mp4')).toBe('m4a');
    expect(pickMime((t) => t === 'audio/mp4')).toBe('audio/mp4');
    expect(pickMime(() => false)).toBeUndefined();
  });
  it('отчёт: замечания таблицей, «|» экранируется', () => {
    const md = reviewMarkdown(items, { a: { ok: true, at: 1 }, b: { ok: false, fix: 'Тау!', comment: 'без | черты', at: 2 } }, speaker, ['a']);
    expect(md).toContain('Проверено фраз: 2, из них с замечаниями: 1');
    expect(md).toContain('| `b` | Тау \\| спасибо | Тау! | без \\| черты |');
    expect(md).toContain('`a`');
    expect(md).toContain('CC BY 4.0: да');
  });
  it('ссылка на заявку урезает длинный отчёт', () => {
    const u = issueUrl('t', 'я'.repeat(10000), 100);
    expect(decodeURIComponent(u)).toContain('полный отчёт');
    expect(u.startsWith('https://github.com/depthd/udmurt/issues/new?title=t&body=')).toBe(true);
  });
  it('архив: отчёт, данные и записи', () => {
    const e = archiveEntries(items, {}, speaker, [{ id: 'a', ext: 'webm', data: new Uint8Array([0]) }]);
    expect(e.map((x) => x.name)).toEqual(['review.md', 'review.json', 'audio/a.webm', 'README.txt']);
    expect(JSON.parse(e[1].data as string).recordings[0]).toEqual({ id: 'a', file: 'audio/a.webm', text: 'Мон студент.' });
  });
});
