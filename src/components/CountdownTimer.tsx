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
    <div className="flex items-center justify-center gap-2 sm:gap-4 select-none">
      {units.map((unit, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-navy-dark text-white rounded-xl sm:rounded-2xl border border-white/10 flex items-center justify-center shadow-lg shadow-black/20 relative overflow-hidden group">
            <span className="text-xl sm:text-3xl font-black text-orange-400 font-mono tracking-tight">
              {String(unit.value).padStart(2, '0')}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent pointer-events-none"></div>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-widest mt-1.5">
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
};
