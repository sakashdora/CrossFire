import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CalendarDays, ChevronDown, Download, FileText, Gift, MapPin, Minus, Pause, Play, Plus, RotateCcw, Trophy, Users } from 'lucide-react';
import { CountdownTimer } from '../components/CountdownTimer';
import { CROSSFIRE_START } from '../lib/countdown';
import { HeroStarfield } from '../components/HeroStarfield';
import { useEvents } from '../context/EventsContext';
import { EventItem } from '../types';
import './landing.css';
import './landing-motion.css';
import './landing-hero.css';

interface LandingPageProps { onSelectEvent: (event: EventItem) => void; setCurrentView: (view: string) => void; introActive: boolean; onReplayIntro: () => void; }
const TRACKS = ['Quiz', 'Debate', 'Poster Making', 'Treasure Hunt', 'Ramp Walk', 'Reels'];
const SCHEDULE = [['09:30', 'Registration & check-in'], ['10:00', 'Opening ceremony'], ['10:30', 'Quiz'], ['11:30', 'Ramp Walk'], ['12:30', 'Lunch & refreshments'], ['13:30', 'Debate'], ['14:30', 'Reels screening & poster judging'], ['15:00', 'Treasure Hunt'], ['16:00', 'Awards ceremony']];
const FAQS = [
  { question: 'Who can participate?', answer: 'Class 12 students from CBSE, ICSE and CHSE boards across Odisha. Bring your school or college ID, or an authorization letter, on the day.' },
  { question: 'Is registration free?', answer: 'Yes. Entry to all six competitions is free, with complimentary lunch and refreshments for registered participants. Check the schedule when choosing your events, as some competition times overlap.' },
  { question: 'Will I receive a certificate?', answer: 'Every registered student who participates receives a certificate of participation from Srusti Academy of Graduate Studies. Winners also receive cash prizes and merit certificates.' },
];

