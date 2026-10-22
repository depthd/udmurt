/**
 * Крошечный ZIP без сжатия (метод «stored»): чтобы носитель языка мог скачать свои записи
 * и проверки одним файлом. Аудио уже сжато (webm/opus, mp4/aac), поэтому сжатие не нужно.
 * Формат: PKWARE APPNOTE — локальные заголовки, центральный каталог, конец каталога. Имена в UTF-8.
 */

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export type ZipEntry = { name: string; data: Uint8Array | string };

/** Дата и время в формате MS-DOS. */
function dosTime(d: Date): { time: number; date: number } {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | Math.floor(d.getSeconds() / 2),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

export function makeZip(entries: ZipEntry[], when = new Date()): Uint8Array {
  const enc = new TextEncoder();
  const { time, date } = dosTime(when);
  const files = entries.map((e) => {
    const name = enc.encode(e.name);
    const data = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
    return { name, data, crc: crc32(data) };
  });
  const localSize = files.reduce((s, f) => s + 30 + f.name.length + f.data.length, 0);
  const centralSize = files.reduce((s, f) => s + 46 + f.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const v = new DataView(out.buffer);
  let p = 0;
  const offsets: number[] = [];
  const FLAG_UTF8 = 0x0800;

  for (const f of files) {
    offsets.push(p);
    v.setUint32(p, 0x04034b50, true);
    v.setUint16(p + 4, 20, true); // версия для распаковки
    v.setUint16(p + 6, FLAG_UTF8, true);
    v.setUint16(p + 8, 0, true); // stored
    v.setUint16(p + 10, time, true);
    v.setUint16(p + 12, date, true);
    v.setUint32(p + 14, f.crc, true);
    v.setUint32(p + 18, f.data.length, true);
    v.setUint32(p + 22, f.data.length, true);
    v.setUint16(p + 26, f.name.length, true);
    v.setUint16(p + 28, 0, true);
    out.set(f.name, p + 30);
    out.set(f.data, p + 30 + f.name.length);
    p += 30 + f.name.length + f.data.length;
  }
  const centralStart = p;
  files.forEach((f, i) => {
    v.setUint32(p, 0x02014b50, true);
    v.setUint16(p + 4, 20, true);
    v.setUint16(p + 6, 20, true);
    v.setUint16(p + 8, FLAG_UTF8, true);
    v.setUint16(p + 10, 0, true);
    v.setUint16(p + 12, time, true);
    v.setUint16(p + 14, date, true);
    v.setUint32(p + 16, f.crc, true);
    v.setUint32(p + 20, f.data.length, true);
    v.setUint32(p + 24, f.data.length, true);
    v.setUint16(p + 28, f.name.length, true);
    // доп. поле, комментарий, номер диска, атрибуты — нули
    v.setUint32(p + 42, offsets[i], true);
    out.set(f.name, p + 46);
    p += 46 + f.name.length;
  });
  v.setUint32(p, 0x06054b50, true);
  v.setUint16(p + 8, files.length, true);
  v.setUint16(p + 10, files.length, true);
  v.setUint32(p + 12, p - centralStart, true);
  v.setUint32(p + 16, centralStart, true);
  return out;
}
