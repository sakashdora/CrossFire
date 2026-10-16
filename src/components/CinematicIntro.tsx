import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import './cinematic-intro.css';

interface CinematicIntroProps {
  onComplete: () => void;
}

const INTRO_DURATION = 3200;
const EMBERS = Array.from({ length: 18 }, (_, index) => ({
  '--ember-x': `${(index * 37 + 9) % 100}%`,
  '--ember-y': `${(index * 23 + 17) % 100}%`,
  '--ember-delay': `${-(index % 7) * 0.45}s`,
  '--ember-duration': `${3 + (index % 4) * 0.7}s`,
} as CSSProperties));

/** Tactical Esports skippable brand reveal with live telemetry & event ticker */
export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const completeRef = useRef(onComplete);
  const finishedRef = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(INTRO_DURATION / 1000));

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    completeRef.current();
  }, []);

  // Keyboard shortcut listener: ESC or Space immediately skips intro
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        finish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finish]);

  // Numerical countdown timer tick
  useEffect(() => {
    const startTime = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, Math.ceil((INTRO_DURATION - elapsed) / 1000));
      setSecondsLeft(remaining);
    }, 100);
    return () => window.clearInterval(interval);
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.body.style.overflow = 'hidden';
    dialog.showModal();

    // Dismisses the intro when the duration expires or if reduced motion is requested
    const timeout = window.setTimeout(finish, motionPreference.matches ? 120 : INTRO_DURATION);
    const handleMotionPreference = () => {
      if (motionPreference.matches) finish();
    };
    motionPreference.addEventListener('change', handleMotionPreference);

    return () => {
      window.clearTimeout(timeout);
      motionPreference.removeEventListener('change', handleMotionPreference);
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [finish]);

  return (
    <dialog
      ref={dialogRef}
      className="cf-intro"
      style={{ '--intro-duration': `${INTRO_DURATION}ms` } as CSSProperties}
      aria-labelledby="cf-intro-title"
      aria-describedby="cf-intro-description"
      onCancel={(event) => {
        event.preventDefault();
        finish();
      }}
    >
      <div className="cf-intro-atmosphere" aria-hidden="true" />
      <div className="cf-intro-grid" aria-hidden="true" />
      <div className="cf-intro-year" aria-hidden="true">26</div>
      <div className="cf-intro-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="cf-intro-embers" aria-hidden="true">
        {EMBERS.map((style, index) => <i key={index} style={style} />)}
      </div>
      {/* BESPOKE EDITORIAL HEADER */}
      <header className="cf-intro-header" role="banner">
        {/* Left: Authentic Institution & Event Code */}
        <div className="cf-header-left">
          <span className="cf-header-monogram">CF<span className="cf-header-slash">/</span>26</span>
          <span className="cf-header-rule" aria-hidden="true" />
          <div className="cf-header-meta">
            <span className="cf-header-inst">SRUSTI ACADEMY OF GRADUATE STUDIES</span>
            <span className="cf-header-sub">STATE-LEVEL TALENT HUNT • UTKAL UNIV. AFFILIATED</span>
            <span className="cf-header-mobile-tag">SRUSTI PRESENTS</span>
          </div>
        </div>

        {/* Center: Quiet Editorial Ledger */}
        <div className="cf-header-center" aria-live="polite">
          <div className="cf-header-ledger">
            <span className="cf-ledger-item">
              <span className="cf-ledger-accent">₹50,000</span> PRIZE POOL
            </span>
            <span className="cf-ledger-sep" aria-hidden="true">/</span>
            <span className="cf-ledger-item">
              <span className="cf-ledger-light">6 ARENAS</span> SOLO & TEAM
            </span>
            <span className="cf-ledger-sep" aria-hidden="true">/</span>
            <span className="cf-ledger-item">
              <span className="cf-ledger-free">100% FREE ENTRY</span> +2 FINAL YEAR
            </span>
          </div>
        </div>

        {/* Right: Minimalist Cinematic Skip */}
        <div className="cf-header-right">
          <button 
            type="button"
            className="cf-header-skip" 
            onClick={finish} 
            autoFocus 
            aria-label={`Skip intro (${secondsLeft}s remaining)`}
          >
            <span className="cf-skip-ring">
              <svg viewBox="0 0 24 24" className="cf-skip-svg" aria-hidden="true">
                <circle cx="12" cy="12" r="9.5" className="cf-skip-track" />
                <circle cx="12" cy="12" r="9.5" className="cf-skip-progress" />
              </svg>
              <span className="cf-skip-sec">{secondsLeft}</span>
            </span>
            <span className="cf-skip-text">Skip</span>
            <kbd className="cf-skip-kbd" title="Press Escape to skip">ESC</kbd>
            <ArrowRight size={13} className="cf-skip-arrow" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="cf-intro-brand">
        <p className="cf-intro-presenter">Srusti Academy of Graduate Studies</p>
        <div className="cf-intro-emblem" aria-hidden="true">
          <div className="cf-intro-halo" />
          <svg className="cf-intro-orbit" viewBox="0 0 200 200" fill="none">
            <circle className="cf-intro-orbit-guide" cx="100" cy="100" r="86" />
            <circle className="cf-intro-orbit-ticks" cx="100" cy="100" r="98" pathLength="100" />
            <g className="cf-intro-orbit-turn"><circle className="cf-intro-orbit-cyan" cx="100" cy="100" r="86" pathLength="100" /><circle className="cf-intro-orbit-orange" cx="100" cy="100" r="86" pathLength="100" /></g>
          </svg>
          <img className="cf-intro-flame" src="/hero-flame-reticle.png" alt="" width="160" height="120" />
        </div>
        <h2 id="cf-intro-title">
          <span className="sr-only">CrossFire 2026</span>
          <span className="cf-intro-wordmark-shell"><img className="cf-intro-wordmark" src="/hero-crossfire-title.png" alt="" width="620" height="110" /></span>
        </h2>
        <p className="cf-intro-tagline"><span>Ignite</span> <span>your</span> <span>talent.</span></p>
        <div className="cf-intro-loading">
          <div className="cf-intro-ignition" aria-hidden="true"><span /></div>
          <p id="cf-intro-description" className="cf-intro-caption"><span>Six arenas.</span><span>One spotlight.</span></p>
        </div>
      </div>

      <div className="cf-intro-footer" aria-hidden="true">
        <span><i />State level competition</span>
        <span>15.11.2026<span className="cf-intro-footer-divider"> / </span>Bhubaneswar</span>
      </div>
    </dialog>
  );
}
