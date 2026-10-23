/**
 * Сравнение удмуртского с другими языками: грамматика (отчёт 07 §14.3 с его источниками)
 * и «что легко / что непривычно» русскоязычному.
 * В текстах: *…* — удмуртский, _…_ — другой язык (см. rich.ts).
 * like — наша оценка по этой же таблице: same — как в удмуртском, close — похоже, diff — иначе.
 */
import {
  alatyrev,
  EN_WIKI_FIN_ORTH,
  EN_WIKI_FINNISH,
  EN_WIKI_GRAMMAR,
  EN_WIKI_HUN_ALPHABET,
  EN_WIKI_HUN_NP,
  EN_WIKI_HUNGARIAN,
  EN_WIKI_TATAR,
  EN_WIKI_UDM,
  napolskikh,
  REPORT_07,
  RU_WIKI_TATAR,
  RU_WIKI_TATAR_WRITING,
  RU_WIKI_UDM,
  RU_WIKI_WRITING,
  WIKT_TATAR_BAR,
  type Source,
} from './sources';

export type CmpLang = 'udm' | 'rus' | 'fin' | 'hun' | 'tat' | 'eng';
export const COMPARE_LANGS: { id: CmpLang; ru: string; note: string }[] = [
  { id: 'udm', ru: 'Удмуртский', note: 'уральская семья, пермская ветвь' },
  { id: 'rus', ru: 'Русский', note: 'индоевропейская, славянская' },
  { id: 'fin', ru: 'Финский', note: 'уральская, прибалтийско-финская' },
  { id: 'hun', ru: 'Венгерский', note: 'уральская, угорская' },
  { id: 'tat', ru: 'Татарский', note: 'тюркская, кыпчакская' },
  { id: 'eng', ru: 'Английский', note: 'индоевропейская, германская' },
];

export type Like = 'self' | 'same' | 'close' | 'diff';
export type CmpCell = { text: string; like: Like };
export type CmpRow = { id: string; feature: string; cells: Record<CmpLang, CmpCell>; source: Source[] };

const c = (text: string, like: Like = 'diff'): CmpCell => ({ text, like });
const u = (text: string): CmpCell => ({ text, like: 'self' });

export const GRAMMAR_COMPARE: CmpRow[] = [
  {
    id: 'cases',
    feature: 'Падежи',
    cells: { udm: u('15 (8 + 7 местных)'), rus: c('6'), fin: c('15', 'same'), hun: c('18', 'close'), tat: c('6'), eng: c('нет (только _I / me_)') },
    source: [alatyrev('§ 17'), EN_WIKI_FINNISH, EN_WIKI_HUNGARIAN, EN_WIKI_TATAR],
  },
  {
    id: 'gender',
    feature: 'Грамматический род',
    cells: { udm: u('нет'), rus: c('3 рода'), fin: c('нет', 'same'), hun: c('нет', 'same'), tat: c('нет', 'same'), eng: c('только _he / she / it_', 'close') },
    source: [alatyrev('§ 16'), EN_WIKI_GRAMMAR, REPORT_07('§ 14.3')],
  },
  {
    id: 'articles',
    feature: 'Артикли',
    cells: { udm: u('нет; суффикс *-эз* иногда значит «тот самый»'), rus: c('нет', 'same'), fin: c('нет', 'same'), hun: c('есть: _a / az_, _egy_'), tat: c('нет', 'same'), eng: c('есть: _the_, _a / an_') },
    source: [EN_WIKI_GRAMMAR, EN_WIKI_HUNGARIAN, EN_WIKI_TATAR],
  },
  {
    id: 'harmony',
    feature: 'Гармония гласных',
    cells: { udm: u('нет'), rus: c('нет', 'same'), fin: c('есть'), hun: c('есть'), tat: c('есть'), eng: c('нет', 'same') },
    source: [EN_WIKI_UDM, RU_WIKI_UDM, EN_WIKI_FINNISH, EN_WIKI_HUNGARIAN, RU_WIKI_TATAR],
  },
  {
    id: 'stress',
    feature: 'Ударение',
    cells: { udm: u('обычно на последний слог'), rus: c('свободное, подвижное'), fin: c('на первый слог'), hun: c('на первый слог'), tat: c('обычно на последний слог', 'same'), eng: c('свободное') },
    source: [alatyrev('§ 13'), napolskikh(2), EN_WIKI_FINNISH, EN_WIKI_HUNGARIAN, EN_WIKI_TATAR],
  },
  {
    id: 'order',
    feature: 'Порядок слов',
    cells: { udm: u('SOV: глагол тянется в конец'), rus: c('SVO, свободный'), fin: c('SVO'), hun: c('свободный: решают тема и фокус'), tat: c('SOV', 'same'), eng: c('SVO, жёсткий') },
    source: [alatyrev('§ 69'), napolskikh(5), EN_WIKI_HUNGARIAN, REPORT_07('§ 14.3')],
  },
  {
    id: 'negation',
    feature: 'Отрицание',
    cells: {
      udm: u('отрицательный глагол: *уг, уд, уз…*, *ӧй, ӧд, ӧз…*, *эн*'),
      rus: c('частица «не»'),
      fin: c('отрицательный глагол: _en, et, ei…_', 'same'),
      hun: c('частица _nem_'),
      tat: c('суффикс глагола _-ма / -мә_'),
      eng: c('_not_ + _do_'),
    },
    source: [alatyrev('§ 51'), EN_WIKI_FINNISH, EN_WIKI_HUNGARIAN, EN_WIKI_TATAR],
  },
  {
    id: 'have',
    feature: '«У меня есть…»',
    cells: {
      udm: u('*Мынам книгае вань* — «моя книга-моя есть»'),
      rus: c('«У меня есть книга»'),
      fin: c('_Minulla on kirja_ — «у меня есть»'),
      hun: c('«мне» + _van_ «есть» + притяжательный суффикс', 'close'),
      tat: c('«мой» + притяжательный суффикс + _бар_ «есть»', 'same'),
      eng: c('_I have a book_'),
    },
    source: [EN_WIKI_GRAMMAR, EN_WIKI_FINNISH, EN_WIKI_HUN_NP, EN_WIKI_TATAR, WIKT_TATAR_BAR],
  },
  {
    id: 'possessive',
    feature: 'Притяжательные суффиксы',
    cells: { udm: u('да: *эше* «мой друг»'), rus: c('нет'), fin: c('да: _kirjani_ «моя книга»', 'same'), hun: c('да: _könyvem_ «моя книга»', 'same'), tat: c('да: _китабым_ «моя книга»', 'same'), eng: c('нет') },
    source: [alatyrev('§ 33'), EN_WIKI_FINNISH, EN_WIKI_HUNGARIAN, EN_WIKI_TATAR],
  },
  {
    id: 'adpositions',
    feature: 'Предлоги или послелоги',
    cells: { udm: u('послелоги: *ӝӧк вылын* «на столе»'), rus: c('предлоги'), fin: c('в основном послелоги', 'same'), hun: c('послелоги и падежи', 'same'), tat: c('послелоги', 'same'), eng: c('предлоги') },
    source: [alatyrev('§ 64'), REPORT_07('§ 14.3')],
  },
  {
    id: 'alphabet',
    feature: 'Алфавит',
    cells: { udm: u('кириллица, 38 букв'), rus: c('кириллица, 33', 'close'), fin: c('латиница, 29'), hun: c('латиница, 44'), tat: c('кириллица, 39', 'close'), eng: c('латиница, 26') },
    source: [alatyrev('§ 5'), RU_WIKI_WRITING, EN_WIKI_FIN_ORTH, EN_WIKI_HUN_ALPHABET, RU_WIKI_TATAR_WRITING],
  },
];

