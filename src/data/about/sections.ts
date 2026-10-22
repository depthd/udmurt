/** Оглавление страницы «О языке»: id совпадает с адресом #/about/<id>. */
import type { SectionMeta } from './types';

export const SECTIONS: SectionMeta[] = [
  { id: 'intro', label: 'Кратко' },
  { id: 'family', label: 'Родство' },
  { id: 'history', label: 'История' },
  { id: 'speakers', label: 'Носители' },
  { id: 'dialects', label: 'Наречия' },
  { id: 'glazov', label: 'Глазов' },
  { id: 'alphabet', label: 'Алфавит' },
  { id: 'grammar', label: 'Грамматика' },
  { id: 'compare', label: 'Сравнение' },
  { id: 'facts', label: 'Интересное' },
  { id: 'learn-more', label: 'Куда дальше' },
];

export const SECTION_IDS = SECTIONS.map((s) => s.id);
