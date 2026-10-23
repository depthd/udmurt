// Порядок «сначала карточка, потом проверка» (docs/research/03-learning-science.md): иначе слово попадает в повторение как выученное, хотя его не учили.
import path from 'node:path';
import { it, expect } from 'vitest';
import { loadCourse } from '../vite/load-content.ts';
import type { Exercise } from '../src/lib/content/schema.ts';

/** Слова, которые задание проверяет и оценивает (неверные варианты выбора сюда не входят). */
function tested(ex: Exercise): string[] {
  const e = ex as Exercise & { item?: string; items?: string[]; lines?: { item?: string }[] };
  if (e.type === 'match') return e.items ?? [];
  if (e.type === 'dialogue') return (e.lines ?? []).map((l) => l.item).filter((x): x is string => !!x);
  return e.item ? [e.item] : [];
}

it('каждое проверяемое слово сначала показано карточкой teach (в этом или раньшем уроке)', () => {
  const c = loadCourse(path.resolve('content'), { skipAudioCheck: true });
  const taught = new Set<string>();
  const bad: string[] = [];
  for (const u of c.units)
    for (const l of u.lessons)
      l.exercises.forEach((ex, i) => {
        if (ex.type === 'teach') return void taught.add(ex.item);
        for (const r of tested(ex)) if (!taught.has(r)) bad.push(`${l.id} #${i + 1} ${ex.type}: ${r}`);
      });
  expect(bad).toEqual([]);
});
