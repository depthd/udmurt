import { describe, expect, it } from 'vitest';
import { checkAnswer, normalize, tokenize } from '../src/lib/answer.ts';

describe('проверка ответов', () => {
  it('регистр, пунктуация и пробелы не важны', () => {
    expect(checkAnswer('  мон СТУДЕНТ!! ', ['Мон студент.']).ok).toBe(true);
  });
  it('пропущенная удмуртская буква — «почти»', () => {
    expect(checkAnswer('Ӟечлу', ['Ӟечбуресь']).ok).toBe(false);
    const w = checkAnswer('зечбуресь', ['Ӟечбуресь']);
    expect(w.ok && !w.exact && w.hint).toBe('diacritics');
  });
  it('латинская ö превращается в ӧ', () => {
    expect(normalize('öвöл')).toBe('ӧвӧл');
    expect(checkAnswer('Öвöл', ['Ӧвӧл']).ok).toBe(true);
  });
  it('комбинирующий диерезис', () => {
    expect(normalize('ӧвӧл')).toBe('ӧвӧл');
  });
  it('одна опечатка в середине длинного слова — «почти»', () => {
    expect(checkAnswer('студетн', ['студент']).ok).toBe(false); // перестановка = 2 правки и другое окончание
    const w = checkAnswer('стдент', ['студент']);
    expect(w.ok && !w.exact && w.hint).toBe('typo');
  });
  it('ошибки в окончаниях не прощаются', () => {
    expect(checkAnswer('Мынам нимы', ['Мынам нимыд']).ok).toBe(false);
    expect(checkAnswer('Мон Глазын', ['Мон Глазысь']).ok).toBe(false);
  });
  it('неверный ответ', () => {
    expect(checkAnswer('тон', ['мон']).ok).toBe(false);
  });
  it('тире между словами не мешает', () => {
    expect(checkAnswer('Мынам кышное дышетӥсь', ['Мынам кышное — дышетӥсь.']).ok).toBe(true);
    expect(tokenize('Мынам кышное — дышетӥсь.')).toEqual(['Мынам', 'кышное', 'дышетӥсь']);
    expect(normalize('анай-атай')).toBe('анай-атай');
  });
  it('плитки', () => {
    expect(tokenize('Мынам нимы Алексей.')).toEqual(['Мынам', 'нимы', 'Алексей']);
  });
});
