import { ArrowUpRight } from 'lucide-react';
import { useEvents } from '../context/EventsContext';
import type { EventItem } from '../types';

// The first six positions match the cells in the original photographic atlas.
const TRACKS = ['Quiz', 'Debate', 'Poster Making', 'Treasure Hunt', 'Ramp Walk', 'Reels', 'Dance'];

function ArenaPhoto({ index }: { index: number }) {
  const dance = TRACKS[index] === 'Dance';
  return <svg className="arena-photo" aria-hidden="true" focusable="false"
    viewBox={dance ? '0 120 1024 650' : `${index % 3 * 512} ${Math.floor(index / 3) * 512} 512 512`}
    preserveAspectRatio={dance ? 'xMidYMin slice' : 'xMidYMid slice'}>
    <image href={dance ? '/images/dance-poster-v2.png' : '/images/arena-contact-sheet.png'} width={dance ? 1024 : 1536} height="1024" />
  </svg>;
}

export function ArenaGallery({ onSelectEvent }: { onSelectEvent: (event: EventItem) => void }) {
  const { events, error, isLoading } = useEvents();
  const total = events.reduce((sum, event) => sum + event.prize_pool, 0);
  const money = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return <section className="cf-arenas" id="arenas" aria-labelledby="arenas-title">
    {(isLoading || error) && <p role="status" className="px-5 py-4 text-sm text-slate-300">{isLoading ? 'Loading event information…' : 'Event details are temporarily unavailable. Please refresh to try again.'}</p>}
    <div className="cf-section-heading" data-reveal>
      <div><p className="cf-kicker"><span>01</span> / The competitions</p><h2 id="arenas-title">{events.length || 'Your'} arenas.<br />One <span className="cf-outline-text">spotlight.</span></h2></div>
      <div className="cf-section-aside"><p>Find your strength.<br />Make your mark.</p><a href="/crossfire-2026-brochure.pdf" target="_blank" rel="noreferrer">Explore the rulebook <ArrowUpRight size={18} /></a></div>
    </div>
    {events.length > 0 && <div className="cf-arena-grid">
      {TRACKS.map((name, index) => {
        const event = events.find(item => item.name === name);
        if (!event) return null;
        return <button className={`cf-arena cf-arena-${event.slug}`} data-reveal key={event.id} onClick={() => onSelectEvent(event)} aria-label={`View ${name} track, ${money(event.prize_pool)} prize pool`}>
          <ArenaPhoto index={index} />
          <div className="cf-arena-shade" />
          <span className="cf-arena-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <h3>{name}</h3>
          <div className="cf-arena-bottom">
            <div><span className="cf-arena-format">{event.event_type === 'team' ? `Team of ${event.team_size}` : 'Solo'}</span><strong>{money(event.prize_pool)}</strong></div>
            <span className="cf-track-link">View track <ArrowUpRight size={17} /></span>
          </div>
          {name === 'Reels' && <span className="cf-reels-message" aria-hidden="true">Make your<br />frame<br />count.</span>}
        </button>;
      })}
      <div className="cf-prize-rail"><div><strong>{money(total)}</strong><span>Total<br />prize pool</span></div><img src="/hero-bg.jpg" alt="" loading="lazy" /></div>
    </div>}
  </section>;
}
