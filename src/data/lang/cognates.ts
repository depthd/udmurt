/**
 * Родственные слова: удмуртский и пять языков уральской семьи.
 * Основа — docs/research/07-cognates.json и отчёт 07 §14.1–14.2 (UEW/Uralonet + Wiktionary).
 * Правила отбора:
 *  • оставлены только пары, подтверждённые источником в json/отчёте;
 *  • ячейки с ⚠️ (мар. ӱй, пыжаш, нӧлӧ; коми кувны, кин, би) НЕ показываются — формы не сверены по словарю;
 *  • строка «дом» (куа/корка) убрана: там родственна лишь часть сложного слова, без пояснения это вводит в заблуждение;
 *  • удмуртские формы сверены с public/data/dict.json (uniparser, MIT);
 *  • cognate: false — слово в языке есть, но другого происхождения (это тоже факт из источника).
 */
import { DICT, alatyrev, uew, wiktionary, REPORT_07, type Source } from './sources';

export type LangId = 'kpv' | 'mhr' | 'fin' | 'est' | 'hun';
export const LANGS: { id: LangId; ru: string; short: string; script: 'cyr' | 'lat' }[] = [
  { id: 'kpv', ru: 'коми', short: 'коми', script: 'cyr' },
  { id: 'mhr', ru: 'марийский (луговой)', short: 'марийский', script: 'cyr' },
  { id: 'fin', ru: 'финский', short: 'финский', script: 'lat' },
  { id: 'est', ru: 'эстонский', short: 'эстонский', script: 'lat' },
  { id: 'hun', ru: 'венгерский', short: 'венгерский', script: 'lat' },
];

export type CognateCell = {
  w: string;
  /** Значение, если отличается от удмуртского. */
  gloss?: string;
  /** false — другое слово, не родственное удмуртскому. */
  cognate: boolean;
};
export type CognateGroup = 'num' | 'body' | 'nature' | 'basic';
export const GROUPS: { id: CognateGroup | 'all'; ru: string }[] = [
  { id: 'all', ru: 'Все' },
  { id: 'num', ru: 'Числа' },
  { id: 'body', ru: 'Тело' },
  { id: 'nature', ru: 'Природа' },
  { id: 'basic', ru: 'Глаголы и «я, ты»' },
];

export type CognateRow = {
  id: string;
  ru: string;
  udm: string;
  udmGloss?: string;
  group: CognateGroup;
  /** Нет ключа — нет проверенной пары. */
  forms: Partial<Record<LangId, CognateCell>>;
  note?: string;
  source: Source[];
};

const y = (w: string, gloss?: string): CognateCell => (gloss ? { w, gloss, cognate: true } : { w, cognate: true });
const n = (w: string): CognateCell => ({ w, cognate: false });

