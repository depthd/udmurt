/**
 * Крошечный безопасный рендер Markdown для шпаргалок юнитов (unit.guide).
 *
 * Поддерживается ровно то, что пишут в content/units/*\/unit.yaml:
 *   # / ## / ### заголовки, списки «- » / «* » и «1. », **жирный**, *курсив*, `код`, абзацы,
 *   таблицы «| a | b |» (вторая строка «|---|---|» — разделитель под заголовком).
 * Весь исходный текст сначала экранируется, поэтому HTML из YAML никогда не попадёт на страницу:
 * результат можно безопасно вставлять через {@html}.
 */

export type MarkdownOptions = {
  /** Сдвиг уровня заголовков: при 1 «## » превращается в <h3>. По умолчанию 0. */
  headingShift?: number;
  /** Атрибут lang для **жирного** (в шпаргалках жирным выделены удмуртские слова). */
  strongLang?: string;
  /** Класс для **жирного**. */
  strongClass?: string;
};

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c]);
}

/** Строчная разметка. Получает УЖЕ экранированный текст. */
function inline(s: string, o: MarkdownOptions): string {
  const attrs =
    (o.strongLang ? ` lang="${escapeHtml(o.strongLang)}"` : '') + (o.strongClass ? ` class="${escapeHtml(o.strongClass)}"` : '');
  // Код — первым и «заморозкой», чтобы звёздочки внутри не превращались в курсив.
  const codes: string[] = [];
  let out = s.replace(/`([^`\n]+)`/g, (_, c: string) => {
    codes.push(`<code>${c}</code>`);
    return `\u0000${codes.length - 1}\u0000`;
  });
  out = out
    .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, `<strong${attrs}>$1</strong>`)
    .replace(/(^|[^*\w])\*(?=\S)([^*\n]*?\S)\*(?![*\w])/g, '$1<em>$2</em>');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i: string) => codes[Number(i)]);
}

type Block =
  | { t: 'h'; level: number; text: string }
  | { t: 'ul' | 'ol'; items: string[] }
  | { t: 'p'; lines: string[] }
  | { t: 'table'; rows: string[][] };

const RE_H = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RE_UL = /^\s{0,3}[-*+]\s+(.*)$/;
const RE_OL = /^\s{0,3}\d{1,3}[.)]\s+(.*)$/;
const RE_ROW = /^\s{0,3}\|(.*)\|\s*$/;
const RE_SEP = /^\s*:?-{2,}:?\s*$/;

export function renderMarkdown(src: string, opts: MarkdownOptions = {}): string {
  const lines = escapeHtml(src.replace(/\r\n?/g, '\n')).split('\n');
  const blocks: Block[] = [];
  let cur: Block | null = null;
  const flush = () => {
    if (cur) blocks.push(cur);
    cur = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim()) {
      flush();
      continue;
    }
    const h = line.match(RE_H);
    if (h) {
      flush();
      blocks.push({ t: 'h', level: h[1].length, text: h[2] });
      continue;
    }
    const row = line.match(RE_ROW);
    if (row) {
      const cells = row[1].split('|').map((c) => c.trim());
      if ((cur as Block | null)?.t !== 'table') {
        flush();
        cur = { t: 'table', rows: [] };
      }
      // строка-разделитель «|---|---|» не выводится
      if (!cells.every((c) => RE_SEP.test(c))) (cur as { rows: string[][] }).rows.push(cells);
      continue;
    }
    const ul = line.match(RE_UL);
    const ol = ul ? null : line.match(RE_OL);
    if (ul || ol) {
      const t = ul ? 'ul' : 'ol';
      const text = (ul ?? ol)![1];
      if ((cur as Block | null)?.t !== t) {
        flush();
        cur = { t, items: [] };
      }
      (cur as { items: string[] }).items.push(text);
      continue;
    }
    // Продолжение пункта списка (строка с отступом) — приклеиваем к последнему пункту.
    if (((cur as Block | null)?.t === 'ul' || (cur as Block | null)?.t === 'ol') && /^\s{2,}\S/.test(line)) {
      const items = (cur as { items: string[] }).items;
      items[items.length - 1] += ' ' + line.trim();
      continue;
    }
    if ((cur as Block | null)?.t !== 'p') {
      flush();
      cur = { t: 'p', lines: [] };
    }
    (cur as { lines: string[] }).lines.push(line.trim());
  }
  flush();

  const shift = opts.headingShift ?? 0;
  return blocks
    .map((b) => {
      if (b.t === 'h') {
        const n = Math.min(6, Math.max(1, b.level + shift));
        return `<h${n}>${inline(b.text, opts)}</h${n}>`;
      }
      if (b.t === 'p') return `<p>${inline(b.lines.join(' '), opts)}</p>`;
      if (b.t === 'table') {
        const [head, ...body] = b.rows;
        const cell = (tag: string, c: string) => `<${tag}>${inline(c, opts)}</${tag}>`;
        // пустой заголовок («| | |») — таблица без шапки
        const thead = head.some((c) => c) ? `<thead><tr>${head.map((c) => cell('th', c)).join('')}</tr></thead>` : '';
        return `<div class="table-wrap"><table>${thead}<tbody>${body.map((r) => `<tr>${r.map((c) => cell('td', c)).join('')}</tr>`).join('')}</tbody></table></div>`;
      }
      return `<${b.t}>${b.items.map((i) => `<li>${inline(i, opts)}</li>`).join('')}</${b.t}>`;
    })
    .join('\n');
}
