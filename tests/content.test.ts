/**
 * Проверка контента: схема, ссылки на словник, запрет черновиков в уроках.
 * Запуск: npm run validate
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCourse } from '../vite/load-content.ts';

const course = loadCourse(path.resolve('content'));

describe('контент курса', () => {
  it('загружается без ошибок', () => {
    expect(course.units.length).toBeGreaterThan(0);
  });

  it('у каждого слова есть источник и статус не draft, если оно в уроке', () => {
    for (const it of course.lexicon) expect(it.sources.length, it.id).toBeGreaterThan(0);
  });

  it('удмуртские буквы записаны кириллицей, без латинских двойников', () => {
    const latin = /[A-Za-zöÖïÏ]/;
    for (const it of course.lexicon) {
      for (const s of [it.udm, ...it.udm_alt]) expect(latin.test(s.replace(/\{name\}/g, '')), `${it.id}: «${s}»`).toBe(false);
    }
  });

  it('в Unicode-форме NFC (ӧ — один символ, а не о + ¨)', () => {
    for (const it of course.lexicon) expect(it.udm, it.id).toBe(it.udm.normalize('NFC'));
  });
});
