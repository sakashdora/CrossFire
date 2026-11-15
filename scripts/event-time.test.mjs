import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/eventTime.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020 } });
const { sessionLabel, timeRange, clock } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const allDay = { start_time: '2026-11-15T00:00:00+05:30', end_time: '2026-11-15T23:59:59+05:30' };

test('events with real times keep their clock time', () => {
  const debate = { slug: 'debate', name: 'Debate', start_time: '2026-11-15T11:00:00+05:30', end_time: '2026-11-15T12:00:00+05:30' };
  assert.equal(sessionLabel(debate), null);
  assert.equal(timeRange(debate), '11:00 AM to 12:00 PM');
  assert.equal(clock('2026-11-15T14:30:00+05:30'), '2:30 PM');
});
test('Dance is a normal timed event at 10:30 AM', () => {
  const dance = { slug: 'dance', name: 'Dance', start_time: '2026-11-15T10:30:00+05:30', end_time: '2026-11-15T11:00:00+05:30' };
  assert.equal(sessionLabel(dance), null);
  assert.equal(clock(dance.start_time), '10:30 AM');
});
test('a slot with no announced end shows only its start', () => {
  const quiz = { slug: 'quiz', name: 'Written Quiz', start_time: '2026-11-15T10:30:00+05:30', end_time: '2026-11-15T11:00:00+05:30', endShown: false };
  assert.equal(timeRange(quiz), '10:30 AM');
});
test('an all-day placeholder is shown as to be announced, never as 12:00 AM', () => {
  assert.equal(sessionLabel({ slug: 'x', name: 'X', ...allDay }), 'Time to be announced');
  assert.equal(timeRange({ slug: 'x', name: 'X', ...allDay }), 'Time to be announced');
  // A long event that does not start at midnight is a real time.
  assert.equal(sessionLabel({ slug: 'x', name: 'X', start_time: '2026-11-15T08:30:00+05:30', end_time: '2026-11-16T09:00:00+05:30' }), null);
});
