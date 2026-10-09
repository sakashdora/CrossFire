import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/countdown.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020 } });
const { CROSSFIRE_START, getCountdown } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const deadline = Date.parse(CROSSFIRE_START);

test('the event starts at 09:30 IST, independently of browser timezone', () => {
  assert.equal(new Date(deadline).toISOString(), '2026-11-15T04:00:00.000Z');
});
test('days, hours, minutes and seconds roll over together', () => {
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 86400000).values, [1, 0, 0, 0]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 86399000).values, [0, 23, 59, 59]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 3600000).values, [0, 1, 0, 0]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 3599000).values, [0, 0, 59, 59]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 60000).values, [0, 0, 1, 0]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 59000).values, [0, 0, 0, 59]);
});
test('a sleeping tab catches up from wall clock time', () => {
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 90061000).values, [1, 1, 1, 1]);
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline - 80000).values, [0, 0, 1, 20]);
});
test('expiry clamps at zero and does not show negative values', () => {
  assert.equal(getCountdown(CROSSFIRE_START, deadline - 1).status, 'upcoming');
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline), { values: [0, 0, 0, 0], status: 'started' });
  assert.deepEqual(getCountdown(CROSSFIRE_START, deadline + 86400000), { values: [0, 0, 0, 0], status: 'started' });
});
test('invalid dates fail safely instead of displaying NaN', () => {
  assert.deepEqual(getCountdown('invalid', deadline), { values: [0, 0, 0, 0], status: 'unavailable' });
});
