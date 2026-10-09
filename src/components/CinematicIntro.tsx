import { useCallback, useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react';
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

/** A skippable brand reveal; its timing is decorative, not download progress. */
export function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const completeRef = useRef(onComplete);
  const finishedRef = useRef(false);

  useEffect(() => {
    completeRef.current = onComplete;
  }, [onComplete]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    completeRef.current();
  }, []);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.body.style.overflow = 'hidden';
    dialog.showModal();

    // A timer also dismisses the intro if CSS animations cannot run.
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

      <div className="cf-intro-edition" aria-hidden="true"><span className="cf-intro-monogram">CF<span> / </span>26</span><span>SRUSTI PRESENTS</span></div>
      <button className="cf-intro-skip" onClick={finish} autoFocus>
        Skip intro <ArrowRight size={16} aria-hidden="true" />
      </button>

      <div className="cf-intro-brand">
        <p className="cf-intro-presenter">Srusti Academy of Management and Technology</p>
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
