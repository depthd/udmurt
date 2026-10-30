/**
 * Группа без сервера: каждый делится коротким кодом (или ссылкой) со своим XP за неделю,
 * остальные вставляют коды — получается «Лига недели» и общая цель группы.
 * Код не защищает от подделки (это игра между друзьями), но ловит опечатки контрольной суммой.
 */
import { readJSON, writeJSON } from './storage';
import { dayKey, addDays } from './dates';
import { isObj, int, str, record } from './safe';

export type Member = { name: string; xp: number; streak: number; words: number; week: string; at: number };
type GroupData = { members: Record<string, Member>; goal: number; groupName: string };

const KEY = 'udm.group.v1';

/** Неделя по ISO (понедельник — первый день): '2026-W43'. */
export function weekKey(d = new Date()): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t.getTime() - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}

/** XP за текущую неделю (пн–вс) по журналу дней. */
export function weekXp(days: Record<string, number>, now = new Date()): number {
  const today = dayKey(now);
  const dow = (now.getDay() + 6) % 7;
  let sum = 0;
  for (let i = 0; i <= dow; i++) sum += days[addDays(today, -i)] ?? 0;
  return sum;
}

const b64u = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const unb64u = (s: string) => {
  const b = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b + '==='.slice((b.length + 3) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
const sum = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1296).toString(36).padStart(2, '0');
};

export function makeCode(m: Omit<Member, 'at'>): string {
  const body = b64u(JSON.stringify([m.name.slice(0, 30), m.xp, m.streak, m.words, m.week]));
  return `G1.${body}.${sum(body)}`;
}

export function parseCode(code: string): Member | null {
  const m = code.trim().match(/G1\.([A-Za-z0-9_-]+)\.([0-9a-z]{2})/);
  if (!m || sum(m[1]) !== m[2]) return null;
  try {
    const arr: unknown = JSON.parse(unb64u(m[1]));
    if (!Array.isArray(arr)) return null;
    const [name, xp, streak, words, week] = arr;
    const n = str(name, 30).trim();
    if (!n || typeof xp !== 'number' || !Number.isFinite(xp)) return null;
    return { name: n, xp: int(xp, 0, 1e6, 0), streak: int(streak, 0, 1e5, 0), words: int(words, 0, 1e6, 0), week: str(String(week ?? ''), 10), at: Date.now() };
  } catch {
    return null;
  }
}

/** Все коды из вставленного текста (можно вставить сразу всё сообщение из чата). */
export function parseMany(text: string): Member[] {
  return (text.match(/G1\.[A-Za-z0-9_-]+\.[0-9a-z]{2}/g) ?? []).map(parseCode).filter((x): x is Member => !!x);
}

/** Ключ участника: имя в нижнем регистре с префиксом — имя «__proto__» не сломает объект. */
const memberKey = (name: string) => 'm:' + name.toLowerCase();

function member(v: unknown): Member | undefined {
  if (!isObj(v)) return undefined;
  const name = str(v.name, 30).trim();
  if (!name) return undefined;
  return { name, xp: int(v.xp, 0, 1e6, 0), streak: int(v.streak, 0, 1e5, 0), words: int(v.words, 0, 1e6, 0), week: str(v.week, 10), at: int(v.at, 0, 8.64e15, 0) };
}

function readGroup(): GroupData {
  const r = readJSON<unknown>(KEY, null);
  const o = isObj(r) ? r : {};
  const members: Record<string, Member> = {};
  for (const m of Object.values(record(o.members, member, 500))) members[memberKey(m.name)] = m;
  return { members, goal: int(o.goal, 10, 100_000, 300), groupName: str(o.groupName, 60, 'Наша группа') || 'Наша группа' };
}

class Group {
  data = $state<GroupData>(readGroup());
  save() {
    writeJSON(KEY, $state.snapshot(this.data));
  }
  add(m: Member): 'added' | 'updated' | 'old' {
    const k = memberKey(m.name);
    const prev = this.data.members[k];
    if (prev && prev.week === m.week && prev.xp > m.xp) return 'old';
    this.data.members[k] = m;
    this.save();
    return prev ? 'updated' : 'added';
  }
  remove(name: string) {
    delete this.data.members[memberKey(name)];
    this.save();
  }
  setGoal(g: number) {
    this.data.goal = g;
    this.save();
  }
}

export const group = new Group();
