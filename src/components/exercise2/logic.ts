/**
 * Чистые помощники для упражнений tiles / type / fill / build / dialogue.
 * Без Svelte и без курса — легко тестировать (tests/ex2.test.ts).
 */
import type { Morpheme } from '$lib/content/schema';
import type { Grade } from '$lib/srs';
import { normalize, tokenize, type Verdict } from '$lib/answer';
import { seededShuffle } from '../../exercises/types';

/** Режим E2E-тестов: правильные варианты помечаются data-correct="true". */
export const E2E = import.meta.env.VITE_E2E === '1';

export type PieceKind = Morpheme['kind'];

/** Плитка-слово (tiles) или кубик-морфема (build). */
export type Piece = {
  /** Стабильный ключ: t0…, m0… — правильные, x0… — обманки. */
  key: string;
  /** Текст плитки (форма морфемы — без дефиса). */
  text: string;
  kind: PieceKind;
  /** Значение морфемы — подпись под кубиком после проверки. */
  note?: string;
  /** Позиция в правильном ответе, −1 — лишняя плитка. */
  correctAt: number;
};

const uniqBy = <T>(arr: readonly T[], key: (x: T) => string): T[] => {
  const seen = new Set<string>();
  return arr.filter((x) => {
    const k = key(x);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
};

/**
 * Плитки для «соберите фразу»: слова ответа + лишние, перемешанные по зерну.
 * Лишние, совпадающие со словом ответа (без учёта регистра), отбрасываются —
 * иначе одна и та же плитка оказывается и «правильной», и «лишней».
 */
export function tilePieces(answer: string, extra: readonly string[], seed: string): Piece[] {
  const toks = tokenize(answer);
  const taken = new Set(toks.map((t) => normalize(t)));
  const extras = uniqBy(
    extra.flatMap((x) => tokenize(x)).filter((x) => !taken.has(normalize(x))),
    (x) => normalize(x),
  );
  const pieces: Piece[] = [
    ...toks.map((text, i) => ({ key: `t${i}`, text, kind: 'word' as const, correctAt: i })),
    ...extras.map((text, j) => ({ key: `x${j}`, text, kind: 'word' as const, correctAt: -1 })),
  ];
  return shuffleNotSolved(pieces, seed);
}

/** Перемешать так, чтобы банк не лежал сразу в правильном порядке. */
function shuffleNotSolved(pieces: Piece[], seed: string): Piece[] {
  let out = seededShuffle(pieces, seed);
  const solved = (a: Piece[]) => a.filter((p) => p.correctAt >= 0).every((p, i, arr) => i === 0 || arr[i - 1].correctAt < p.correctAt);
  if (pieces.filter((p) => p.correctAt >= 0).length > 1 && solved(out)) {
    for (let k = 1; k < 6 && solved(out); k++) out = seededShuffle(pieces, `${seed}#${k}`);
    if (solved(out)) out = [...out.slice(1), out[0]];
  }
  return out;
}

/** Собранная строка из выбранных плиток. */
export function assemble(pieces: readonly Piece[], chosen: readonly number[]): string {
  return chosen
    .map((i) => pieces[i]?.text)
    .filter(Boolean)
    .join(' ');
}

/** Вид лишней морфемы: «-ыд» или короткая строчная — суффикс, иначе корень. */
function extraKind(x: string, hasSuffix: boolean): PieceKind {
  if (x.startsWith('-')) return 'suffix';
  if (hasSuffix && x.length <= 3 && x === x.toLowerCase()) return 'suffix';
  return 'root';
}

/** Кубики для «соберите слово»: морфемы слова + обманки. */
export function morphPieces(morphemes: readonly Morpheme[], extra: readonly string[], fallback: string, seed: string): Piece[] {
  const ms: Morpheme[] = morphemes.length ? [...morphemes] : [{ form: fallback, meaning: '', kind: 'root' }];
  const hasSuffix = ms.some((m) => m.kind === 'suffix');
  const forms = new Set(ms.map((m) => normalize(m.form)));
  const extras = uniqBy(
    extra.map((x) => x.trim()).filter((x) => x && !forms.has(normalize(x.replace(/^-/, '')))),
    (x) => normalize(x.replace(/^-/, '')),
  );
  const pieces: Piece[] = [
    ...ms.map((m, i) => ({ key: `m${i}`, text: m.form, kind: m.kind, note: m.meaning, correctAt: i })),
    ...extras.map((x, j) => ({ key: `x${j}`, text: x.replace(/^-/, ''), kind: extraKind(x, hasSuffix), correctAt: -1 })),
  ];
  return shuffleNotSolved(pieces, seed);
}

/** Подпись кубика: суффикс — с дефисом впереди (-ы). */
export function pieceLabel(p: Pick<Piece, 'text' | 'kind'>): string {
  return p.kind === 'suffix' ? `-${p.text}` : p.text;
}

/** Нужен ли пробел перед i-й частью: отдельные слова пишутся раздельно, морфемы — слитно. */
export function spaceBefore(parts: readonly { kind: PieceKind }[], i: number): boolean {
  return i > 0 && (parts[i].kind === 'word' || parts[i - 1].kind === 'word');
}

/** Склеить морфемы в слово: ним + ы → нимы; мынам + ним + ы → мынам нимы. */
export function glue(parts: readonly { text: string; kind: PieceKind }[]): string {
  return parts.map((p, i) => (spaceBefore(parts, i) ? ' ' : '') + p.text).join('');
}

/** Слово собрано верно (сравниваем склеенные строки — регистр и порядок одинаковых форм не важны). */
export function buildIsCorrect(chosen: readonly { text: string; kind: PieceKind }[], morphemes: readonly { form: string; kind: PieceKind }[]): boolean {
  if (!chosen.length) return false;
  return normalize(glue(chosen)) === normalize(glue(morphemes.map((m) => ({ text: m.form, kind: m.kind }))));
}

const UDM_BASE: Record<string, string> = { ӧ: 'о', ӥ: 'и', ӝ: 'ж', ӟ: 'з', ӵ: 'ч' };

/** Пояснение для «почти»: какие удмуртские буквы пропущены, или опечатка. */
export function almostNote(v: Verdict): string | undefined {
  if (!v.ok || v.exact) return undefined;
  if (v.hint === 'typo') return 'Небольшая опечатка — сравните с правильным написанием.';
  const ls = (v.letters ?? []).map((l) => (UDM_BASE[l] ? `${l} (не ${UDM_BASE[l]})` : l));
  if (!ls.length) return 'Обратите внимание на удмуртские буквы: ӧ, ӥ, ӝ, ӟ, ӵ.';
  return ls.length === 1 ? `Обратите внимание на букву: ${ls[0]}.` : `Обратите внимание на буквы: ${ls.join(', ')}.`;
}

/** Оценка для ввода: точно и быстро (< 6 с) — 4, точно — 3, «почти» — 2, неверно — 1. */
export function typeGrade(v: Verdict, ms: number): Grade {
  if (v.ok && v.exact) return ms < 6000 ? 4 : 3;
  return v.ok ? 2 : 1;
}

/** Оценка для плиток: точно — 3, «почти» — 2, неверно — 1. */
export function tilesGrade(v: Verdict): Grade {
  return v.ok ? (v.exact ? 3 : 2) : 1;
}

export const STUDENT = '{name}';

/**
 * Стороны реплик в диалоге: ученик ({name}) — справа, собеседники — слева.
 * Один и тот же говорящий всегда на одной стороне. Если ученика в диалоге нет,
 * говорящие чередуются по порядку появления.
 */
export function dialogueSides(lines: readonly { who: string }[]): ('left' | 'right')[] {
  const hasStudent = lines.some((l) => l.who === STUDENT);
  const order: string[] = [];
  for (const l of lines) if (l.who !== STUDENT && !order.includes(l.who)) order.push(l.who);
  return lines.map((l) => {
    if (l.who === STUDENT) return 'right';
    if (hasStudent) return 'left';
    return order.indexOf(l.who) % 2 === 0 ? 'left' : 'right';
  });
}

/** Предложение с пропуском: что до и после; suffix — пропуск приклеен к слову (Ижкар___). */
export function fillParts(text: string): { before: string; after: string; suffix: boolean } {
  const at = text.indexOf('___');
  if (at < 0) return { before: text, after: '', suffix: false };
  const before = text.slice(0, at);
  const after = text.slice(at + 3).replace(/^_+/, '');
  return { before, after, suffix: /[^\s«"(—-]$/.test(before) };
}

/** Предложение с подставленным ответом. */
export function fillSentence(text: string, answer: string): string {
  return text.replace(/_{3,}/, answer);
}

/** Номер клавиши варианта: 1–9. */
export function digitIndex(e: KeyboardEvent): number {
  if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return -1;
  const t = e.target as HTMLElement | null;
  if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return -1;
  return /^[1-9]$/.test(e.key) ? Number(e.key) - 1 : -1;
}
