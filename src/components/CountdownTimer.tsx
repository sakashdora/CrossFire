import { useEffect, useState } from 'react';
import { CROSSFIRE_START, getCountdown } from '../lib/countdown';

function FlipNumber({ value, animate }: { value: number; animate: boolean }) {
  const [frame, setFrame] = useState({ current: value, previous: value });
  if (frame.current !== value || (!animate && frame.previous !== value)) {
    setFrame({ current: value, previous: animate ? frame.current : value });
  }
  const current = String(value).padStart(2, '0');
  const previous = String(frame.previous).padStart(2, '0');
  const flip = animate && frame.current !== frame.previous;
  return <span className="cf-flip" aria-hidden="true" data-value={current}>
    <span className="cf-flip-half cf-flip-top"><b>{current}</b></span>
    <span className="cf-flip-half cf-flip-bottom"><b>{flip ? previous : current}</b></span>
    {flip && <span key={current} className="cf-flip-leaves">
      <span className="cf-flip-half cf-flip-top cf-flip-out"><b>{previous}</b></span>
      <span className="cf-flip-half cf-flip-bottom cf-flip-in"><b>{current}</b></span>
    </span>}
    <span className="cf-flip-seam" />
  </span>;
}

export function CountdownTimer({ targetDate = CROSSFIRE_START, animate = true }: { targetDate?: string; animate?: boolean }) {
  const [countdown, setCountdown] = useState(() => getCountdown(targetDate));
  useEffect(() => {
    let timer: number | undefined;
    const update = () => setCountdown(getCountdown(targetDate));
    const synchronize = () => {
      window.clearInterval(timer);
      update();
      if (!document.hidden && Date.parse(targetDate) > Date.now()) {
        timer = window.setInterval(() => {
          update();
          if (Date.now() >= Date.parse(targetDate)) window.clearInterval(timer);
        }, 1000);
      }
    };
    synchronize();
    document.addEventListener('visibilitychange', synchronize);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', synchronize); };
  }, [targetDate]);
  return <div className="cf-countdown-panel" data-countdown-status={countdown.status}>
    <p className="cf-countdown-label">{countdown.status === 'started' ? 'CrossFire 2026 is here' : countdown.status === 'unavailable' ? 'Event date to be announced' : 'Championship starts in'}</p>
    <div className="cf-countdown" role="timer" aria-label="Time until CrossFire 2026" aria-live="off">
      {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, index) => <div className="cf-countdown-unit" key={label}>
        <span className="sr-only">{countdown.values[index]} {label}</span>
        <FlipNumber value={countdown.values[index]} animate={animate} />
        <span className="cf-countdown-unit-label" aria-hidden="true">{label}</span>
      </div>)}
    </div>
  </div>;
}
