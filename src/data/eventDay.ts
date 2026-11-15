// The event-day timetable and room board, Sunday 15 November 2026 (all times IST).
// This is the single source for every time and room shown on the public schedule,
// the student pages, and the volunteer, coordinator and pass screens.
//
// `end` is the announced end time (shown). `until` is only used to decide when a slot
// counts as finished when no end was announced; it is never shown as a time.
export const EVENT_DATE = '2026-11-15';
export type SlotKind = 'entry' | 'event' | 'break' | 'ceremony';
export interface TimetableSlot { id: string; kind: SlotKind; name: string; slug?: string; start: string; end?: string; until?: string; venue: string; floor: string }

export const TIMETABLE: readonly TimetableSlot[] = [
  { id: 'entry', kind: 'entry', name: 'Entry & check-in', start: '10:15', until: '10:30', venue: 'Registration gate', floor: '' },
  { id: 'quiz-written', kind: 'event', name: 'Written Quiz', slug: 'quiz', start: '10:30', until: '11:00', venue: 'Rooms 211 & 213', floor: '2nd floor' },
  { id: 'dance', kind: 'event', name: 'Dance', slug: 'dance', start: '10:30', until: '11:00', venue: 'J.R.D. Tata Hall', floor: '' },
  { id: 'debate', kind: 'event', name: 'Debate', slug: 'debate', start: '11:00', end: '12:00', venue: 'Room 301', floor: '3rd floor' },
  { id: 'poster-making', kind: 'event', name: 'Poster Making', slug: 'poster-making', start: '11:00', end: '12:00', venue: 'Room 305', floor: '3rd floor' },
  { id: 'reels', kind: 'event', name: 'Reels', slug: 'reels', start: '12:00', end: '13:00', venue: 'Institute premises', floor: '' },
  { id: 'treasure-hunt', kind: 'event', name: 'Treasure Hunt', slug: 'treasure-hunt', start: '12:30', end: '14:00', venue: 'Institute premises', floor: '' },
  { id: 'lunch', kind: 'break', name: 'Lunch & refreshments', start: '14:00', end: '14:30', venue: '', floor: '' },
  { id: 'ramp-walk', kind: 'event', name: 'Ramp Walk', slug: 'ramp-walk', start: '14:30', end: '15:15', venue: 'J.R.D. Tata Hall', floor: '' },
  { id: 'quiz-final', kind: 'event', name: 'Final Round Quiz', slug: 'quiz', start: '15:15', end: '16:15', venue: 'J.R.D. Tata Hall', floor: '' },
  { id: 'closing', kind: 'ceremony', name: 'Closing ceremony', start: '16:15', end: '17:15', venue: '', floor: '' },
];

export const slotIso = (hhmm: string) => `${EVENT_DATE}T${hhmm}:00+05:30`;
export function slotClock(hhmm: string) {
  const [hours, minutes] = hhmm.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}
/** "11:00 AM – 12:00 PM", or just the start when no end was announced. */
export const slotRange = (slot: Pick<TimetableSlot, 'start' | 'end'>) => slot.end ? `${slotClock(slot.start)} – ${slotClock(slot.end)}` : slotClock(slot.start);

// The competition rows of the room board, in time order. `session` holds the time.
export const ROOM_SCHEDULE = TIMETABLE.filter(slot => slot.kind === 'event').map(slot => ({
  slug: slot.slug as string, name: slot.name, venue: slot.venue, floor: slot.floor, session: slotRange(slot),
}));

export function showEventSchedule() {
  const schedule = document.getElementById('event-day-schedule');
  schedule?.focus({ preventScroll: true });
  schedule?.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
}

// Where to send a student, from the organiser's room board (the same rooms the public schedule shows).
// Falls back to the venue saved on the event when the board does not list it.
export function roomFor(slug: string | undefined, fallback = ''): string {
  const rows = ROOM_SCHEDULE.filter(row => row.slug === slug);
  if (!rows.length) return fallback;
  return rows.map(row => `${rows.length > 1 ? row.name + ': ' : ''}${row.venue}${row.floor ? ', ' + row.floor : ''}`).join(' · ');
}
