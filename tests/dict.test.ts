import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildEntries, buildPhrases, searchEntries, searchPhrases, examplesFor, highlight, searchKey } from '../src/lib/dict.ts';

const dict = buildEntries(JSON.parse(fs.readFileSync('public/data/dict.json', 'utf8')).entries);
const phrases = buildPhrases(JSON.parse(fs.readFileSync('public/data/phrases.json', 'utf8')).entries);

describe('словарь', () => {
  it('ключ поиска без диакритик и регистра', () => {
    expect(searchKey('Ӟечбуресь!')).toBe('зечбуресь');
    expect(searchKey('Ӧвӧл')).toBe(searchKey('овол'));
  });
  it('находит удмуртское слово первым', () => {
    expect(searchEntries(dict, 'кыл').items[0].udm).toBe('кыл');
    expect(searchEntries(dict, 'мон').items[0].ru).toContain('я');
  });
  it('поиск без удмуртских букв', () => {
    expect(searchEntries(dict, 'овол').items.some((e) => e.udm === 'ӧвӧл')).toBe(true);
  });
  it('поиск по-русски', () => {
    const r = searchEntries(dict, 'солнце').items.map((e) => e.udm);
    expect(r).toContain('шунды');
  });
  it('быстро (< 40 мс на запрос)', () => {
    const t0 = performance.now();
    for (const q of ['ки', 'вода', 'дышетскыны', 'го', 'большой']) searchEntries(dict, q);
    expect((performance.now() - t0) / 5).toBeLessThan(40);
  });
  it('фразы и примеры', () => {
    expect(searchPhrases(phrases, 'студент').items.length).toBeGreaterThan(0);
    expect(examplesFor(phrases, 'ним').length).toBeGreaterThan(0);
  });
  it('подсветка', () => {
    expect(highlight('Ӟечбур!', 'зеч')).toEqual([
      ['Ӟеч', true],
      ['бур!', false],
    ]);
  });
});

describe('примеры к слову', () => {
  it('кыл — не путает с кылзыны «слушать»', () => {
    const ex = examplesFor(phrases, 'кыл');
    expect(ex.length).toBeGreaterThan(0);
    for (const p of ex) expect(p.udm.toLowerCase()).not.toMatch(/кылз/);
  });
  it('глагол — по основе', () => {
    expect(examplesFor(phrases, 'вераськыны').length).toBeGreaterThan(0);
  });
});
