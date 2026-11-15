import { useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, CalendarDays, Clock3, MapPin, Pause, Play, RotateCcw } from 'lucide-react';
import { HeroStarfield } from '../components/HeroStarfield';
import { ArenaGallery } from '../components/ArenaGallery';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { CROSSFIRE_START, CROSSFIRE_START_LABEL } from '../lib/countdown';
import { useEvents } from '../context/EventsContext';
import { ROOM_SCHEDULE, showEventSchedule } from '../data/eventDay';
import type { EventItem } from '../types';
import './event-day.css';

const guests = [
  { name: 'Suraj Kumar Nayak', role: 'Dancer', image: 'guest-suraj-nayak', width: 365, height: 390 },
  { name: 'Namrata Mohanty', role: 'Model / Artist', image: 'guest-namrata-mohanty', width: 315, height: 344 },
];

interface EventDayProps {
  introActive: boolean;
  onReplayIntro: () => void;
  onSelectEvent: (event: EventItem) => void;
}

export function EventDayPage({ introActive, onReplayIntro, onSelectEvent }: EventDayProps) {
  const { events, error, isLoading } = useEvents();
  const [paused, setPaused] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  useScrollReveal(pageRef, !paused && !introActive, events.length);
  const total = events.reduce((sum, event) => sum + event.prize_pool, 0);
  return <div className="crossfire-landing event-day" ref={pageRef}>
    <section className="day-hero" aria-labelledby="event-day-title">
      <HeroStarfield active={!paused && !introActive} />
      <p className="day-presenter">Srusti Academy of Graduate Studies</p>
      <div className="day-brand">
        <svg className="cf-brand-flame" viewBox="86 35 185 157" focusable="false" aria-hidden="true">
          <defs><clipPath id="day-emblem"><polygon points="86,35 271,35 271,149 252,149 246,168 234,181 219,191 142,191 130,184 116,170 108,150 86,150" /></clipPath></defs>
          <image href="/hero-brand-complete.png" width="360" height="360" clipPath="url(#day-emblem)" />
        </svg>
        <div><img src="/hero-crossfire-title.png" alt="CrossFire" width="1200" height="240" /><span>2026</span></div>
      </div>
      <p className="day-closed">Registrations closed</p>
      <h1 id="event-day-title">The stage is set.</h1>
      <p className="day-welcome">See you at CrossFire 2026.</p>
      <dl className="day-arrival">
        <div><CalendarDays aria-hidden="true" /><dt>Event day</dt><dd><time dateTime="2026-11-15">Sunday, <span className="day-date">15 November 2026</span></time></dd></div>
        <div><Clock3 aria-hidden="true" /><dt>Program starts</dt><dd><time dateTime={CROSSFIRE_START}>{CROSSFIRE_START_LABEL} IST</time></dd></div>
        <div><MapPin aria-hidden="true" /><dt>Venue</dt><dd>Srusti Campus<small>Bhubaneswar, Odisha</small></dd></div>
      </dl>
      <div className="day-actions">
        <button className="cf-button day-primary" onClick={showEventSchedule}>View Event Schedule <ArrowDown size={17} /></button>
        <a className="cf-button day-secondary" target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=Srusti+Academy+of+Graduate+Studies%2C+Bhubaneswar">Get Directions <ArrowUpRight size={17} /></a>
      </div>
      <p className="day-pass">Already registered? Keep your QR pass ready.</p>
      {events.length > 0 && <p className="day-stats"><span>{events.length} arenas</span><span>₹{total.toLocaleString('en-IN')} in prizes</span></p>}
      <div className="day-controls">
        <button onClick={onReplayIntro}><RotateCcw size={13} /> Replay intro</button>
        <button className="day-motion" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={13} /> : <Pause size={13} />}{paused ? 'Play effects' : 'Pause effects'}</button>
      </div>
    </section>
    <ArenaGallery onSelectEvent={onSelectEvent} />
    <section className="day-guests" aria-labelledby="day-guest-title">
      <div className="day-wrap day-guest-layout">
        <div className="day-guest-intro">
          <p className="day-label">CrossFire 2026</p>
          <h2 id="day-guest-title">Meet our<br /><em>special guests.</em></h2>
          <p>Srusti Academy of Graduate Studies welcomes Suraj Kumar Nayak and Namrata Mohanty to the state-level talent hunt for +2 final year students from CBSE, ICSE and CHSE.</p>
        </div>
        {guests.map(guest => <figure className="day-guest" key={guest.name}>
          <img src={'/images/' + guest.image + '.webp'} alt={guest.name} width={guest.width} height={guest.height} loading="lazy" />
          <figcaption><span>{guest.role}</span><strong>{guest.name}</strong></figcaption>
        </figure>)}
      </div>
    </section>
    <section className="day-guide" id="event-day-schedule" aria-labelledby="day-guide-title" tabIndex={-1}>
      <div className="day-wrap">
        <div className="day-guide-heading">
          <div><p className="day-label">Sunday · 15 November 2026</p><h2 id="day-guide-title">Event <em>schedule.</em></h2></div>
          <div className="day-programme"><span><b>12:30 PM</b> Lunch &amp; refreshments</span><span><b>4:00 PM</b> Awards ceremony</span><small>All times IST</small></div>
        </div>
        <table className="day-rooms">
          <caption className="sr-only">Competition venues and sessions. Select an event name for its rules and prizes when available.</caption>
          <thead><tr><th scope="col">Event</th><th scope="col">Venue</th><th scope="col">Session</th></tr></thead>
          <tbody>{ROOM_SCHEDULE.map(row => {
            const event = events.find(item => item.slug === row.slug);
            return <tr key={row.name}>
              <th scope="row">{event ? <button onClick={() => onSelectEvent(event)} aria-label={'View details for ' + row.name}>{row.name}<ArrowUpRight size={15} aria-hidden="true" /></button> : row.name}</th>
              <td>{row.venue}{row.floor && <small>{row.floor}</small>}</td>
              <td>{row.session || <><span aria-hidden="true">—</span><span className="sr-only">Session not listed</span></>}</td>
            </tr>;
          })}</tbody>
        </table>
        <div className="day-guide-footer"><p>{error ? 'Event details are unavailable. The room schedule is shown above.' : isLoading ? 'Loading competition details…' : 'A dash means the session is not listed on the room schedule.'}</p><a href="/crossfire-2026-brochure.pdf" target="_blank" rel="noreferrer">Event brochure <ArrowUpRight size={16} /></a></div>
      </div>
    </section>
  </div>;
}
