/**
 * Каталог источников раздела «О языке». Все факты сверены по отчёту
 * docs/research/07-udmurt-language-facts.md и грамматике Алатырева (1983).
 */
import type { Src } from './types';

const ru = (t: string) => `https://ru.wikipedia.org/wiki/${t}`;
const en = (t: string) => `https://en.wikipedia.org/wiki/${t}`;

export const S = {
  alatyrev: { label: 'В. И. Алатырев. Краткий грамматический очерк удмуртского языка (1983), §§ 1–5, 17' },
  vakhrushev: { label: 'Удмуртско-русский словарь под ред. В. М. Вахрушева (1983)' },
  napolskikh1: { label: 'В. В. Напольских. Удмуртский язык: лекция 1', url: 'http://udmurt.info/udmurt/lekcii/01.htm' },
  ruLang: { label: 'Википедия: Удмуртский язык', url: ru('Удмуртский_язык') },
  ruWriting: { label: 'Википедия: Удмуртская письменность', url: ru('Удмуртская_письменность') },
  ruPeople: { label: 'Википедия: Удмурты', url: ru('Удмурты') },
  ruPermic: { label: 'Википедия: Пермские языки', url: ru('Пермские_языки') },
  ruUdmurtia: { label: 'Википедия: Удмуртия', url: ru('Удмуртия') },
  ruGlazov: { label: 'Википедия: Глазов', url: ru('Глазов') },
  ruIzhRiver: { label: 'Википедия: Иж (приток Камы)', url: ru('Иж_(приток_Камы)') },
  ruKama: { label: 'Википедия: Кама', url: ru('Кама') },
  ruCheptsa: { label: 'Википедия: Чепца', url: ru('Чепца') },
  ruBesermDial: { label: 'Википедия: Бесермянское наречие', url: ru('Бесермянское_наречие') },
  ruBeserm: { label: 'Википедия: Бесермяне', url: ru('Бесермяне') },
  ruVeniamin: { label: 'Википедия: Вениамин (Пуцек-Григорович)', url: ru('Вениамин_(Пуцек-Григорович)') },
  ruBuranovo: { label: 'Википедия: Бурановские бабушки', url: ru('Бурановские_бабушки') },
  ruUdmWiki: { label: 'Википедия: Удмуртская Википедия', url: ru('Удмуртская_Википедия') },
  ruPelmeni: { label: 'Википедия: Пельмени', url: ru('Пельмени') },
  ruLanguagesRu: { label: 'Википедия: Языки России', url: ru('Языки_России') },
  enUdmurt: { label: 'Wikipedia: Udmurt language', url: en('Udmurt_language') },
  enGrammar: { label: 'Wikipedia: Udmurt grammar', url: en('Udmurt_grammar') },
  enUralic: { label: 'Wikipedia: Uralic languages', url: en('Uralic_languages') },
  enKomi: { label: 'Wikipedia: Komi language', url: en('Komi_language') },
  enBuranovo: { label: 'Wikipedia: Buranovskiye Babushki', url: en('Buranovskiye_Babushki') },
  enEndangered: { label: 'Wikipedia: List of endangered languages in Russia (по Атласу ЮНЕСКО 2010)', url: en('List_of_endangered_languages_in_Russia') },
  enUnescoDef: { label: 'Wikipedia: Endangered language — категории ЮНЕСКО', url: en('Endangered_language#UNESCO_definitions') },
  udmWikiGlaz: { label: 'Удмуртская Википедия: Глаз', url: 'https://udm.wikipedia.org/wiki/Глаз' },
  udmWikiIzh: { label: 'Удмуртская Википедия: Иж', url: 'https://udm.wikipedia.org/wiki/Иж' },
  udmWikiVotka: { label: 'Удмуртская Википедия: Вотка', url: 'https://udm.wikipedia.org/wiki/Вотка' },
  udmWikiStats: {
    label: 'Статистика удмуртской Википедии (на 22.10.2026)',
    url: 'https://udm.wikipedia.org/w/api.php?action=query&meta=siteinfo&siprop=statistics',
  },
  wiktMurt: { label: 'Викисловарь: мурт', url: 'https://en.wiktionary.org/wiki/мурт' },
  wiktZuch: { label: 'Викисловарь: ӟуч', url: 'https://en.wiktionary.org/wiki/ӟуч' },
  wiktShorkar: { label: 'Викисловарь: шоркар', url: 'https://en.wiktionary.org/wiki/шоркар' },
  wiktPelnyan: { label: 'Викисловарь: пельнянь', url: 'https://ru.wiktionary.org/wiki/пельнянь' },
  kaikki: { label: 'Kaikki.org: удмуртский Викисловарь (этимологии)', url: 'https://kaikki.org/dictionary/Udmurt/index.html' },
  uew: { label: 'UEW — Уральский этимологический словарь (Uralonet)', url: 'https://uralonet.nytud.hu/' },
  uniparser: { label: 'Лексикон uniparser-grammar-udm (УдмФИЦ УрО РАН, MIT)', url: 'https://github.com/timarkh/uniparser-grammar-udm' },
  nekrasova: {
    label: 'Г. А. Некрасова. О В. К. Кельмакове // Вестник УдГУ, 2022',
    url: 'https://journals.udsu.ru/history-philology/article/download/6836/6088',
  },
  karpova: {
    label: 'Л. Л. Карпова. О северноудмуртских диалектах // Вестник УдГУ, 2023',
    url: 'https://journals.udsu.ru/history-philology/article/download/8436/7232',
  },
  bolshakov: {
    label: 'А. Г. Большаков, М. Х. Фарукшин. Языковая ситуация в республиках Поволжья и Приуралья (2022)',
    url: 'https://cyberleninka.ru/article/n/yazykovaya-situatsiya-v-respublikah-povolzhya-i-priuralya-osnovnye-tendentsii-izmeneniy',
  },
  demoscope89: { label: 'Демоскоп: перепись 1989 г., РСФСР', url: 'https://www.demoscope.ru/weekly/ssp/rus_nac_89.php?reg=0' },
  grammar1775: { label: 'Грамматика 1775 г. в электронной библиотеке НБ УР', url: 'https://elibrary.unatlib.ru/handle/123456789/25424' },
} satisfies Record<string, Src>;
