/**
 * Группа без сервера: каждый делится коротким кодом (или ссылкой) со своим XP за неделю,
 * остальные вставляют коды — получается «Лига недели» и общая цель группы.
 * Код не защищает от подделки (это игра между друзьями), но ловит опечатки контрольной суммой.
 */
import { readJSON, writeJSON } from './storage';
import { dayKey, addDays } from './dates';

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
    const [name, xp, streak, words, week] = JSON.parse(unb64u(m[1]));
    if (typeof name !== 'string' || !name.trim() || typeof xp !== 'number') return null;
    return { name: name.trim(), xp: Math.max(0, Math.round(xp)), streak: Math.max(0, streak | 0), words: Math.max(0, words | 0), week: String(week), at: Date.now() };
  } catch {
    return null;
  }
}

/** Все коды из вставленного текста (можно вставить сразу всё сообщение из чата). */
export function parseMany(text: string): Member[] {
  return (text.match(/G1\.[A-Za-z0-9_-]+\.[0-9a-z]{2}/g) ?? []).map(parseCode).filter((x): x is Member => !!x);
}

class Group {
  data = $state<GroupData>(readJSON<GroupData>(KEY, { members: {}, goal: 300, groupName: 'Наша группа' }));
  save() {
    writeJSON(KEY, $state.snapshot(this.data));
  }
  add(m: Member): 'added' | 'updated' | 'old' {
    const k = m.name.toLowerCase();
    const prev = this.data.members[k];
    if (prev && prev.week === m.week && prev.xp > m.xp) return 'old';
    this.data.members[k] = m;
    this.save();
    return prev ? 'updated' : 'added';
  }
  remove(name: string) {
    delete this.data.members[name.toLowerCase()];
    this.save();
  }
  setGoal(g: number) {
    this.data.goal = g;
    this.save();
  }
}

export const group = new Group();
