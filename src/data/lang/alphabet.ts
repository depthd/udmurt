/**
 * Алфавит: 38 букв (Алатырев 1983, § 5; ru.wikipedia «Удмуртская письменность»; отчёт 07 §6.2).
 * Описания звуков — только то, что подтверждено: Алатырев §§ 6–7, Напольских (лекция 2), en.wikipedia.
 * Никаких догадок в МФА: для ӧ источники расходятся (отчёт 07 §6.3, §15), поэтому даём практический совет.
 * Примеры слов сверены с public/data/dict.json (uniparser, MIT).
 */
import {
  alatyrev,
  DICT,
  EN_WIKI_UDM,
  GIELLALT_KBD,
  napolskikh,
  REPORT_04,
  REPORT_05,
  RU_WIKI_WRITING,
  UNICODE_CYRILLIC,
  type Source,
} from './sources';

export type AlphabetLetter = {
  upper: string;
  lower: string;
  /** Одна из пяти «удмуртских» букв с двумя точками. */
  special?: boolean;
  /** Ф, Х, Ц, Щ — только в заимствованиях из русского. */
  loanOnly?: boolean;
};

const ORDER = 'А Б В Г Д Е Ё Ж Ӝ З Ӟ И Ӥ Й К Л М Н О Ӧ П Р С Т У Ф Х Ц Ч Ӵ Ш Щ Ъ Ы Ь Э Ю Я'.split(' ');
const SPECIAL = new Set(['Ӝ', 'Ӟ', 'Ӥ', 'Ӧ', 'Ӵ']);
const LOAN_ONLY = new Set(['Ф', 'Х', 'Ц', 'Щ']);

export const ALPHABET = {
  letters: ORDER.map(
    (u): AlphabetLetter => ({
      upper: u,
      lower: u.toLowerCase(),
      ...(SPECIAL.has(u) ? { special: true } : {}),
      ...(LOAN_ONLY.has(u) ? { loanOnly: true } : {}),
    }),
  ),
  /** Удмуртские слова не пишутся этими буквами, только русские заимствования. */
  loanNote: 'Ф, Х, Ц, Щ пишутся только в словах, заимствованных из русского: *фосфор*, *художник*.',
  source: [alatyrev('§ 5'), RU_WIKI_WRITING],
};

export type Example = { udm: string; ru: string; source: Source[] };

export type SpecialLetter = {
  upper: string;
  lower: string;
  /** Как звучит — пересказ источника своими словами. */
  sound: string;
  /** Подсказка, на что похоже (только из источников). */
  hint: string;
  /** Пара/контраст с другой буквой. */
  pair?: string;
  examples: Example[];
  source: Source[];
};

const ex = (udm: string, ru: string, source: Source[] = [DICT]): Example => ({ udm, ru, source });

export const SPECIAL_LETTERS: SpecialLetter[] = [
  {
    upper: 'Ӝ',
    lower: 'ӝ',
    sound: 'Слитное «дж»: д и ж произносятся вместе, одним звуком.',
    hint: 'Похоже на английское j в слове jam.',
    pair: 'Звонкая пара к *Ӵ* (слитное «тш»).',
    examples: [ex('ӝук', 'каша', [alatyrev('§ 7'), DICT]), ex('ӝӧк', 'стол'), ex('ӝыт', 'вечер')],
    source: [alatyrev('§ 7'), EN_WIKI_UDM],
  },
  {
    upper: 'Ӟ',
    lower: 'ӟ',
    sound: 'Слитное мягкое «дзь»: мягкие д и з произносятся вместе, одним звуком.',
    hint: 'Как и удмуртские мягкие *з, с, ч*, звучит с лёгким «шепелявым» оттенком — мягче, чем в русском.',
    pair: 'Звонкая пара к *Ч*.',
    examples: [ex('ӟег', 'рожь', [alatyrev('§ 7'), DICT]), ex('ӟуч', 'русский'), ex('ӟечбур', 'здравствуй, привет')],
    source: [alatyrev('§ 7'), EN_WIKI_UDM],
  },
  {
    upper: 'Ӥ',
    lower: 'ӥ',
    sound: 'Звук «и», но согласный перед ним остаётся твёрдым.',
    hint: 'Пишется после *д, з, л, н, с, т*. Обычная *и* после них смягчает согласный, а *ӥ* — нет.',
    examples: [
      ex('дӥсь', 'одежда', [alatyrev('§ 6'), DICT]),
      ex('тӥр', 'топор', [alatyrev('§ 6'), DICT]),
      ex('сӥль', 'мясо', [alatyrev('§ 6'), DICT]),
      ex('тӥ', 'вы'),
    ],
    source: [alatyrev('§ 6'), RU_WIKI_WRITING],
  },
  {
    upper: 'Ӧ',
    lower: 'ӧ',
    sound: 'Особый гласный, которого нет в русском: средний, губы не округляются.',
    hint: 'Совет В. В. Напольских: приготовьтесь сказать «э», а скажите «о», не меняя положения губ. Лучше всего — услышать носителя.',
    examples: [ex('ӧвӧл', 'нет', [alatyrev('§ 6'), DICT]), ex('ӧс', 'дверь'), ex('вӧй', 'масло')],
    source: [alatyrev('§ 6'), napolskikh(2)],
  },
  {
    upper: 'Ӵ',
    lower: 'ӵ',
    sound: 'Твёрдое слитное «тш»: т и ш произносятся вместе, одним звуком.',
    hint: 'Похоже на английское ch в слове church. Это твёрдая пара к мягкому *Ч*.',
    pair: '*Ч ч* — мягкое «чь», мягче русского: *чечы* «мёд», *пичи* «маленький».',
    examples: [ex('ӵуж', 'жёлтый', [alatyrev('§ 7'), DICT]), ex('ӵын', 'дым')],
    source: [alatyrev('§ 7'), EN_WIKI_UDM],
  },
];

