import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../src/lib/answer';
import {
  almostNote,
  assemble,
  buildIsCorrect,
  dialogueSides,
  fillParts,
  fillSentence,
  glue,
  morphPieces,
  pieceLabel,
  tilePieces,
  tilesGrade,
  typeGrade,
} from '../src/components/exercise2/logic';

describe('tilePieces', () => {
  it('содержит слова ответа и обманки, без пунктуации', () => {
    const p = tilePieces('Бадӟым тау!', ['Ӟеч', 'лу'], 'seed');
    expect(p.map((x) => x.text).sort()).toEqual(['Бадӟым', 'Ӟеч', 'лу', 'тау'].sort());
    expect(p.filter((x) => x.correctAt >= 0).sort((a, b) => a.correctAt - b.correctAt).map((x) => x.text)).toEqual(['Бадӟым', 'тау']);
  });

  it('детерминирован по зерну', () => {
    const a = tilePieces('Мон студент ӧвӧл.', ['тон'], 's1').map((x) => x.key);
    const b = tilePieces('Мон студент ӧвӧл.', ['тон'], 's1').map((x) => x.key);
    expect(a).toEqual(b);
  });

  it('обманка, совпадающая со словом ответа, отбрасывается', () => {
    const p = tilePieces('Мон Алексей.', ['мон', 'тон', 'тон'], 's');
    expect(p.map((x) => x.text).sort()).toEqual(['Алексей', 'Мон', 'тон'].sort());
  });

  it('банк не лежит в правильном порядке', () => {
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      const p = tilePieces('Мынам нимы Алексей.', [], seed);
      expect(p.map((x) => x.correctAt)).not.toEqual([0, 1, 2]);
    }
  });

  it('собранная строка проверяется без учёта регистра и пунктуации', () => {
    const p = tilePieces('Бадӟым тау!', ['лу'], 'x');
    const order = [...p.keys()].filter((i) => p[i].correctAt >= 0).sort((a, b) => p[a].correctAt - p[b].correctAt);
    const v = checkAnswer(assemble(p, order), ['Бадӟым тау!']);
    expect(v.ok && v.exact).toBe(true);
    expect(tilesGrade(v)).toBe(3);
    expect(tilesGrade(checkAnswer('тау бадӟым', ['Бадӟым тау!']))).toBe(1);
  });
});

describe('morphPieces / glue', () => {
  const nimy = [
    { form: 'ним', meaning: 'имя', kind: 'root' as const },
    { form: 'ы', meaning: 'мой', kind: 'suffix' as const },
  ];

  it('морфемы + обманки-суффиксы, обманка-дубль отбрасывается', () => {
    const p = morphPieces(nimy, ['ыд', 'ысь', 'ы'], 'нимы', 's');
    expect(p).toHaveLength(4);
    expect(p.filter((x) => x.correctAt < 0).every((x) => x.kind === 'suffix')).toBe(true);
    expect(pieceLabel(p.find((x) => x.text === 'ы')!)).toBe('-ы');
  });

  it('склеивает морфемы слитно, отдельные слова — через пробел', () => {
    expect(glue([{ text: 'ним', kind: 'root' }, { text: 'ы', kind: 'suffix' }])).toBe('нимы');
    expect(
      glue([
        { text: 'мынам', kind: 'word' },
        { text: 'ним', kind: 'root' },
        { text: 'ы', kind: 'suffix' },
      ]),
    ).toBe('мынам нимы');
    // корень после суффикса — новое слово
    expect(
      glue([
        { text: 'школа', kind: 'root' },
        { text: 'е', kind: 'suffix' },
        { text: 'ветл', kind: 'root' },
        { text: 'ӥсько', kind: 'suffix' },
      ]),
    ).toBe('школае ветлӥсько');
    // часть с дефисом впереди — через дефис: студент + -а, анай + -атай
    expect(glue([{ text: 'тон', kind: 'word' }, { text: 'студент', kind: 'root' }, { text: '-а', kind: 'particle' }])).toBe('тон студент-а');
    expect(glue([{ text: 'анай', kind: 'word' }, { text: '-атай', kind: 'word' }])).toBe('анай-атай');
    // два корня подряд — сложное слово, слитно
    expect(glue([{ text: 'покчи', kind: 'root' }, { text: 'арня', kind: 'root' }])).toBe('покчиарня');
  });

  it('проверка сборки', () => {
    expect(buildIsCorrect([{ text: 'ним', kind: 'root' }, { text: 'ы', kind: 'suffix' }], nimy)).toBe(true);
    expect(buildIsCorrect([{ text: 'ним', kind: 'root' }, { text: 'ыд', kind: 'suffix' }], nimy)).toBe(false);
    expect(buildIsCorrect([{ text: 'ы', kind: 'suffix' }, { text: 'ним', kind: 'root' }], nimy)).toBe(false);
    expect(buildIsCorrect([], nimy)).toBe(false);
  });

  it('без морфем — один кубик-слово', () => {
    const p = morphPieces([], [], 'тау', 's');
    expect(p).toEqual([{ key: 'm0', text: 'тау', kind: 'root', note: '', correctAt: 0 }]);
  });
});

describe('type: оценки и подсказки', () => {
  it('диакритика → «почти» с буквой', () => {
    const v = checkAnswer('Озьы', ['Озьы']);
    expect(v.ok).toBe(true);
    const d = checkAnswer('Тон студент-а', ['Тон студент-а?']);
    expect(d.ok && d.exact).toBe(true);
    const almost = checkAnswer('Мон студент овол', ['Мон студент ӧвӧл.']);
    expect(almost.ok && !almost.exact).toBe(true);
    expect(almostNote(almost)).toBe('Обратите внимание на букву: ӧ (не о).');
    expect(typeGrade(almost, 1000)).toBe(2);
  });

  it('несколько букв — во множественном числе', () => {
    const v = checkAnswer('зеч ло', ['Ӟеч лӧ']);
    expect(almostNote(v)).toBe('Обратите внимание на буквы: ӟ (не з), ӧ (не о).');
  });

  it('быстро и точно — 4, медленно — 3, неверно — 1', () => {
    const v = checkAnswer('Тау!', ['Тау!']);
    expect(typeGrade(v, 3000)).toBe(4);
    expect(typeGrade(v, 9000)).toBe(3);
    expect(typeGrade(checkAnswer('бен', ['Тау!']), 1000)).toBe(1);
    expect(almostNote(v)).toBeUndefined();
  });
});

describe('fill', () => {
  it('пропуск-окончание приклеен к слову', () => {
    expect(fillParts('Мон Ижкар___.')).toEqual({ before: 'Мон Ижкар', after: '.', suffix: true });
    expect(fillParts('Мон студент ___.')).toEqual({ before: 'Мон студент ', after: '.', suffix: false });
    expect(fillParts('___ тау!').suffix).toBe(false);
    expect(fillSentence('Мон Ижкар___.', 'ысь')).toBe('Мон Ижкарысь.');
  });
});

describe('dialogueSides', () => {
  it('ученик справа, собеседники слева', () => {
    expect(dialogueSides([{ who: 'Даша' }, { who: '{name}' }, { who: '{name}' }, { who: 'Даша' }])).toEqual(['left', 'right', 'right', 'left']);
  });
  it('без ученика — говорящие чередуются, один и тот же всегда на одной стороне', () => {
    expect(dialogueSides([{ who: 'Даша' }, { who: 'Петя' }, { who: 'Даша' }, { who: 'Петя' }])).toEqual(['left', 'right', 'left', 'right']);
  });
});
