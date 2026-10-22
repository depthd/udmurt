import { describe, expect, it } from 'vitest';
import type { LexItem } from '../src/lib/content/schema';
import { buildOptions, fillDistractors, isChoiceKey, keyIndex, keyLabel, lettersNote, matchColumns } from '../src/components/exercise/options';

const lex = (id: string, udm: string, ru: string, kind: LexItem['kind'] = 'word', status: LexItem['status'] = 'sourced'): LexItem => ({
  id,
  udm,
  ru,
  ru_alt: [],
  udm_alt: [],
  kind,
  morphemes: [],
  audio_synth: false,
  status,
  sources: [{ id: 'test' }],
  tags: [],
});

const tau = lex('tau', 'Тау!', 'Спасибо!', 'phrase');
const ben = lex('ben', 'Бен.', 'Да.');
const ovol = lex('ovol', 'Ӧвӧл.', 'Нет.');
const zech = lex('zech', 'Ӟечбур!', 'Здравствуй!', 'phrase');
const dup = lex('dup', 'Тау-тау', 'спасибо!', 'phrase');
const draft = lex('draft', 'Черновик', 'Черновик', 'word', 'draft');

describe('buildOptions', () => {
  it('содержит правильный ответ и обманки, порядок детерминирован', () => {
    const a = buildOptions(tau, [ben, ovol], 'ru', 'seed-1');
    const b = buildOptions(tau, [ben, ovol], 'ru', 'seed-1');
    expect(a.map((o) => o.id).sort()).toEqual(['ben', 'ovol', 'tau']);
    expect(a).toEqual(b);
    expect(a.every((o) => o.lang === 'ru')).toBe(true);
  });

  it('отбрасывает обманки с тем же текстом и само слово', () => {
    const opts = buildOptions(tau, [dup, tau, ben], 'ru', 's');
    expect(opts.map((o) => o.id).sort()).toEqual(['ben', 'tau']);
  });

  it('подставляет имя через fmt', () => {
    const mon = lex('mon-name', 'Мон {name}.', 'Я {name}.');
    const opts = buildOptions(mon, [ben], 'udm', 's', (s) => s.replace('{name}', 'Олег'));
    expect(opts.find((o) => o.id === 'mon-name')?.text).toBe('Мон Олег.');
  });
});

describe('fillDistractors', () => {
  it('добирает обманки из словника, без черновиков и без самого слова', () => {
    const out = fillDistractors(tau, [], [tau, ben, ovol, zech, draft], 'x', 3);
    expect(out).toHaveLength(3);
    expect(out.map((d) => d.id)).not.toContain('tau');
    expect(out.map((d) => d.id)).not.toContain('draft');
    // сначала того же вида (phrase)
    expect(out[0].id).toBe('zech');
  });

  it('не трогает список, если обманок хватает', () => {
    expect(fillDistractors(tau, [ben, ovol], [zech], 'x', 2).map((d) => d.id)).toEqual(['ben', 'ovol']);
  });
});

describe('matchColumns', () => {
  it('правый столбец — перестановка и не совпадает с левым построчно', () => {
    const ids = ['a', 'b', 'c', 'd'];
    for (const seed of ['1', '2', '3', 'abc', 'u1-l1']) {
      const { left, right } = matchColumns(ids, seed);
      expect([...left].sort()).toEqual(ids);
      expect([...right].sort()).toEqual(ids);
      expect(right.every((id, i) => id === left[i])).toBe(false);
    }
  });
});

describe('клавиши', () => {
  it('keyLabel и keyIndex взаимно обратны', () => {
    for (let i = 0; i < 10; i++) expect(keyIndex(keyLabel(i)!)).toBe(i);
    expect(keyLabel(10)).toBeUndefined();
    expect(keyIndex('a')).toBe(-1);
  });

  it('isChoiceKey игнорирует поля ввода, модификаторы и автоповтор', () => {
    const ev = (key: string, extra: Partial<KeyboardEvent> = {}, tagName = 'BODY') =>
      ({ key, repeat: false, ctrlKey: false, metaKey: false, altKey: false, target: { tagName, isContentEditable: false }, ...extra }) as unknown as KeyboardEvent;
    expect(isChoiceKey(ev('2'))).toBe(true);
    expect(isChoiceKey(ev('2', {}, 'INPUT'))).toBe(false);
    expect(isChoiceKey(ev('2', { ctrlKey: true }))).toBe(false);
    expect(isChoiceKey(ev('2', { repeat: true }))).toBe(false);
    expect(isChoiceKey(ev('Enter'))).toBe(false);
  });
});

describe('lettersNote', () => {
  it('называет пропущенные буквы', () => {
    expect(lettersNote(['ӧ'])).toContain('«ӧ»');
    expect(lettersNote(['ӧ', 'ӥ'])).toContain('«ӥ»');
    expect(lettersNote([])).toContain('ӧ');
  });
});
