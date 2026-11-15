// How an event's time is shown on staff and guest screens. Dance has no announced
// clock time (it is stored as an all-day placeholder), so it reads "First half".
const IST = 'Asia/Kolkata';

export interface TimedEvent { slug?: string; name?: string; start_time: string; end_time?: string | null }

export const clock = (value?: string | number | null) => value
  ? new Intl.DateTimeFormat('en-IN', { timeZone: IST, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date(value)).toUpperCase()
  : '—';

function istMidnight(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: IST, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value));
  return parts.find(part => part.type === 'hour')?.value === '00' && parts.find(part => part.type === 'minute')?.value === '00';
}

/** A label to show instead of a clock time, or null when the event has a real start time. */
export function sessionLabel(event: TimedEvent): string | null {
  const key = (event.slug || event.name || '').trim().toLowerCase();
  if (key === 'dance') return 'First half';
  // Any other event stored as an all-day placeholder (midnight to end of day) has no announced time either.
  const start = Date.parse(event.start_time), end = event.end_time ? Date.parse(event.end_time) : NaN;
  if (Number.isFinite(start) && Number.isFinite(end) && end - start >= 23 * 3600000 && istMidnight(event.start_time)) return 'Time to be announced';
  return null;
}

/** "10:30 AM to 12:00 PM", or the session label for events without a clock time. */
export function timeRange(event: TimedEvent) {
  return sessionLabel(event) ?? `${clock(event.start_time)}${event.end_time ? ` to ${clock(event.end_time)}` : ''}`;
}
