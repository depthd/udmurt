/**
 * Источники для раздела «О языке» (алфавит, грамматика, сравнение).
 * У каждой записи в src/data/lang/* есть поле `source` — массив ссылок отсюда.
 * Книги под авторским правом (Алатырев 1983, Каракуловы 2001) только цитируются по параграфам:
 * тексты не копируются, факты пересказаны своими словами, примеры — отдельные словоформы.
 */
export type Source = {
  /** Короткая подпись: «Алатырев 1983, § 14». */
  title: string;
  url?: string;
};

const ALATYREV_URL = 'http://udmurt.info/library/alatyrev/grammatika/';

/** Алатырев В. И. Краткий грамматический очерк удмуртского языка (1983). */
export const alatyrev = (where: string): Source => ({
  title: `Алатырев 1983, ${where}`,
  url: ALATYREV_URL,
});

/** Напольских В. В. Лекции по удмуртскому языку (udmurt.info). Номер страницы ≠ номер лекции. */
export const napolskikh = (lecture: number, page = lecture): Source => ({
  title: `Напольских, лекция ${lecture}`,
  url: `http://udmurt.info/udmurt/lekcii/${String(page).padStart(2, '0')}.htm`,
});

/** Uralonet (UEW, Уральский этимологический словарь), номер статьи. */
export const uew = (id: number): Source => ({
  title: `UEW № ${id}`,
  url: `https://uralonet.nytud.hu/eintrag.cgi?id_eintrag=${id}`,
});

export const wiktionary = (word: string, section = 'Udmurt'): Source => ({
  title: `Wiktionary: ${word}`,
  url: `https://en.wiktionary.org/wiki/${encodeURIComponent(word)}#${section}`,
});

export const DICT: Source = {
  title: 'Словарь uniparser-grammar-udm (MIT)',
  url: 'https://github.com/timarkh/uniparser-grammar-udm',
};
export const TATOEBA: Source = { title: 'Tatoeba (CC BY 2.0 FR)', url: 'https://tatoeba.org/' };
export const WIKIVOYAGE: Source = {
  title: 'Wikivoyage: Udmurt phrasebook',
  url: 'https://en.wikivoyage.org/wiki/Udmurt_phrasebook',
};

export const RU_WIKI_WRITING: Source = {
  title: 'Википедия: Удмуртская письменность',
  url: 'https://ru.wikipedia.org/wiki/Удмуртская_письменность',
};
export const RU_WIKI_UDM: Source = {
  title: 'Википедия: Удмуртский язык',
  url: 'https://ru.wikipedia.org/wiki/Удмуртский_язык',
};
export const EN_WIKI_UDM: Source = {
  title: 'Wikipedia: Udmurt language',
  url: 'https://en.wikipedia.org/wiki/Udmurt_language',
};
export const EN_WIKI_GRAMMAR: Source = {
  title: 'Wikipedia: Udmurt grammar',
  url: 'https://en.wikipedia.org/wiki/Udmurt_grammar',
};
export const EN_WIKI_FINNISH: Source = {
  title: 'Wikipedia: Finnish grammar / Finnish language',
  url: 'https://en.wikipedia.org/wiki/Finnish_grammar',
};
export const EN_WIKI_FIN_ORTH: Source = {
  title: 'Wikipedia: Finnish orthography',
  url: 'https://en.wikipedia.org/wiki/Finnish_orthography',
};
export const EN_WIKI_HUNGARIAN: Source = {
  title: 'Wikipedia: Hungarian language',
  url: 'https://en.wikipedia.org/wiki/Hungarian_language',
};
export const EN_WIKI_HUN_NP: Source = {
  title: 'Wikipedia: Hungarian noun phrase',
  url: 'https://en.wikipedia.org/wiki/Hungarian_noun_phrase',
};
export const EN_WIKI_HUN_ALPHABET: Source = {
  title: 'Wikipedia: Hungarian alphabet',
  url: 'https://en.wikipedia.org/wiki/Hungarian_alphabet',
};
export const EN_WIKI_TATAR: Source = {
  title: 'Wikipedia: Tatar language',
  url: 'https://en.wikipedia.org/wiki/Tatar_language',
};
export const RU_WIKI_TATAR: Source = {
  title: 'Википедия: Татарский язык',
  url: 'https://ru.wikipedia.org/wiki/Татарский_язык',
};
export const RU_WIKI_TATAR_WRITING: Source = {
  title: 'Википедия: Татарская письменность',
  url: 'https://ru.wikipedia.org/wiki/Татарская_письменность',
};
export const WIKT_TATAR_BAR: Source = { title: 'Wiktionary: бар (Tatar)', url: 'https://en.wiktionary.org/wiki/бар#Tatar' };

export const UNICODE_CYRILLIC: Source = {
  title: 'Unicode: таблица «Кириллица» (U+0400–U+04FF)',
  url: 'https://www.unicode.org/charts/PDF/U0400.pdf',
};
export const GIELLALT_KBD: Source = {
  title: 'GiellaLT keyboard-udm (LGPL-3.0)',
  url: 'https://github.com/giellalt/keyboard-udm',
};
/** Наши исследовательские отчёты (в репозитории). */
export const REPORT_07 = (where: string): Source => ({
  title: `Отчёт 07 «Проверенные факты», ${where}`,
  url: 'https://github.com/depthd/udmurt/blob/HEAD/docs/research/07-udmurt-language-facts.md',
});
export const REPORT_04 = (where: string): Source => ({
  title: `Отчёт 04 «Дизайн», ${where}`,
  url: 'https://github.com/depthd/udmurt/blob/HEAD/docs/research/04-design-motion-system.md',
});
export const REPORT_05 = (where: string): Source => ({
  title: `Отчёт 05 «Открытые данные и инструменты», ${where}`,
  url: 'https://github.com/depthd/udmurt/blob/HEAD/docs/research/05-udmurt-open-data-and-tools.md',
});
