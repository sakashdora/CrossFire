import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useOptionalEvents } from '../context/EventsContext';
import { clock, sessionLabel } from '../lib/eventTime';
import { TIMETABLE, slotIso, type SlotKind } from '../data/eventDay';

export { clock, sessionLabel, timeRange } from '../lib/eventTime';

// One shared, glanceable event schedule for the volunteer and coordinator desks and the
// pass screens. It is built from the event-day timetable; saved events only supply ids
// and the "completed" status.
export interface ScheduleEvent {
  id: string; name: string; slug?: string; venue: string; start_time: string; end_time?: string | null; status: string;
  /** The saved event this slot belongs to (Quiz has two slots). */
  eventId?: string; kind?: SlotKind;
  /** False when no end time was announced; the end is then only used to mark the slot finished. */
  endShown?: boolean;
}
export type Phase = 'live' | 'soon' | 'upcoming' | 'done';
const IST = 'Asia/Kolkata';

export const dayLabel = (value: string | number) => new Intl.DateTimeFormat('en-IN', { timeZone: IST, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(value));

// Re-renders on a timer so "starts in" and "live now" stay right without a refresh.
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [intervalMs]);
  return now;
}

export function eventPhase(event: ScheduleEvent, now: number): { phase: Phase; label: string } {
  const start = Date.parse(event.start_time);
  const end = event.end_time ? Date.parse(event.end_time) : NaN;
  if (event.status === 'completed') return { phase: 'done', label: 'Finished' };
  // An event saved with only an all-day placeholder has no clock time to count down to.
  if (sessionLabel(event)) return { phase: 'upcoming', label: '' };
  if (Number.isFinite(end) && now >= end) return { phase: 'done', label: 'Finished' };
  if (Number.isFinite(start) && now >= start) return { phase: 'live', label: 'Live now' };
  const minutes = Math.max(1, Math.ceil((start - now) / 60000));
  if (!Number.isFinite(minutes)) return { phase: 'upcoming', label: 'Time to be announced' };
  if (minutes <= 60) return { phase: 'soon', label: `Starts in ${minutes} min` };
  if (minutes < 24 * 60) return { phase: 'upcoming', label: `Starts in ${Math.floor(minutes / 60)} h ${minutes % 60} min` };
  return { phase: 'upcoming', label: dayLabel(start) };
}

type SavedEvent = { id: string; name: string; slug?: string; venue_location: string; start_time: string; end_time?: string | null; status: string };

export function useScheduleEvents(fallback: ScheduleEvent[] = []): ScheduleEvent[] {
  const shared = useOptionalEvents()?.events;
  return useMemo(() => {
    // The operations snapshot (fresher) wins over the public list; both only supply ids and status.
    const saved: ScheduleEvent[] = fallback.length ? fallback : (shared || []).map((event: SavedEvent) => ({
      id: event.id, name: event.name, slug: event.slug, venue: event.venue_location, start_time: event.start_time, end_time: event.end_time, status: event.status,
    }));
    const bySlug = new Map(saved.map(event => [event.slug, event]));
    const slots: ScheduleEvent[] = TIMETABLE.map(slot => {
      const event = slot.slug ? bySlug.get(slot.slug) : undefined;
      return {
        id: slot.id, eventId: event?.id, slug: slot.slug, kind: slot.kind, name: slot.name,
        venue: [slot.venue, slot.floor].filter(Boolean).join(', '),
        start_time: slotIso(slot.start), end_time: slotIso(slot.end ?? slot.until ?? slot.start), endShown: Boolean(slot.end),
        status: event?.status === 'completed' ? 'completed' : 'scheduled',
      };
    });
    // An event the timetable does not list keeps its own saved time and venue.
    const extra = saved.filter(event => !TIMETABLE.some(slot => slot.slug && slot.slug === event.slug)).map(event => ({ ...event, eventId: event.id, endShown: true }));
    return [...slots, ...extra].sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
  }, [shared, fallback]);
}

/** The timetable slots of one saved event, in time order (Quiz has a written round and a final). */
export const slotsOf = (schedule: ScheduleEvent[], eventId: string | null | undefined) => eventId ? schedule.filter(slot => slot.eventId === eventId) : [];

export function PhasePill({ event, now }: { event: ScheduleEvent; now: number }) {
  const { phase, label } = eventPhase(event, now);
  return label ? <span className={`cs-pill ${phase}`}>{label}</span> : null;
}

export function Schedule({ events, highlight = [], title = 'Today’s event schedule', emptyText = 'No events are scheduled yet.' }: { events: ScheduleEvent[]; highlight?: string[]; title?: string; emptyText?: string }) {
  const now = useNow();
  return <section className="cs-card" aria-label={title}>
    <header className="cs-head"><h2>{title}</h2><span className="cs-clock" aria-live="off">{dayLabel(now)} · {clock(now)}</span></header>
    {events.length ? <ol className="cs-list">{events.map(event => {
      const mine = Boolean(event.eventId && highlight.includes(event.eventId));
      return <li key={event.id} className={`cs-event ${eventPhase(event, now).phase}${mine ? ' mine' : ''}${event.kind && event.kind !== 'event' ? ' ' + event.kind : ''}`}>
        <time dateTime={event.start_time}><b>{clock(event.start_time)}</b>{event.endShown !== false && event.end_time && <small>to {clock(event.end_time)}</small>}</time>
        <div className="cs-what"><strong>{event.name}{mine && <em>Your event</em>}</strong>{(event.venue || !event.kind || event.kind === 'event') && <span><MapPin size={14} aria-hidden="true" /><span>{event.venue || 'Venue to be announced'}</span></span>}</div>
        <PhasePill event={event} now={now} />
      </li>;
    })}</ol> : <p className="cs-empty">{emptyText}</p>}
  </section>;
}
