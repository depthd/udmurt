/** Уроки пары можно открыть по прямой ссылке на любом этапе личного курса. */
export const classLessons = [
  { id: 'u2-dates', label: 'Числительные от 1 до 31', minutes: 6 },
  { id: 'u7-calendar', label: 'Месяцы и времена года', minutes: 7 },
  { id: 'u11-survey', label: 'Два вопроса одногруппнику', minutes: 6 },
];
export const classLessonPath = (id: string) => `/lesson/${id}?class=1`;

export function nextClassPath(id: string): string {
  if (id === 'u10-body') return '/practice/body';
  const next = classLessons[classLessons.findIndex(lesson => lesson.id === id) + 1];
  return next ? classLessonPath(next.id) : '/class/survey';
}

// «Марым, лэся…», § 3.1.1–2. В составных числительных изменяется только последнее слово.
const ordinals = ['', 'нырысетӥ', 'кыкетӥ', 'куинетӥ', 'ньылетӥ', 'витетӥ', 'куатетӥ', 'сизьыметӥ', 'тямысэтӥ', 'укмысэтӥ'];
const tens = ['', 'дас', 'кызь', 'куамын'];
const roundOrdinals = ['', 'дасэтӥ', 'кызетӥ', 'куамынэтӥ'];

const units = ['', 'одӥг', 'кык', 'куинь', 'ньыль', 'вить', 'куать', 'сизьым', 'тямыс', 'укмыс'];

export function cardinalDay(day: number): string {
  if (!Number.isInteger(day) || day < 1 || day > 31) return '';
  return [tens[Math.floor(day / 10)], units[day % 10]].filter(Boolean).join(' ');
}

export function ordinalDay(day: number): string {
  if (!Number.isInteger(day) || day < 1 || day > 31) return '';
  if (day < 10) return ordinals[day];
  const decade = Math.floor(day / 10);
  const unit = day % 10;
  if (!unit) return roundOrdinals[decade];
  return `${tens[decade]} ${unit === 1 ? 'одӥгетӥ' : ordinals[unit]}`;
}

export const calendarMonths = [
  { id: 'month-jan', when: 'толшоре', days: 31 },
  { id: 'month-feb', when: 'тулыспалэ', days: 29 },
  { id: 'month-mar', when: 'южтолэзе', days: 31 },
  { id: 'month-apr', when: 'оштолэзе', days: 30 },
  { id: 'month-may', when: 'куартолэзе', days: 31 },
  { id: 'month-jun', when: 'инвожое', days: 30 },
  { id: 'month-jul', when: 'пӧсьтолэзе', days: 31 },
  { id: 'month-aug', when: 'гудырикошконэ', days: 31 },
  { id: 'month-sep', when: 'куарусёнэ', days: 30 },
  { id: 'month-oct', when: 'коньывуонэ', days: 31 },
  { id: 'month-nov', when: 'шуркынмонэ', days: 30 },
  { id: 'month-dec', when: 'толсуре', days: 31 },
];

export const seasons = [
  { id: 'season-winter', object: 'толэз' },
  { id: 'season-spring', object: 'тулысэз' },
  { id: 'season-summer', object: 'гужемез' },
  { id: 'season-autumn', object: 'сӥзьылэз' },
];
