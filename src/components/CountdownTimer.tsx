import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate = '2026-11-15T09:30:00+05:30',
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { label: 'DAYS', value: timeLeft.days },
    { label: 'HOURS', value: timeLeft.hours },
    { label: 'MINUTES', value: timeLeft.minutes },
    { label: 'SECONDS', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2.5 sm:gap-4 md:gap-5 select-none">
      {units.map((unit, idx) => (
        <div
          key={idx}
          className="w-16 h-20 sm:w-20 sm:h-24 md:w-24 md:h-26 rounded-2xl bg-[#001428]/85 backdrop-blur-md border border-cyan-500/40 hover:border-cyan-400 shadow-[0_0_20px_rgba(0,140,255,0.18)] flex flex-col items-center justify-center p-2 transition-all duration-300 hover:scale-105 group relative overflow-hidden"
        >
          {/* Subtle top glare reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-cyan-400/10 to-transparent pointer-events-none" />
          
          <span className="text-2xl sm:text-3xl md:text-4xl font-black text-cyan-400 font-sans tracking-tight drop-shadow-[0_0_12px_rgba(0,212,255,0.45)]">
            {String(unit.value).padStart(2, '0')}
          </span>
          <span className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mt-1 sm:mt-1.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};
