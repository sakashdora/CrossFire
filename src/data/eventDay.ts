// From the organiser's event-day room board. Quiz has two rounds in different rooms.
export const ROOM_SCHEDULE = [
  { slug: 'quiz', name: 'Written Quiz', venue: 'Rooms 211 & 213', floor: '2nd floor', session: '' },
  { slug: 'ramp-walk', name: 'Ramp Walk', venue: 'J.R.D. Tata Hall', floor: '', session: '2nd half' },
  { slug: 'reels', name: 'Reels', venue: 'Institute premises', floor: '', session: '' },
  { slug: 'debate', name: 'Debate', venue: 'Room 301', floor: '3rd floor', session: '1st half' },
  { slug: 'poster-making', name: 'Poster Making', venue: 'Room 305', floor: '3rd floor', session: '1st half' },
  { slug: 'treasure-hunt', name: 'Treasure Hunt', venue: 'Institute premises', floor: '', session: '' },
  { slug: 'dance', name: 'Dance', venue: 'J.R.D. Tata Hall', floor: '', session: '1st half' },
  { slug: 'quiz', name: 'Final Round Quiz', venue: 'J.R.D. Tata Hall', floor: '', session: '2nd half' },
] as const;

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