export const COMPARE_INFO = {
  takeaway: 'По «характеру» удмуртский во многом ближе соседу-татарскому (ударение в конце, глагол в конце, «моё-есть»), а корни и падежи роднят его с финским и венгерским. Родство и соседство — разные вещи.',
  source: [REPORT_07('§ 14.3')],
};

export type Point = { title: string; text: string; source: Source[] };

export const EASY: Point[] = [
  { title: 'Знакомые буквы', text: 'Кириллица: 33 русские буквы и ещё пять — *ӝ ӟ ӥ ӧ ӵ*.', source: [alatyrev('§ 5'), RU_WIKI_WRITING] },
  { title: 'Читается почти по-русски', text: 'Правила чтения в целом как в русском, поэтому русские слова пишутся без изменений: *студент*, *автобус*.', source: [RU_WIKI_WRITING] },
  { title: 'Нет рода', text: '*Со* — это и «он», и «она», и «оно». Не нужно согласовывать «новый / новая / новое».', source: [alatyrev('§ 16'), EN_WIKI_GRAMMAR] },
  { title: 'Ударение предсказуемо', text: 'Обычно на последний слог, исключения немногочисленны и системны.', source: [alatyrev('§ 13'), napolskikh(2)] },
  { title: 'Без «есть» в простых фразах', text: '*Мон студент.* — «Я студент». Связка не нужна, как и в русском.', source: [napolskikh(5)] },
  { title: 'Нет гармонии гласных', text: 'В отличие от финского и венгерского, суффиксы не меняют гласные под корень.', source: [EN_WIKI_UDM, napolskikh(1)] },
];

export const HARD: Point[] = [
  { title: 'Пять новых звуков', text: '*ӧ* — гласный, которого нет в русском; *ӝ, ӟ, ӵ* — слитные согласные; *ӥ* не смягчает согласный.', source: [alatyrev('§§ 6–7')] },
  { title: 'Мягкие с «шепелявым» оттенком', text: 'Удмуртские мягкие *з, с, ч* мягче русских: язык упирается в нижние зубы.', source: [alatyrev('§ 7'), napolskikh(2)] },
  { title: 'Безударные не ослабевают', text: 'Никакого аканья: *корка* читается с чётким «о».', source: [alatyrev('§ 13'), napolskikh(2)] },
  { title: 'Ж, з, ӝ, ӟ на конце не глохнут', text: '*уж* «работа» звучит именно [уж], а не [уш]. Другие звонкие на конце слова слегка оглушаются: *пыд* «нога» звучит почти как [пыт].', source: [napolskikh(2)] },
  { title: '15 падежей и послелоги', text: 'Вместо «в, из, до, по» — окончания: *шурын* «в реке», *шурысь* «из реки», *шурозь* «до реки».', source: [alatyrev('§§ 17–32')] },
  { title: '«Не» спрягается', text: '*уг тодӥськы* «я не знаю», *ӧй тоды* «я не знал»: отрицание меняется по лицам и временам.', source: [alatyrev('§ 51'), EN_WIKI_GRAMMAR] },
  { title: '«Мой» — это суффикс', text: '*эше* «мой друг», *эшмы* «наш друг». А «у меня есть» звучит как «моя книга-моя есть»: *Мынам книгае вань*.', source: [alatyrev('§ 33'), EN_WIKI_GRAMMAR] },
  { title: 'Глагол — в конце', text: '*Мон та книгаез лыдӟо* — дословно «я эту книгу прочту».', source: [alatyrev('§§ 47, 69')] },
  { title: 'Видел сам или «оказывается»', text: 'Есть отдельное прошедшее для того, чего говорящий не видел: *со верам* «он, оказывается, сказал».', source: [alatyrev('§ 48'), napolskikh(12)] },
];