export const COGNATES: CognateRow[] = [
  // ── числа ──
  { id: 'one', ru: 'один', udm: 'одӥг', group: 'num', forms: { kpv: y('ӧтик'), mhr: y('ик'), fin: y('yksi'), est: y('üks'), hun: n('egy') }, note: 'Венгерское _egy_ — другого происхождения. Корень «один» спрятан и в *укмыс* «девять».', source: [uew(145), wiktionary('одӥг'), wiktionary('egy', 'Hungarian'), DICT] },
  { id: 'two', ru: 'два', udm: 'кык', group: 'num', forms: { kpv: y('кык'), mhr: y('кок'), fin: y('kaksi'), est: y('kaks'), hun: y('kettő / két') }, source: [uew(227), DICT] },
  { id: 'three', ru: 'три', udm: 'куинь', group: 'num', forms: { kpv: y('куим'), mhr: y('кум'), fin: y('kolme'), est: y('kolm'), hun: y('három') }, source: [uew(341), DICT] },
  { id: 'four', ru: 'четыре', udm: 'ньыль', group: 'num', forms: { kpv: y('нёль'), mhr: y('ныл'), fin: y('neljä'), est: y('neli'), hun: y('négy') }, source: [uew(620), DICT] },
  { id: 'five', ru: 'пять', udm: 'вить', group: 'num', forms: { kpv: y('вит'), mhr: y('вич'), fin: y('viisi'), est: y('viis'), hun: y('öt') }, source: [uew(1154), DICT] },
  { id: 'six', ru: 'шесть', udm: 'куать', group: 'num', forms: { kpv: y('квайт'), mhr: y('куд'), fin: y('kuusi'), est: y('kuus'), hun: y('hat') }, source: [uew(433), DICT] },
  { id: 'seven', ru: 'семь', udm: 'сизьым', group: 'num', forms: { kpv: y('сизим'), mhr: y('шым'), fin: y('seitsemän'), est: y('seitse'), hun: n('hét') }, note: 'Венгерское _hét_ — отдельное заимствование.', source: [uew(1588), wiktionary('hét', 'Hungarian'), DICT] },
  { id: 'eight', ru: 'восемь', udm: 'тямыс', group: 'num', forms: { kpv: y('кӧкъямыс'), mhr: n('кандаш'), fin: n('kahdeksan'), est: n('kaheksa'), hun: n('nyolc') }, note: 'Только пермское слово: общее у удмуртов и коми.', source: [wiktionary('тямыс'), REPORT_07('§ 14.1'), DICT] },
  { id: 'nine', ru: 'девять', udm: 'укмыс', group: 'num', forms: { kpv: y('ӧкмыс'), mhr: n('индеш'), fin: n('yhdeksän'), est: n('üheksa'), hun: n('kilenc') }, note: 'Только пермское слово.', source: [wiktionary('укмыс'), uew(145), DICT] },
  { id: 'ten', ru: 'десять', udm: 'дас', group: 'num', forms: { kpv: y('дас'), mhr: n('лу'), fin: n('kymmenen'), est: n('kümme'), hun: n('tíz') }, note: 'Пермское слово, древнее заимствование из иранских языков.', source: [wiktionary('дас'), DICT] },
  { id: 'hundred', ru: 'сто', udm: 'сю', group: 'num', forms: { kpv: y('сё'), mhr: y('шӱдӧ'), fin: y('sata'), est: y('sada'), hun: y('száz') }, note: 'Общее для всех шести языков, но это не исконное слово: очень древнее заимствование из индоиранского (ср. лат. _centum_).', source: [uew(941), DICT] },
  // ── тело ──
  { id: 'eye', ru: 'глаз', udm: 'син', group: 'body', forms: { kpv: y('син'), mhr: y('шинча'), fin: y('silmä'), est: y('silm'), hun: y('szem') }, note: 'Древнее «м» живёт в формах: *синмын* «в глазу», ср. фин. _silmä_.', source: [uew(964), DICT] },
  { id: 'hand', ru: 'рука', udm: 'ки', group: 'body', forms: { kpv: y('ки'), mhr: y('кид'), fin: y('käsi'), est: y('käsi'), hun: y('kéz') }, source: [uew(271), DICT] },
  { id: 'heart', ru: 'сердце', udm: 'сюлэм', group: 'body', forms: { kpv: y('сьӧлӧм'), mhr: y('шӱм'), fin: y('sydän'), est: y('süda'), hun: y('szív') }, source: [uew(960), DICT] },
  { id: 'tongue', ru: 'язык', udm: 'кыл', udmGloss: 'язык; слово', group: 'body', forms: { kpv: y('кыв'), mhr: n('йылме'), fin: y('kieli'), est: y('keel'), hun: n('nyelv') }, note: 'Ловушка: *кыл* родственно финскому _kieli_, а венгерское _nyelv_ — марийскому _йылме_.', source: [uew(280), wiktionary('nyelv', 'Hungarian'), DICT] },
  { id: 'ear', ru: 'ухо', udm: 'пель', group: 'body', forms: { kpv: y('пель'), mhr: y('пылыш'), fin: n('korva'), est: n('kõrv'), hun: y('fül') }, source: [uew(740), DICT] },
  { id: 'blood', ru: 'кровь', udm: 'вир', group: 'body', forms: { kpv: y('вир'), mhr: y('вӱр'), fin: y('veri'), est: y('veri'), hun: y('vér') }, source: [uew(1152), DICT] },
  { id: 'bone', ru: 'кость', udm: 'лы', group: 'body', forms: { kpv: y('лы'), mhr: y('лу'), fin: y('luu'), est: y('luu') }, source: [uew(498), DICT] },
  { id: 'liver', ru: 'печень', udm: 'мус', group: 'body', forms: { kpv: y('мус'), mhr: y('мокш'), fin: y('maksa'), est: y('maks'), hun: y('máj') }, source: [uew(519), DICT] },
  { id: 'tooth', ru: 'зуб', udm: 'пинь', group: 'body', forms: { kpv: y('пинь'), mhr: y('пӱй'), fin: y('pii', 'зубец'), est: y('pii', 'зубец'), hun: y('fog') }, source: [uew(769), DICT] },
  // ── природа ──
  { id: 'water', ru: 'вода', udm: 'ву', group: 'nature', forms: { kpv: y('ва'), mhr: y('вӱд'), fin: y('vesi'), est: y('vesi'), hun: y('víz') }, source: [uew(1142), DICT] },
  { id: 'ice', ru: 'лёд', udm: 'йӧ', group: 'nature', forms: { kpv: y('йи'), mhr: y('ий'), fin: y('jää'), est: y('jää'), hun: y('jég') }, source: [uew(171), DICT] },
  { id: 'snow', ru: 'снег', udm: 'лымы', group: 'nature', forms: { kpv: y('лым'), mhr: y('лум'), fin: y('lumi'), est: y('lumi') }, source: [uew(496), DICT] },
  { id: 'fire', ru: 'огонь', udm: 'тыл', group: 'nature', forms: { mhr: y('тул'), fin: y('tuli'), est: y('tuli'), hun: n('tűz') }, note: 'Венгерское _tűz_ — другой корень.', source: [uew(1073), wiktionary('tűz', 'Hungarian'), DICT] },
  { id: 'winter', ru: 'зима', udm: 'тол', group: 'nature', forms: { kpv: y('тӧв'), mhr: y('теле'), fin: y('talvi'), est: y('talv'), hun: y('tél') }, source: [uew(1037), DICT] },
  { id: 'wind', ru: 'ветер', udm: 'тӧл', group: 'nature', forms: { kpv: y('тӧв'), fin: y('tuuli'), est: y('tuul') }, source: [wiktionary('тӧл'), DICT] },
  { id: 'night', ru: 'ночь', udm: 'уй', group: 'nature', forms: { kpv: y('вой'), mhr: n('йӱд'), fin: y('yö'), est: y('öö'), hun: y('éj') }, source: [uew(130), DICT] },
  { id: 'tree', ru: 'дерево', udm: 'пу', group: 'nature', forms: { kpv: y('пу'), mhr: y('пу'), fin: y('puu'), est: y('puu'), hun: y('fa') }, source: [uew(829), DICT] },
  { id: 'butter', ru: 'масло', udm: 'вӧй', group: 'nature', forms: { kpv: y('вый'), fin: y('voi'), est: y('või'), hun: y('vaj') }, source: [uew(1156), DICT] },
  { id: 'nest', ru: 'яйцо / гнездо', udm: 'пуз', udmGloss: 'яйцо', group: 'nature', forms: { kpv: y('поз', 'гнездо'), fin: y('pesä', 'гнездо'), est: y('pesa', 'гнездо'), hun: y('fészek', 'гнездо') }, note: 'В удмуртском значение сдвинулось к «яйцо».', source: [uew(753), DICT] },
  { id: 'arrow', ru: 'стрела', udm: 'ньӧл', group: 'nature', forms: { kpv: y('ньӧв'), fin: y('nuoli'), est: y('nool'), hun: y('nyíl') }, source: [uew(622), DICT] },
  { id: 'mouse', ru: 'мышь', udm: 'шыр', group: 'nature', forms: { kpv: y('шыр'), fin: y('hiiri'), est: y('hiir'), hun: y('egér') }, source: [uew(1006), DICT] },
  { id: 'fish', ru: 'рыба', udm: 'чорыг', group: 'nature', forms: { kpv: y('чери'), mhr: n('кол'), fin: n('kala'), est: n('kala'), hun: n('hal') }, note: 'У марийцев, финнов, эстонцев и венгров общее слово (_kala_), а у удмуртов и коми — своё.', source: [wiktionary('чорыг'), uew(228), DICT] },
  // ── глаголы и местоимения ──
  { id: 'live', ru: 'жить', udm: 'улыны', group: 'basic', forms: { kpv: y('овны'), mhr: y('илаш'), fin: y('elää'), est: y('elama'), hun: y('él') }, source: [uew(132), DICT] },
  { id: 'die', ru: 'умереть', udm: 'кулыны', group: 'basic', forms: { mhr: y('колаш'), fin: y('kuolla'), est: y('koolma', 'в диалектах'), hun: y('hal', 'обычно _meghal_') }, source: [uew(339), DICT] },
  { id: 'go', ru: 'идти', udm: 'мыныны', group: 'basic', forms: { kpv: y('мунны'), mhr: y('мияш'), fin: y('mennä'), est: y('minema'), hun: y('megy') }, source: [uew(536), DICT] },
  { id: 'eat', ru: 'есть (кушать)', udm: 'сиыны', group: 'basic', forms: { kpv: y('сёйны'), fin: y('syödä'), est: y('sööma'), hun: y('eszik') }, source: [uew(893), DICT] },
  { id: 'drink', ru: 'пить', udm: 'юыны', group: 'basic', forms: { kpv: y('юны'), mhr: y('йӱаш'), fin: y('juoda'), est: y('jooma'), hun: y('iszik') }, source: [uew(195), DICT] },
  { id: 'know', ru: 'знать', udm: 'тодыны', group: 'basic', forms: { kpv: y('тӧдны'), fin: y('tuntea', 'чувствовать; знать кого-то'), est: y('tundma'), hun: y('tud') }, source: [uew(1077), DICT] },
  { id: 'i', ru: 'я', udm: 'мон', group: 'basic', forms: { kpv: y('ме'), mhr: y('мый'), fin: y('minä'), est: y('mina'), hun: y('én') }, source: [uew(576), DICT] },
  { id: 'you', ru: 'ты', udm: 'тон', group: 'basic', forms: { kpv: y('тэ'), mhr: y('тый'), fin: y('sinä'), est: y('sina'), hun: y('te') }, source: [uew(1083), DICT] },
  { id: 'who', ru: 'кто', udm: 'кин', group: 'basic', forms: { mhr: y('кӧ'), fin: y('ken', 'книжн.; обычно _kuka_'), est: y('kes'), hun: y('ki') }, source: [uew(272), DICT] },
  { id: 'what', ru: 'что', udm: 'ма', group: 'basic', forms: { kpv: y('мый'), mhr: y('мо'), fin: y('mikä'), est: y('mis'), hun: y('mi') }, note: 'Есть и форма *мар* — в речи она даже чаще: *Мар та?* «Что это?».', source: [uew(581), alatyrev('§ 41'), DICT] },
];

export const COGNATES_INFO = {
  summary: 'Родство языков видно не по похожим словам вообще, а по общим древним корням. Здесь только пары, подтверждённые Уральским этимологическим словарём (UEW) и Викисловарём.',
  highlightNote: 'Подсветка показывает одинаковое начало слова «на слух». Это подсказка для глаза, а не научное правило: у родственных слов начало может не совпадать (*одӥг* — _yksi_), а у похожих — совпасть случайно.',
  myth: 'Финны не понимают удмуртов: по словам В. В. Напольских, разница — как между польским и немецким.',
  source: [REPORT_07('§§ 14.1–14.2, 15')],
};
