import React, { useEffect, useRef } from 'react';
import { ParticlesSwarm, ParticlesSwarmOptions } from './ParticlesSwarm';

interface HeroParticlesBackgroundProps extends ParticlesSwarmOptions {
  className?: string;
}

export const HeroParticlesBackground: React.FC<HeroParticlesBackgroundProps> = ({
  count,
  speedMult = 1,
  cameraZ,
  interactive = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const swarmRef = useRef<ParticlesSwarm | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Adapt particle count for mobile screens to maintain 60 FPS
    const isMobile = window.innerWidth < 768;
    const effectiveCount = count ?? (isMobile ? 9000 : 18000);
    const effectiveCameraZ = cameraZ ?? (isMobile ? 145 : 125);

    try {
      const swarm = new ParticlesSwarm(container, {
        count: effectiveCount,
        speedMult,
        cameraZ: effectiveCameraZ,
        interactive,
      });
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
  }, [count, speedMult, cameraZ, interactive]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    />
  );
};
