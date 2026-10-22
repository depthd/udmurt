/**
 * Переписи (отчёт 07 §8). Важно: «удмуртов по национальности» и «владеют удмуртским» — разные вопросы.
 * 1989 — РСФСР (сопоставимо с переписями России); цифры владения языком за 1989 г. у нас нет.
 */
import { S } from './sources';
import type { Src } from './types';

export type Census = {
  year: number;
  label: string;
  /** Удмуртов по национальности. */
  ethnic: number;
  /** Владеют удмуртским языком (null — нет сопоставимой цифры). */
  speakers: number | null;
  note?: string;
};

export const CENSUS: Census[] = [
  {
    year: 1989,
    label: '1989',
    ethnic: 714833,
    speakers: null,
    note: 'Данные по РСФСР. Сопоставимой цифры «владеют языком» нет; родным удмуртский тогда назвали 69,6 % удмуртов.',
  },
  { year: 2002, label: '2002', ethnic: 636906, speakers: 463837 },
  { year: 2010, label: '2010', ethnic: 552299, speakers: 324338 },
  { year: 2021, label: '2021', ethnic: 386465, speakers: 255877, note: 'Перепись проходила в 2020–2021 гг.' },
];

export const CENSUS_SOURCES: Src[] = [S.demoscope89, S.ruPeople, S.ruLang, S.ruLanguagesRu, S.bolshakov];

export const SPEAKERS_SOURCES: Src[] = [
  ...CENSUS_SOURCES,
  S.ruUdmurtia,
  S.ruGlazov,
  S.enEndangered,
  S.enUnescoDef,
];
