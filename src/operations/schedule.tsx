import { useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useOptionalEvents } from '../context/EventsContext';
import { clock, sessionLabel } from '../lib/eventTime';

export { clock, sessionLabel, timeRange } from '../lib/eventTime';

// One shared, glanceable event schedule for the volunteer and coordinator desks.
export interface ScheduleEvent { id: string; name: string; slug?: string; venue: string; start_time: string; end_time?: string | null; status: string }
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
  // Events without a clock time (Dance: first half) are never shown as live or counted down.
  if (sessionLabel(event)) return { phase: 'upcoming', label: '' };
  if (event.status === 'in_progress') return { phase: 'live', label: 'Live now' };
  if (Number.isFinite(end) && now >= end) return { phase: 'done', label: 'Finished' };
  if (Number.isFinite(start) && now >= start) return { phase: 'live', label: 'Live now' };
  const minutes = Math.max(1, Math.ceil((start - now) / 60000));
  if (!Number.isFinite(minutes)) return { phase: 'upcoming', label: 'Time to be announced' };
  if (minutes <= 60) return { phase: 'soon', label: `Starts in ${minutes} min` };
  if (minutes < 24 * 60) return { phase: 'upcoming', label: `Starts in ${Math.floor(minutes / 60)} h ${minutes % 60} min` };
  return { phase: 'upcoming', label: dayLabel(start) };
}

// Event times and venues come from the public events the app already loads; the
// optional fallback (the operations snapshot) wins for status because it is fresher.
export function useScheduleEvents(fallback: ScheduleEvent[] = []): ScheduleEvent[] {
  const shared = useOptionalEvents()?.events;
  return useMemo(() => {
    const byId = new Map((shared || []).map(event => [event.id, event]));
    const base: ScheduleEvent[] = fallback.length
      ? fallback
      : (shared || []).map(event => ({ id: event.id, name: event.name, slug: event.slug, venue: event.venue_location, start_time: event.start_time, end_time: event.end_time, status: event.status }));
    return base.map(event => ({ ...event, end_time: event.end_time ?? byId.get(event.id)?.end_time ?? null, venue: event.venue || byId.get(event.id)?.venue_location || '' }))
      .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time));
  }, [shared, fallback]);
}

export function PhasePill({ event, now }: { event: ScheduleEvent; now: number }) {
  const { phase, label } = eventPhase(event, now);
  return label ? <span className={`cs-pill ${phase}`}>{label}</span> : null;
}

export function Schedule({ events, highlight = [], title = 'Today’s event schedule', emptyText = 'No events are scheduled yet.' }: { events: ScheduleEvent[]; highlight?: string[]; title?: string; emptyText?: string }) {
  const now = useNow();
  return <section className="cs-card" aria-label={title}>
    <header className="cs-head"><h2>{title}</h2><span className="cs-clock" aria-live="off">{dayLabel(now)} · {clock(now)}</span></header>
    {events.length ? <ol className="cs-list">{events.map(event => {
      const mine = highlight.includes(event.id);
      return <li key={event.id} className={`cs-event ${eventPhase(event, now).phase}${mine ? ' mine' : ''}`}>
        {sessionLabel(event) ? <time><b>{sessionLabel(event)}</b></time> : <time dateTime={event.start_time}><b>{clock(event.start_time)}</b>{event.end_time && <small>to {clock(event.end_time)}</small>}</time>}
        <div className="cs-what"><strong>{event.name}{mine && <em>Your event</em>}</strong><span><MapPin size={14} aria-hidden="true" />{event.venue || 'Venue to be announced'}</span></div>
        <PhasePill event={event} now={now} />
      </li>;
    })}</ol> : <p className="cs-empty">{emptyText}</p>}
  </section>;
}
