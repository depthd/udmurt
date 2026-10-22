import { describe, expect, it } from 'vitest';
import { score, answerFor, dayIndex, keyMarks } from '../src/lib/wordle.ts';

describe('5 букв', () => {
  it('точные, похожие, есть и нет', () => {
    expect(score('корка', 'корка')).toEqual(['correct', 'correct', 'correct', 'correct', 'correct']);
    expect(score('сюлэм', 'сюрес')).toEqual(['correct', 'correct', 'absent', 'absent', 'absent']);
    expect(score('секыт', 'кусып')).toEqual(['present', 'absent', 'present', 'correct', 'absent']);
    expect(score('кужым', 'кужым')[0]).toBe('correct');
    expect(score('овол', 'ӧвӧл')).toEqual(['similar', 'correct', 'similar', 'correct']);
  });
  it('повторяющиеся буквы не засчитываются дважды', () => {
    expect(score('аааак', 'кааат')).toEqual(['absent', 'correct', 'correct', 'correct', 'present']);
  });
  it('слово дня детерминировано', () => {
    const list: [string, string][] = [['корка', 'дом'], ['нунал', 'день'], ['сюрес', 'дорога']];
    expect(answerFor(list, 5)).toEqual(answerFor(list, 5));
    expect(dayIndex(new Date(2026, 8, 2))).toBe(1);
  });
  it('цвета клавиш — лучшая оценка', () => {
    const km = keyMarks([
      { guess: 'аб', marks: ['present', 'absent'] },
      { guess: 'ба', marks: ['absent', 'correct'] },
    ]);
    expect(km['а']).toBe('correct');
  });
});
