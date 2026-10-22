import { describe, expect, it } from 'vitest';
import { makeCode, parseCode, parseMany, weekKey, weekXp } from '../src/lib/group.svelte.ts';

describe('группа', () => {
  it('код туда и обратно', () => {
    const code = makeCode({ name: 'Даша', xp: 120, streak: 5, words: 40, week: '2026-W43' });
    expect(code).toMatch(/^G1\./);
    const m = parseCode(code)!;
    expect(m.name).toBe('Даша');
    expect(m.xp).toBe(120);
  });
  it('опечатка ловится', () => {
    const code = makeCode({ name: 'Алексей', xp: 50, streak: 1, words: 10, week: '2026-W43' });
    const broken = code.slice(0, 6) + (code[6] === 'A' ? 'B' : 'A') + code.slice(7);
    expect(parseCode(broken)).toBeNull();
  });
  it('несколько кодов из сообщения', () => {
    const a = makeCode({ name: 'А', xp: 1, streak: 0, words: 0, week: 'w' });
    const b = makeCode({ name: 'Б', xp: 2, streak: 0, words: 0, week: 'w' });
    expect(parseMany(`мой код ${a}, а вот Бориса: ${b}!`)).toHaveLength(2);
  });
  it('неделя ISO и XP за неделю', () => {
    expect(weekKey(new Date(2026, 9, 22))).toBe('2026-W43');
    const days = { '2026-10-19': 10, '2026-10-21': 5, '2026-10-18': 100 };
    expect(weekXp(days, new Date(2026, 9, 22))).toBe(15);
  });
});

import { makeIcs } from '../src/lib/reminder.ts';
describe('напоминание', () => {
  it('ics с ежедневным повтором и сигналом', () => {
    const ics = makeIcs('19:30', 'https://depthd.github.io/udmurt/', new Date(2026, 9, 22, 12, 0));
    expect(ics).toContain('RRULE:FREQ=DAILY');
    expect(ics).toContain('DTSTART:20261022T193000');
    expect(ics).toContain('BEGIN:VALARM');
  });
});
