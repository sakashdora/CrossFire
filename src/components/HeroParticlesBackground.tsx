import React, { useEffect, useRef } from 'react';
import { ParticlesSwarm } from './ParticlesSwarm';

interface HeroParticlesBackgroundProps {
  count?: number;
  speedMult?: number;
  className?: string;
}

export const HeroParticlesBackground: React.FC<HeroParticlesBackgroundProps> = ({
  count,
  speedMult = 1,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const swarmRef = useRef<ParticlesSwarm | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Calibrated particle count for refined, premium aesthetics & silky 60 FPS
    const isMobile = window.innerWidth < 768;
    const effectiveCount = count ?? (isMobile ? 2200 : 4500);

    try {
      const swarm = new ParticlesSwarm(container, effectiveCount);
      swarm.speedMult = speedMult;
      swarmRef.current = swarm;
    } catch (err) {
      console.error('Failed to initialize ParticlesSwarm WebGL background:', err);
    }

    return () => {
      if (swarmRef.current) {
        swarmRef.current.dispose();
        swarmRef.current = null;
      }
    };
  }, [count, speedMult]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    />
  );
};
