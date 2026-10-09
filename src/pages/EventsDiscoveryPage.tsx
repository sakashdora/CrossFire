import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, MapPin, Trophy, X } from 'lucide-react';
import { EventItem, Registration } from '../types';
import { useEvents } from '../context/EventsContext';
import './event-directory.css';

interface EventsDiscoveryPageProps {
  initialEvent?: EventItem | null;
  userRegistrations: Registration[];
  onRegister: () => void;
}

const PRESENTATION: Record<string, { photo: number; tagline: string }> = {
  quiz: { photo: 0, tagline: 'Think fast. Answer faster.' },
  debate: { photo: 1, tagline: 'Make your voice count.' },
  'poster-making': { photo: 2, tagline: 'Turn an idea into impact.' },
  'treasure-hunt': { photo: 3, tagline: 'Follow the clues. Find the win.' },
  'ramp-walk': { photo: 4, tagline: 'Own the stage.' },
  reels: { photo: 5, tagline: 'Make every frame count.' },
};
const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
const format = (event: EventItem) => event.event_type === 'solo' ? 'Solo' : `Team of ${event.team_size}`;

function EventPhoto({ photo }: { photo: number }) {
  return <svg className="cf-event-photo" viewBox={`${(photo % 3) * 512} ${Math.floor(photo / 3) * 512} 512 512`} preserveAspectRatio={photo === 0 || photo === 1 || photo === 4 ? 'xMidYMin slice' : 'xMidYMid slice'} aria-hidden="true" focusable="false">
    <image href="/images/events-atlas.png" width="1536" height="1024" />
  </svg>;
}

