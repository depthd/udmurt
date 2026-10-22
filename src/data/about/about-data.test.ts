/**
 * Проверка данных раздела «О языке»: удмуртский текст — кириллица в NFC без латинских двойников,
 * у каждого блока есть источники, оглавление согласовано, цифры переписей не перепутаны.
 */
import { describe, expect, it } from 'vitest';
import { parseRich, udmPieces } from './rich';
import { SECTIONS, SECTION_IDS } from './sections';
import { INTRO_FACTS, INTRO_SOURCES } from './intro';
import { FAMILY, FAMILY_SOURCES } from './family';
import { HISTORY, HISTORY_SOURCES } from './history';
import { CENSUS, SPEAKERS_SOURCES } from './speakers';
import { CITIES, DIALECTS, DIALECT_SOURCES } from './dialects';
import { GLAZOV_FACTS, GLAZOV_SOURCES, NAME_VERSIONS } from './glazov';
import { FACT_CARDS, FACTS_SOURCES } from './facts';
import { S } from './sources';
import type { Src } from './types';

const rich: string[] = [
  ...FAMILY.map((n) => n.info),
  ...HISTORY.map((e) => e.text),
  ...DIALECTS.map((d) => d.text),
  ...CITIES.map((c) => c.info),
  ...GLAZOV_FACTS.map((f) => f.text),
  ...NAME_VERSIONS.map((v) => v.claim),
  ...FACT_CARDS.map((c) => c.text),
];
const udmStrings: string[] = [
  ...rich.flatMap(udmPieces),
  ...CITIES.flatMap((c) => [c.udm, ...(c.alt ? c.alt.split(', ') : [])]),
  ...FACT_CARDS.filter((c) => c.frontLang === 'udm').map((c) => c.front),
  ...GLAZOV_FACTS.filter((f) => f.bigLang === 'udm').map((f) => f.big),
  ...INTRO_FACTS.flatMap((f) => (f.letters ? [f.letters] : [])),
];

describe('about: удмуртский текст', () => {
  it('есть что проверять', () => {
    expect(udmStrings.length).toBeGreaterThan(60);
  });
  it.each(udmStrings)('«%s» — NFC, кириллица, без латинских двойников', (w) => {
    expect(w).toBe(w.normalize('NFC'));
    expect(w).not.toMatch(/[A-Za-z̀-ͯ]/);
    expect(w).toMatch(/[Ѐ-ӿ]/);
  });
  it('разметка {код:слово} всегда закрыта', () => {
    for (const t of rich) {
      const plain = parseRich(t)
        .filter((s) => !s.lang)
        .map((s) => s.t)
        .join('');
      expect(plain, t).not.toMatch(/\{[a-z]+:/);
    }
  });
});

describe('about: источники', () => {
  const all: Src[][] = [INTRO_SOURCES, FAMILY_SOURCES, HISTORY_SOURCES, SPEAKERS_SOURCES, DIALECT_SOURCES, GLAZOV_SOURCES, FACTS_SOURCES];
  it('у каждого раздела есть источники со ссылками', () => {
    for (const list of all) {
      expect(list.length).toBeGreaterThan(0);
      expect(list.some((s) => s.url)).toBe(true);
    }
  });
  it('ссылки — абсолютные http(s)', () => {
    for (const s of Object.values(S) as Src[]) if (s.url) expect(s.url).toMatch(/^https?:\/\//);
  });
  it('у каждого события и каждой карточки свой источник', () => {
    for (const e of HISTORY) expect(e.src.length, e.title).toBeGreaterThan(0);
    for (const c of FACT_CARDS) expect(c.src.length, c.id).toBeGreaterThan(0);
  });
});

describe('about: структура', () => {
  it('оглавление: уникальные id, нужные разделы', () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTIONS.length);
    for (const id of ['intro', 'family', 'history', 'speakers', 'dialects', 'glazov', 'alphabet', 'grammar', 'compare', 'facts', 'learn-more'])
      expect(SECTION_IDS).toContain(id);
  });
  it('дерево: у всех родителей есть узел, удмуртский — пермский', () => {
    const ids = new Set(FAMILY.map((n) => n.id));
    for (const n of FAMILY) if (n.parent) expect(ids.has(n.parent), n.id).toBe(true);
    expect(FAMILY.find((n) => n.id === 'udm')?.parent).toBe('permic');
    // Родитель всегда выше ребёнка — иначе ветки не нарисовать.
    FAMILY.forEach((n, i) => n.parent && expect(FAMILY.findIndex((p) => p.id === n.parent)).toBeLessThan(i));
  });
  it('переписи: по годам, цифры из отчёта 07 §8', () => {
    expect(CENSUS.map((c) => c.year)).toEqual([1989, 2002, 2010, 2021]);
    expect(CENSUS.at(-1)).toMatchObject({ ethnic: 386465, speakers: 255877 });
    expect(INTRO_FACTS[0].value).toBe(255877);
    for (const c of CENSUS) if (c.speakers !== null) expect(c.speakers).toBeLessThan(c.ethnic);
  });
});
