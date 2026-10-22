import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadLibrary } from '../vite/load-content.ts';

const items = loadLibrary(path.resolve('content'));

describe('каталог материалов', () => {
  it('загружается и не пуст', () => {
    expect(items.length).toBeGreaterThan(50);
  });
  it('есть блок «С чего начать»', () => {
    expect(items.filter((i) => i.top).length).toBeGreaterThanOrEqual(5);
  });
  it('открытые материалы указывают лицензию', () => {
    for (const i of items.filter((x) => x.rights === 'open')) expect(i.license, i.id).toBeTruthy();
  });
  it('книги группы — без ссылок на файлы', () => {
    for (const i of items.filter((x) => x.group)) expect(i.url ?? '', i.id).not.toMatch(/\.(pdf|djvu)$/);
  });
});
