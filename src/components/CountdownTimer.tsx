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
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3.5 md:gap-4 select-none">
      {units.map((unit, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-[62px] h-[62px] sm:w-[76px] sm:h-[76px] md:w-20 md:h-20 bg-navy-dark/90 text-white rounded-2xl border border-white/15 flex items-center justify-center shadow-lg shadow-black/40 relative overflow-hidden backdrop-blur-sm group">
            <span className="text-2xl sm:text-3xl md:text-4xl font-black text-orange-400 font-mono tracking-tight">
              {String(unit.value).padStart(2, '0')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-transparent to-white/5 pointer-events-none" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};
