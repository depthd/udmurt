/** Карточки «Интересное» (отчёт 07 §§ 12–13, отчёт 04 §5.4). Лицевая сторона — вопрос, оборот — ответ. */
import { S } from './sources';
import type { Rich, Src } from './types';

export type FlipCard = {
  id: string;
  /** Крупная надпись на лицевой стороне. */
  front: string;
  frontLang?: 'udm';
  /** Вопрос-подсказка на лицевой стороне. */
  ask: string;
  title: string;
  text: Rich;
  src: Src[];
};

export const FACT_CARDS: FlipCard[] = [
  {
    id: 'buranovo',
    front: '2-е место',
    ask: 'Удмуртская песня на Евровидении — правда?',
    title: 'Бурановские бабушки',
    text: 'Фольклорная группа из села Бураново — по-удмуртски {udm:Брангуртысь песянайёс} ({udm:песянай} — «бабушка»). На Евровидении-2012 песня «Party for Everybody» — частично на английском, частично на удмуртском — набрала 259 баллов и заняла второе место.',
    src: [S.ruBuranovo, S.enBuranovo],
  },
  {
    id: 'wiki',
    front: '5 918',
    ask: 'статей в удмуртской Википедии. А когда она появилась?',
    title: 'Удмуртская Википедия',
    text: 'Открылась 24 октября 2005 года, тысячную статью написали в 2011-м. Главная страница называется {udm:Кутскон бам}. Писать туда может каждый, кто знает язык.',
    src: [S.ruUdmWiki, S.udmWikiStats],
  },
  {
    id: 'izhkar',
    front: 'Ижкар',
    frontLang: 'udm',
    ask: 'Что это за город?',
    title: 'Ижевск',
    text: '{udm:кар} — «город», так что {udm:Ижкар} — «Иж-город». А сама река Иж по-удмуртски называется совсем иначе — {udm:Оӵ}.',
    src: [S.udmWikiIzh, S.ruIzhRiver],
  },
  {
    id: 'shorkar',
    front: 'шоркар',
    frontLang: 'udm',
    ask: '«Середина» + «город» = ?',
    title: 'Столица',
    text: '{udm:шоркар} «столица» = {udm:шор} «середина» + {udm:кар} «город». Город посередине, главный.',
    src: [S.wiktShorkar, S.uniparser],
  },
  {
    id: 'puzkar',
    front: 'пузкар',
    frontLang: 'udm',
    ask: '«Яйцо» + «город» = ?',
    title: 'Гнездо',
    text: '{udm:пузкар} «гнездо» = {udm:пуз} «яйцо» + {udm:кар} «город». А {udm:пуз} родственно финскому {fi:pesä} и венгерскому {hu:fészek} — «гнездо».',
    src: [S.uew, S.uniparser],
  },
  {
    id: 'pelnyan',
    front: 'пельнянь',
    frontLang: 'udm',
    ask: 'Какое блюдо так называется?',
    title: 'Пельмени — «хлебное ухо»',
    text: '{udm:пельнянь} = {udm:пель} «ухо» + {udm:нянь} «хлеб». М. Фасмер считал, что отсюда (из коми и удмуртского) и русское слово «пельмени».',
    src: [S.wiktPelnyan, S.ruPelmeni],
  },
  {
    id: 'zuch',
    front: 'ӟуч',
    frontLang: 'udm',
    ask: 'Так называют русского. Откуда слово?',
    title: 'Слово с севера',
    text: '{udm:ӟуч} «русский» пришло из прибалтийско-финских языков, где значило «швед» (ср. фин. {fi:ruotsi} «Швеция»). Тот же корень, что и в слове «Русь».',
    src: [S.wiktZuch],
  },
  {
    id: 'welcome',
    front: 'Гажаса ӧтиськом',
    frontLang: 'udm',
    ask: 'Что написано на табличках в Ижевске?',
    title: '«Добро пожаловать»',
    text: 'Так встречают гостей двуязычные таблички. Внутри — глаголы {udm:гажаны} «уважать, любить» и {udm:ӧтьыны} «приглашать».',
    src: [S.enUdmurt, S.uniparser],
  },
  {
    id: 'cinema',
    front: 'Узы-Боры',
    frontLang: 'udm',
    ask: 'Есть ли кино на удмуртском?',
    title: 'Удмуртское кино',
    text: 'Есть! Например, польско-удмуртская комедия «Узы-Боры» и фильм {udm:«Пузкар»} («Гнездо», 2013).',
    src: [S.enUdmurt, S.ruLang],
  },
];

export const FACTS_SOURCES: Src[] = [S.ruBuranovo, S.ruUdmWiki, S.udmWikiStats, S.udmWikiIzh, S.wiktZuch, S.ruPelmeni, S.enUdmurt, S.uew];
