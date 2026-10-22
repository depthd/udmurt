import type { Exercise } from './schema.ts';

/** Все id словника, на которые ссылается упражнение. */
export function exerciseRefs(ex: Exercise): string[] {
  switch (ex.type) {
    case 'teach':
    case 'tiles':
    case 'type':
    case 'build':
      return [ex.item];
    case 'choice':
      return [ex.item, ...ex.distractors];
    case 'listen':
      return [ex.item, ...ex.distractors];
    case 'match':
      return ex.items;
    case 'fill':
      return ex.item ? [ex.item] : [];
    case 'dialogue':
      return ex.lines.flatMap((l) => (l.item ? [l.item] : []));
  }
}