function EventCriteria({ event, onClose, onRegister }: { event: EventItem; onClose: () => void; onRegister: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const otherPrizes = Object.entries(event.prize_distribution).filter(([place]) => !['1st', '2nd', '3rd'].includes(place));
  return <dialog ref={dialogRef} className="cf-event-dialog" aria-labelledby="event-detail-title" onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="cf-event-dialog-panel">
      <header className="cf-event-dialog-header">
        <div><p className="cf-events-kicker">The criteria / {format(event)}</p><h2 id="event-detail-title">{event.name}</h2></div>
        <button className="cf-event-dialog-close" onClick={onClose} aria-label="Close event details" autoFocus><X size={22} /></button>
      </header>
      <div className="cf-event-dialog-body">
        <section className="cf-event-brief" aria-labelledby="event-brief-title">
          <h3 id="event-brief-title">Event brief</h3>
          <p>{event.description}</p>
          <div className="cf-event-location"><MapPin size={15} /><span>{event.venue_location}</span></div>
        </section>
        <section className="cf-event-prizes" aria-labelledby="event-prizes-title">
          <div className="cf-event-detail-heading"><h3 id="event-prizes-title"><Trophy size={15} />Prize distribution</h3><span>{money(event.prize_pool)} pool</span></div>
          <dl className="cf-event-prize-grid">
            {([['1st', 'Champion'], ['2nd', '1st Runner-up'], ['3rd', '2nd Runner-up']] as const).map(([place, label]) => <div key={place}><dt>{label}</dt><dd>{money(event.prize_distribution[place])}</dd></div>)}
          </dl>
          {otherPrizes.length > 0 && <p className="cf-event-other-prizes">{otherPrizes.map(([place, amount]) => `${place} place: ${money(amount)}`).join(' · ')}</p>}
        </section>
        <section className="cf-event-rubric" aria-labelledby="event-rubric-title">
          <div className="cf-event-detail-heading"><h3 id="event-rubric-title">Official scoring rubric</h3><span>Max score: 100 pts</span></div>
          <ul>{event.scoring_rubric.criteria.map(criterion => <li key={criterion.name}>
            <div><h4>{criterion.name}</h4><span>{criterion.weight} pts ({criterion.weight}%)</span></div>
            {criterion.description && <p>{criterion.description}</p>}
          </li>)}</ul>
        </section>
      </div>
      <footer className="cf-event-dialog-footer"><button className="cf-events-close-button" onClick={onClose}>Close</button><button className="cf-events-register" onClick={onRegister}>Register Now <ArrowRight size={18} /></button></footer>
    </div>
  </dialog>;
}

export function EventsDiscoveryPage({ initialEvent = null, userRegistrations, onRegister }: EventsDiscoveryPageProps) {
  const { events } = useEvents();
  const [filter, setFilter] = useState<'all' | 'solo' | 'team'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(initialEvent);
  const registeredEventIds = new Set(userRegistrations.map(registration => registration.event_id));
  const filteredEvents = events.filter(event => filter === 'all' || event.event_type === filter);
  const prizePool = events.reduce((total, event) => total + event.prize_pool, 0);
  const filters = [
    { value: 'all', label: 'All events', count: events.length },
    { value: 'solo', label: 'Solo', count: events.filter(event => event.event_type === 'solo').length },
    { value: 'team', label: 'Team', count: events.filter(event => event.event_type === 'team').length },
  ] as const;
  const register = () => { setSelectedEvent(null); onRegister(); };

  return <div className="cf-events-page">
    <div className="cf-events-shell">
      <header className="cf-events-header">
        <div className="cf-events-header-art" aria-hidden="true" />
        <div className="cf-events-intro">
          <p className="cf-events-kicker">The competitions / 2026</p>
          <h1>Find your <span>arena.</span></h1>
          <p className="cf-events-subtitle">Six competitions. One stage to make your mark.</p>
        </div>
        <div className="cf-events-overview">
          <dl className="cf-events-stats">
            <div><dt>Events</dt><dd>{String(events.length).padStart(2, '0')}</dd></div>
            <div><dt>Prize pool</dt><dd>{money(prizePool)}</dd></div>
            <div><dt>Entry</dt><dd>Free</dd></div>
          </dl>
          <div className="cf-events-meta"><span><CalendarDays size={15} /><time dateTime="2026-11-15">15 November 2026</time></span><i aria-hidden="true" /><span><MapPin size={15} />Srusti Campus, Bhubaneswar</span></div>
        </div>
      </header>

      <div className="cf-events-toolbar">
        <div className="cf-events-filters" role="group" aria-label="Filter events by format">
          {filters.map(item => <button key={item.value} aria-pressed={filter === item.value} aria-controls="cf-events-grid" onClick={() => setFilter(item.value)}>{item.label} <span>({item.count})</span></button>)}
        </div>
        <a className="cf-events-rulebook" href="/crossfire-2026-brochure.pdf" target="_blank" rel="noreferrer" aria-label="Explore the rulebook (PDF, opens in a new tab)"><span className="cf-events-rulebook-full">Explore the rulebook</span><span className="cf-events-rulebook-short" aria-hidden="true">Rules</span><ArrowUpRight size={16} /></a>
      </div>
      <p className="sr-only" role="status">{filteredEvents.length} {filter === 'all' ? '' : `${filter} `}events shown.</p>

      <div id="cf-events-grid" className="cf-events-grid">
        {filteredEvents.map(event => {
          const presentation = PRESENTATION[event.slug];
          const index = presentation?.photo ?? events.indexOf(event);
          const registered = registeredEventIds.has(event.id);
          return <article className="cf-event-card" key={event.id} aria-labelledby={`event-card-${event.slug}`}>
            <div className="cf-event-image">
              {presentation ? <EventPhoto photo={presentation.photo} /> : <Trophy className="cf-event-fallback" size={48} aria-hidden="true" />}
              <div className="cf-event-image-shade" />
              <span className="cf-event-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <span className="cf-event-format">{format(event)}</span>
              {registered && <span className="cf-event-registered"><CheckCircle2 size={13} />Registered</span>}
            </div>
            <div className="cf-event-card-body">
              <h2 id={`event-card-${event.slug}`}>{event.name}</h2>
              <p>{presentation?.tagline ?? event.description}</p>
              <div className="cf-event-card-footer">
                <div className="cf-event-prize"><span>Prize pool</span><strong>{money(event.prize_pool)}</strong></div>
                <button className="cf-event-card-action" onClick={() => setSelectedEvent(event)} aria-label={`View ${event.name} criteria`}>View criteria <ArrowUpRight size={16} /></button>
              </div>
            </div>
          </article>;
        })}
      </div>
      {filteredEvents.length === 0 && <div className="cf-events-empty"><p>No events in this category.</p><button onClick={() => setFilter('all')}>View all events <ArrowRight size={16} /></button></div>}

      <section className="cf-events-ticket" aria-labelledby="events-ticket-title">
        <span className="cf-events-ticket-star" aria-hidden="true">✳</span>
        <h2 id="events-ticket-title">Your next big moment.</h2>
        <p>Free entry for Class 12 students</p>
        <button className="cf-events-register" onClick={register}>Register Now <ArrowRight size={19} /></button>
      </section>
    </div>
    {selectedEvent && <EventCriteria event={selectedEvent} onClose={() => setSelectedEvent(null)} onRegister={register} />}
  </div>;
}
