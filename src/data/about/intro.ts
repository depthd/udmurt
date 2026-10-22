/** «Цифры-факты» для героя страницы. Каждая цифра — со ссылкой на источник. */
import { S } from './sources';
import type { Src } from './types';

export type IntroFact = {
  value: number;
  /** С какого числа начинать счётчик (для года — не с нуля). */
  from?: number;
  /** Без разбивки на разряды (для года). */
  plain?: boolean;
  label: string;
  note: string;
  /** Показать буквы вместо пояснения. */
  letters?: string;
  wide?: boolean;
};

export const INTRO_FACTS: IntroFact[] = [
  {
    value: 255877,
    label: 'человек владеют удмуртским языком',
    note: 'по переписи 2020–2021 гг.',
    wide: true,
  },
  { value: 15, label: 'падежей', note: 'у неодушевлённых существительных; у одушевлённых в основном 8' },
  { value: 38, label: 'букв в алфавите', note: '33 — как в русском, и ещё 5 своих' },
  { value: 5, label: 'своих букв', note: 'с двумя точками сверху', letters: 'ӝ ӟ ӥ ӧ ӵ' },
  { value: 2, label: 'государственных языка Удмуртии', note: 'удмуртский и русский' },
  { value: 1775, from: 1700, plain: true, label: 'год первой грамматики', note: 'издана Академией наук в Петербурге', wide: true },
];

export const INTRO_SOURCES: Src[] = [S.ruPeople, S.ruLanguagesRu, S.alatyrev, S.ruWriting, S.ruUdmurtia];
