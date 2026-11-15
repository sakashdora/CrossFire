import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// The event-day timetable is the one source for every time shown in the app.
const source = await readFile(new URL('../src/data/eventDay.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2020 } });
const { TIMETABLE, ROOM_SCHEDULE, slotClock, slotRange, slotIso, roomFor } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);
const row = id => TIMETABLE.find(slot => slot.id === id);

test('the timetable matches the organisers: entry, events, lunch, final and closing', () => {
  assert.deepEqual(TIMETABLE.map(slot => [slot.id, slot.start, slot.end ?? null]), [
    ['entry', '10:15', null], ['quiz-written', '10:30', null], ['dance', '10:30', null], ['debate', '11:00', '12:00'], ['poster-making', '11:00', '12:00'],
    ['reels', '12:00', '13:00'], ['treasure-hunt', '12:30', '14:00'], ['lunch', '14:00', '14:30'], ['ramp-walk', '14:30', '15:15'], ['quiz-final', '15:15', '16:15'], ['closing', '16:15', '17:15'],
  ]);
  assert.equal(row('lunch').kind, 'break');
  assert.equal(row('closing').kind, 'ceremony');
});
test('slots are in time order and every event slot has a room', () => {
  const starts = TIMETABLE.map(slot => slot.start);
  assert.deepEqual([...starts].sort(), starts);
  for (const slot of TIMETABLE.filter(item => item.kind === 'event')) assert.ok(slot.slug && slot.venue, slot.id);
  assert.equal(TIMETABLE.filter(slot => slot.slug === 'quiz').length, 2);
});
test('times are written for people and as exact IST instants', () => {
  assert.equal(slotClock('10:15'), '10:15 AM');
  assert.equal(slotClock('12:00'), '12:00 PM');
  assert.equal(slotClock('14:30'), '2:30 PM');
  assert.equal(slotRange(row('debate')), '11:00 AM – 12:00 PM');
  assert.equal(slotRange(row('dance')), '10:30 AM');
  assert.equal(new Date(slotIso('10:15')).toISOString(), '2026-11-15T04:45:00.000Z');
});
test('the venues are the same as before', () => {
  assert.equal(roomFor('debate'), 'Room 301, 3rd floor');
  assert.equal(roomFor('poster-making'), 'Room 305, 3rd floor');
  assert.equal(roomFor('dance'), 'J.R.D. Tata Hall');
  assert.equal(roomFor('ramp-walk'), 'J.R.D. Tata Hall');
  assert.equal(roomFor('reels'), 'Institute premises');
  assert.equal(roomFor('treasure-hunt'), 'Institute premises');
  assert.equal(roomFor('quiz'), 'Written Quiz: Rooms 211 & 213, 2nd floor · Final Round Quiz: J.R.D. Tata Hall');
  assert.equal(roomFor('unknown', 'Saved venue'), 'Saved venue');
});
test('the public room board lists only competitions, with their times', () => {
  assert.deepEqual(ROOM_SCHEDULE.map(entry => entry.name), ['Written Quiz', 'Dance', 'Debate', 'Poster Making', 'Reels', 'Treasure Hunt', 'Ramp Walk', 'Final Round Quiz']);
  assert.equal(ROOM_SCHEDULE.find(entry => entry.slug === 'debate').session, '11:00 AM – 12:00 PM');
});