// One local atlas provides the six coordinated photographic backgrounds.
function ArenaPhoto({ index }: { index: number }) {
  return <svg className="arena-photo" viewBox={`${(index % 3) * 512} ${Math.floor(index / 3) * 512} 512 512`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="/images/arena-contact-sheet.png" width="1536" height="1024" /></svg>;
}

export function LandingPage({ onSelectEvent, setCurrentView, introActive, onReplayIntro }: LandingPageProps) {
  const { events } = useEvents();
  const landingRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const [effectsPaused, setEffectsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [heroVisible, setHeroVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(!document.hidden);
  const motionEnabled = !effectsPaused && !reducedMotion;
  const sceneRunning = motionEnabled && !introActive && heroVisible && pageVisible;
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [downloadsOpen, setDownloadsOpen] = useState(false);
  const downloadsRef = useRef<HTMLDivElement>(null);
  const downloadsButtonRef = useRef<HTMLButtonElement>(null);
  const prizePool = events.reduce((total, event) => total + event.prize_pool, 0);
  const money = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setPageVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    if (heroRef.current) observer.observe(heroRef.current);
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { observer.disconnect(); preference.removeEventListener('change', updatePreference); document.removeEventListener('visibilitychange', updateVisibility); };
  }, []);
  useEffect(() => {
    if (!motionEnabled || introActive) return;
    const elements = Array.from(landingRef.current?.querySelectorAll<HTMLElement>('[data-reveal]') ?? []);
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('cf-is-visible'); observer.unobserve(entry.target); }
      });
    }, { threshold: .08 });
    elements.forEach(element => { element.classList.add('cf-reveal'); observer.observe(element); });
    return () => { observer.disconnect(); elements.forEach(element => element.classList.remove('cf-reveal', 'cf-is-visible')); };
  }, [motionEnabled, introActive, events.length]);
  useEffect(() => {
    if (!downloadsOpen) return;
    const dismiss = (event: PointerEvent) => { if (!downloadsRef.current?.contains(event.target as Node)) setDownloadsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setDownloadsOpen(false); downloadsButtonRef.current?.focus(); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [downloadsOpen]);
  const exploreTracks = () => document.getElementById('arenas')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  return <div ref={landingRef} className={`crossfire-landing${motionEnabled ? '' : ' cf-motion-off'}`} data-intro-active={introActive}>
    <section ref={heroRef} className={`cf-hero${sceneRunning ? ' cf-scene-running' : ''}`} aria-labelledby="crossfire-title">
      <div className="cf-atmosphere" aria-hidden="true"><span /><span /><span /></div>
      <HeroStarfield active={sceneRunning} />
      <div className="cf-hero-content">
        <div className="cf-institution">
          <img src="/sagslogo.png" alt="SAGS college logo" width="46" height="48" />
          <div><p>Srusti Academy of<br />Management and Technology</p><span><MapPin size={13} aria-hidden="true" />Srusti Campus, Bhubaneswar, Odisha</span></div>
        </div>
        <h1 id="crossfire-title" className="cf-brand">
          <span className="sr-only">CrossFire 2026 — State level competition</span>
          <svg className="cf-brand-flame" viewBox="300 140 670 550" aria-hidden="true" focusable="false"><image href="/hero-brand-complete.png" width="1280" height="1280" /></svg>
          <img className="cf-brand-wordmark" src="/hero-crossfire-title.png" alt="" width="620" height="132" />
        </h1>
        <p className="cf-hero-eyebrow"><span />State level competition<b>2026</b></p>
        <p className="cf-tagline">Ignite your talent.</p>
        <p className="cf-event-meta"><CalendarDays size={16} aria-hidden="true" /><time dateTime="2026-11-15">Sunday, 15 November 2026</time></p>
        <CountdownTimer animate={sceneRunning} />
        <p className="cf-countdown-deadline"><time dateTime={CROSSFIRE_START}>15 Nov 2026 <span aria-hidden="true">•</span> 09:30 AM IST</time></p>
        <div className="cf-hero-actions">
          <button className="cf-button cf-button-orange" onClick={() => setCurrentView('register')}>Register Free <ArrowUpRight size={19} /></button>
          <button className="cf-button cf-button-outline" onClick={exploreTracks}>Explore 6 Arenas <ArrowRight size={18} /></button>
        </div>
        <p className="cf-eligibility">Class 12 students <span aria-hidden="true">•</span> CBSE / ICSE / CHSE</p>
        <div className="cf-motion-controls">
          <div className="cf-downloads" ref={downloadsRef}><button ref={downloadsButtonRef} aria-expanded={downloadsOpen} aria-controls="cf-download-links" onClick={() => setDownloadsOpen(!downloadsOpen)}><Download size={13} />Brochure & Media <ChevronDown size={12} /></button>
            {downloadsOpen && <div className="cf-download-menu" id="cf-download-links"><a href="/crossfire-2026-brochure.pdf" download onClick={() => setDownloadsOpen(false)}><FileText size={16} />Event brochure <span>PDF</span></a><a href="/crossfire-2026-poster.pdf" download onClick={() => setDownloadsOpen(false)}><Download size={16} />Event poster <span>PDF</span></a><a href="/Crossfire-coupon.pdf" download onClick={() => setDownloadsOpen(false)}><Download size={16} />Event coupon <span>PDF</span></a></div>}
          </div>
          <button onClick={onReplayIntro}><RotateCcw size={13} />Replay intro</button>
          {reducedMotion ? <span className="cf-motion-preference">Reduced motion on</span> : <button onClick={() => setEffectsPaused(value => !value)} aria-pressed={effectsPaused}>{effectsPaused ? <Play size={13} /> : <Pause size={13} />}{effectsPaused ? 'Play effects' : 'Pause effects'}</button>}
        </div>
      </div>
      <div className="cf-hero-stats" aria-label="Event highlights">
        <div><Trophy aria-hidden="true" /><p><strong>{String(events.length).padStart(2, '0')}</strong> Arenas</p></div>
        <div><Gift aria-hidden="true" /><p><strong>{money(prizePool)}</strong> in prizes</p></div>
        <div><Users aria-hidden="true" /><p><strong>Free</strong> entry<small>Refreshments included</small></p></div>
      </div>
    </section>
    <section className="cf-arenas" id="arenas" aria-labelledby="arenas-title">
      <div className="cf-section-heading" data-reveal><div><p className="cf-kicker"><span>01</span> / The competitions</p><h2 id="arenas-title">Six arenas.<br />One <span className="cf-outline-text">spotlight.</span></h2></div><div className="cf-section-aside"><p>Find your strength.<br />Make your mark.</p><a href="/crossfire-2026-brochure.pdf" target="_blank" rel="noreferrer">Explore the rulebook <ArrowUpRight size={18} /></a></div></div>
      <div className="cf-arena-grid">{TRACKS.map((name, index) => {
        const event = events.find(item => item.name === name);
        if (!event) return null;
        const slug = name.toLowerCase().replace(/ /g, '-');
        return <button className={`cf-arena cf-arena-${slug}`} data-reveal key={name} onClick={() => onSelectEvent(event)} aria-label={`View ${name} track, ${money(event.prize_pool)} prize pool`}><ArenaPhoto index={index} /><div className="cf-arena-shade" /><span className="cf-arena-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span><h3>{name}</h3><div className="cf-arena-bottom"><div><span className="cf-arena-format">{event.event_type === 'team' ? `Team of ${event.team_size}` : 'Solo'}</span><strong>{money(event.prize_pool)}</strong></div><span className="cf-track-link">View track <ArrowUpRight size={17} /></span></div>{name === 'Reels' && <span className="cf-reels-message" aria-hidden="true">Make your<br />frame<br />count.</span>}</button>;
      })}<div className="cf-prize-rail"><div><strong>{money(prizePool)}</strong><span>Total<br />prize pool</span></div><img src="/hero-bg.jpg" alt="" loading="lazy" /></div></div>
    </section>
    <section className="cf-schedule" aria-labelledby="schedule-title"><div className="cf-schedule-inner" data-reveal><div className="cf-date-block"><p className="cf-kicker"><span>02 / The running order</span></p><h2 id="schedule-title"><time dateTime="2026-11-15">15 <br />Nov</time></h2><p className="cf-date-location">Sunday · Srusti campus</p><p className="cf-day-tagline">One day. All in.</p></div><div className="cf-timetable"><table><caption className="sr-only">Event schedule for November 15, 2026. All times are Indian Standard Time.</caption><tbody>{SCHEDULE.map(([time, title]) => <tr key={time}><th scope="row"><time dateTime={`2026-11-15T${time}:00+05:30`}>{time}</time></th><td>{title}</td></tr>)}</tbody></table><p>All times IST. Quiz and Ramp Walk overlap. Plan your events accordingly.</p></div></div></section>
    <section className="cf-before-arrival" aria-labelledby="faq-title"><div className="cf-faq-grid" data-reveal><div><p className="cf-kicker"><span>03</span> / Before you arrive</p><h2 id="faq-title">Ready for <br />the arena?</h2></div><div className="cf-faqs">{FAQS.map((faq, index) => <div className="cf-faq" key={faq.question}><h3><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} aria-controls={`faq-answer-${index}`} id={`faq-question-${index}`}>{faq.question}{openFaq === index ? <Minus size={20} /> : <Plus size={20} />}</button></h3><div id={`faq-answer-${index}`} role="region" aria-labelledby={`faq-question-${index}`} hidden={openFaq !== index}><p>{faq.answer}</p></div></div>)}</div></div>
      <div className="cf-ticket" data-reveal><div className="cf-ticket-copy"><p className="cf-kicker"><span>Your next big moment</span></p><h2>Be there.</h2><p>CrossFire 2026 · 15 November · Bhubaneswar</p></div><div className="cf-ticket-action"><button className="cf-button cf-button-orange" onClick={() => setCurrentView('register')}>Register Free <ArrowRight size={21} /></button><strong>₹0 entry fee</strong><span>CF / 2026 / 06</span></div></div>
    </section>
  </div>;
}
