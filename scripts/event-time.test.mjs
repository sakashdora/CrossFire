import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/eventTime.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020 } });
const { sessionLabel, timeRange, clock } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const dance = { slug: 'dance', name: 'Dance', start_time: '2026-11-15T00:00:00+05:30', end_time: '2026-11-15T23:59:59+05:30' };

test('Dance reads "First half", never a clock time', () => {
  assert.equal(sessionLabel(dance), 'First half');
  assert.equal(timeRange(dance), 'First half');
  assert.equal(sessionLabel({ name: 'Dance', start_time: dance.start_time, end_time: dance.end_time }), 'First half');
  assert.equal(sessionLabel({ ...dance, start_time: '2026-11-15T10:00:00+05:30', end_time: '2026-11-15T11:00:00+05:30' }), 'First half');
});
test('events with real times keep their clock time', () => {
  const quiz = { slug: 'quiz', name: 'Quiz', start_time: '2026-11-15T10:30:00+05:30', end_time: '2026-11-15T12:00:00+05:30' };
  assert.equal(sessionLabel(quiz), null);
  assert.equal(timeRange(quiz), '10:30 AM to 12:00 PM');
  assert.equal(clock('2026-11-15T13:30:00+05:30'), '1:30 PM');
});
test('another all-day placeholder is shown as to be announced, not as 12:00 AM', () => {
  assert.equal(sessionLabel({ slug: 'x', name: 'X', start_time: dance.start_time, end_time: dance.end_time }), 'Time to be announced');
  // A long event that does not start at midnight is a real time.
  assert.equal(sessionLabel({ slug: 'x', name: 'X', start_time: '2026-11-15T08:30:00+05:30', end_time: '2026-11-16T09:00:00+05:30' }), null);
});
