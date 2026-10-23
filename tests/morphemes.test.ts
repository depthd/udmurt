import path from 'node:path';
import { it, expect } from 'vitest';

// Склейка морфем должна давать ровно удмуртский текст: на неё опираются «собери слово», разбор и читалка.
import { loadCourse } from '../vite/load-content.ts';
import { glue } from '../src/components/exercise2/logic.ts';
import { normalize } from '../src/lib/answer.ts';
it('морфемы каждой записи склеиваются ровно в её удмуртский текст', () => {
  const c = loadCourse(path.resolve('content'), { skipAudioCheck: true });
  const bad: string[] = [];
  for (const i of c.lexicon) {
    if (!i.morphemes.length) continue;
    const g = normalize(glue(i.morphemes.map((m) => ({ text: m.form, kind: m.kind }))));
    const u = normalize(i.udm);
    if (g !== u) bad.push(`${i.id}: «${g}» ≠ «${u}»`);
  }
  expect(bad).toEqual([]);
});
