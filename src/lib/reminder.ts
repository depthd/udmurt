/**
 * Напоминание без push-уведомлений: файл календаря (.ics) с ежедневным событием и сигналом.
 * Открывается в «Календаре» iPhone, Google Календаре, Outlook.
 */
const pad = (n: number) => String(n).padStart(2, '0');

export function makeIcs(time: string, url: string, now = new Date()): string {
  const [h, m] = time.split(':').map(Number);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  if (start <= now) start.setDate(start.getDate() + 1);
  const dt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(start.getTime() + 10 * 60e3);
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Udmurt kyl//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:udmurt-kyl-daily-${stamp}@depthd.github.io`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dt(start)}`,
    `DTEND:${dt(end)}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Удмурт кыл — 5 минут 🔥',
    `DESCRIPTION:Один урок — и серия дней продлена. ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Пора на урок удмуртского!',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadIcs(time: string) {
  const url = `${location.origin}${import.meta.env.BASE_URL}`;
  const blob = new Blob([makeIcs(time, url)], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'udmurt-kyl-napominanie.ics';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