/** Код символа в виде U+04E7. */
export const codePoint = (ch: string) => 'U+' + (ch.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0');

export type TypingTip = { title: string; text: string; source: Source[] };

export const TYPING_TIPS: TypingTip[] = [
  {
    title: 'На этом сайте',
    text: 'В заданиях с вводом и в словаре над полем есть кнопки *ӝ ӟ ӥ ӧ ӵ*. Кнопка ⇧ делает букву заглавной.',
    source: [REPORT_04('§ 6.6')],
  },
  {
    title: 'Раскладка для телефона и компьютера',
    text: 'Удмуртская раскладка GiellaLT есть для Windows, macOS, Android и iOS (ставится через Divvun).',
    source: [GIELLALT_KBD, REPORT_05('§ 6')],
  },
  {
    title: 'По коду Unicode',
    text: 'В Word наберите код буквы (например, 04E7) и нажмите Alt+X. В Linux: Ctrl+Shift+U, код, затем пробел.',
    source: [UNICODE_CYRILLIC],
  },
  {
    title: 'Не подменяйте латиницей',
    text: 'Латинская _ö_ выглядит почти так же, как *ӧ*, но это другой символ: поиск и проверка ответа его не узнают.',
    source: [REPORT_04('§ 6.6')],
  },
];

/** Ударение: слово по слогам, номер ударного слога (с нуля). */
export type StressWord = { udm: string; syll: string[]; stress: number; ru: string; source: Source[] };
export type StressException = { text: string; examples: { udm: string; ru: string }[]; pair?: StressWord[]; source: Source[] };

const STRESS_WORDS: StressWord[] = [
  { udm: 'корка', syll: ['кор', 'ка'], stress: 1, ru: 'дом, изба', source: [napolskikh(2), DICT] },
  { udm: 'сюлэм', syll: ['сю', 'лэм'], stress: 1, ru: 'сердце', source: [napolskikh(2), DICT] },
  { udm: 'одӥг', syll: ['о', 'дӥг'], stress: 1, ru: 'один', source: [napolskikh(2), DICT] },
  { udm: 'удмурт', syll: ['уд', 'мурт'], stress: 1, ru: 'удмурт; удмуртский', source: [napolskikh(2), DICT] },
  { udm: 'вераськон', syll: ['ве', 'рась', 'кон'], stress: 2, ru: 'беседа, разговор', source: [alatyrev('§ 13')] },
];

const STRESS_EXCEPTIONS: StressException[] = [
  {
    text: 'Повелительное наклонение: ударение переходит на первый слог, и только оно отличает «говори!» от «говорит».',
    examples: [],
    pair: [
      { udm: 'вера', syll: ['ве', 'ра'], stress: 1, ru: 'говорит', source: [alatyrev('§ 13')] },
      { udm: 'вера', syll: ['ве', 'ра'], stress: 0, ru: 'говори!', source: [alatyrev('§ 13')] },
    ],
    source: [alatyrev('§§ 13, 49')],
  },
  {
    text: 'Ударной бывает отрицательная частица *эн* «не» в просьбах и запретах.',
    examples: [{ udm: 'эн вера', ru: 'не говори' }],
    source: [alatyrev('§ 49')],
  },
  {
    text: 'Некоторые наречия и местоимения с приставками *но-, коть-, оло-, ог-*: ударение зависит от выразительности речи.',
    examples: [
      { udm: 'ноку', ru: 'никогда' },
      { udm: 'котьку', ru: 'всегда, когда угодно' },
    ],
    source: [alatyrev('§ 13')],
  },
  { text: 'Поздние заимствования из русского языка.', examples: [], source: [napolskikh(2)] },
];

export const STRESS = {
  rule: 'Обычно ударение падает на последний слог. Ударный гласный длиннее безударного примерно в полтора раза, а безударные не ослабевают, как в русском: каждую гласную произносят чётко.',
  words: STRESS_WORDS,
  exceptions: STRESS_EXCEPTIONS,
  source: [alatyrev('§ 13'), napolskikh(2)],
};
