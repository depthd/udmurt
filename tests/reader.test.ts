import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCourse } from '../vite/load-content.ts';
import { buildEntries } from '../src/lib/dict.ts';
import {
  tokenizeLine,
  morphemeWords,
  glossInMorphemes,
  buildCourseIndex,
  buildDictIndex,
  glossInDict,
  glossLocal,
  lemmaCandidates,
} from '../src/lib/reader.ts';

const course = loadCourse(path.resolve('content'));
const lex = new Map(course.lexicon.map((i) => [i.id, i]));
const courseIdx = buildCourseIndex(course.lexicon);
const dictIdx = buildDictIndex(buildEntries(JSON.parse(fs.readFileSync('public/data/dict.json', 'utf8')).entries));

describe('читалка: разбивка на слова', () => {
  it('слова и разделители', () => {
    const t = tokenizeLine('Татын такси вань-а?');
    expect(t.filter((x) => x.word).map((x) => x.text)).toEqual(['Татын', 'такси', 'вань-а']);
    expect(t.map((x) => x.text).join('')).toBe('Татын такси вань-а?');
  });
  it('удмуртские буквы — часть слова, тире — нет', () => {
    const t = tokenizeLine('Мынам кышное — дышетӥсь.');
    expect(t.filter((x) => x.word).map((x) => x.text)).toEqual(['Мынам', 'кышное', 'дышетӥсь']);
  });
});

describe('читалка: значение слова', () => {
  it('морфемы склеиваются в слова', () => {
    const it = lex.get('mon-shkolae-vetlisko')!;
    expect(morphemeWords(it.morphemes).map((g) => g.text)).toEqual(['мон', 'школае', 'ветлӥсько']);
  });
  it('берёт значение из разбора самой фразы', () => {
    const g = glossInMorphemes('ветлӥсько', lex.get('mon-shkolae-vetlisko')!.morphemes);
    expect(g?.gloss).toContain('ходить');
    expect(g?.parts?.length).toBe(2);
  });
  it('частица -а пишется через дефис и находится как одно слово', () => {
    const it = lex.get('ton-student-a')!;
    expect(morphemeWords(it.morphemes).map((g) => g.text)).toEqual(['тон', 'студент-а']);
    expect(glossInMorphemes('студент-а', it.morphemes)?.parts?.length).toBe(2);
  });
  it('слово-группа из двух слов', () => {
    expect(glossInMorphemes('нокытчы', lex.get('mon-nokytchy-no-ug-myniskhy')!.morphemes)?.gloss).toBe('никуда');
  });
  it('однословное слово курса', () => {
    expect(glossLocal('Мон', undefined, courseIdx)?.gloss).toBe('я');
    expect(glossLocal('вань-а', undefined, courseIdx)?.from).toBe('course');
  });
  it('словарь: точная форма', () => {
    expect(glossInDict('туннэ', dictIdx)?.gloss).toBe('сегодня');
  });
  it('словарь: форма без окончания', () => {
    expect(glossInDict('улӥсько', dictIdx)?.lemma).toBe('улыны');
    expect(glossInDict('лыдӟисько', dictIdx)?.lemma).toBe('лыдӟыны');
    expect(glossInDict('ужасько', dictIdx)?.lemma).toBe('ужаны');
    expect(glossInDict('карын', dictIdx)?.lemma).toBe('кар');
    expect(glossInDict('школае', dictIdx)?.lemma).toBe('школа');
  });
  it('кандидаты начинаются с самого слова', () => {
    expect(lemmaCandidates('Карын')[0]).toBe('карын');
  });
  it('каждое слово каждого текста читалки находит значение', () => {
    const missing: string[] = [];
    for (const t of course.texts)
      for (const l of t.lines) {
        const it = lex.get(l.item)!;
        for (const tok of tokenizeLine(it.udm.replace('{name}', 'Алексей')))
          if (tok.word && tok.text !== 'Алексей' && !glossLocal(tok.text, it, courseIdx) && !glossInDict(tok.text, dictIdx))
            missing.push(`${t.id}: ${tok.text}`);
      }
    expect(missing).toEqual([]);
  });
});
