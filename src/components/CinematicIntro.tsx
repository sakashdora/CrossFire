import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, FastForward, ShieldCheck } from 'lucide-react';

interface CinematicIntroProps {
  onComplete: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<number>(0); // 0: Start, 1: SAGS, 2: Collision (✕), 3: CROSSFIRE, 4: Exit
  const [progress, setProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Phase & Progress Timer Sequence
  useEffect(() => {
    // Phase 1: SAGS Reveal (0.4s)
    const t1 = setTimeout(() => {
      setPhase(1);
    }, 400);

    // Phase 2: Collision (✕) (1.6s)
    const t2 = setTimeout(() => {
      setPhase(2);
    }, 1600);

    // Phase 3: CROSSFIRE 2026 Slam (2.6s)
    const t3 = setTimeout(() => {
      setPhase(3);
    }, 2600);

    // Phase 4: Warp Out & Transition (4.0s)
    const t4 = setTimeout(() => {
      setPhase(4);
    }, 4000);

    // Complete (4.4s)
    const tEnd = setTimeout(() => {
      onComplete();
    }, 4400);

    // Smooth Progress Counter
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 1.5, 100));
    }, 50);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
      clearInterval(interval);
    };
  }, []);

  // Keyboard shortcut listener for instant skip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Escape' || e.code === 'Enter') {
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onComplete]);

  // HTML5 Canvas Ember & Shockwave Physics Engine (Pure Blue & White Palette)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle System Definition
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      alpha: number;
      color: string;
      life: number;
      maxLife: number;
    }

    interface Shockwave {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      width: number;
    }

    const embers: Particle[] = [];
    const shockwaves: Shockwave[] = [];
    const colors = ['#0062FF', '#38BDF8', '#7DD3FC', '#FFFFFF', '#0284C7'];

    // Initialize initial ambient embers
    for (let i = 0; i < 70; i++) {
      embers.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.8,
        speedX: (Math.random() - 0.5) * 1.2,
        speedY: -(Math.random() * 1.5 + 0.6),
        alpha: Math.random() * 0.7 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: Math.random() * 120 + 80,
      });
    }

    // Trigger shockwave at phase 3
    let shockwaveTriggered = false;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Trigger explosion shockwave when entering phase 3
      if (phase >= 3 && !shockwaveTriggered) {
        shockwaveTriggered = true;
        shockwaves.push({
          x: width / 2,
          y: height / 2,
          radius: 10,
          maxRadius: Math.max(width, height) * 0.75,
          alpha: 1,
          width: 6,
        });

        // Spawn burst sparks in Diamond White & Cyan/Blue
        for (let j = 0; j < 90; j++) {
          const angle = Math.random() * Math.PI * 2;
          const velocity = Math.random() * 14 + 4;
          embers.push({
            x: width / 2,
            y: height / 2,
            size: Math.random() * 3 + 1.5,
            speedX: Math.cos(angle) * velocity,
            speedY: Math.sin(angle) * velocity,
            alpha: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 0,
            maxLife: Math.random() * 60 + 40,
          });
        }
      }

      // Draw and update shockwaves
      for (let s = shockwaves.length - 1; s >= 0; s--) {
        const sw = shockwaves[s];
        sw.radius += (sw.maxRadius - sw.radius) * 0.08 + 4;
        sw.alpha *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 98, 255, ${sw.alpha * 0.8})`;
        ctx.lineWidth = sw.width;
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 20;
        ctx.stroke();
        ctx.restore();

        if (sw.alpha < 0.02 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(s, 1);
        }
      }

      // Draw and update particles
      for (let i = embers.length - 1; i >= 0; i--) {
        const p = embers[i];

        // Gravitational vortex pull towards center during phase 2
        if (phase === 2) {
          const dx = width / 2 - p.x;
          const dy = height / 2 - p.y;
          p.speedX += dx * 0.003;
          p.speedY += dy * 0.003;
        }

        p.x += p.speedX;
        p.y += p.speedY;
        p.life++;

        // Fade out as particle expires
        const currentAlpha = Math.max(0, p.alpha * (1 - p.life / p.maxLife));

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentAlpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 4;
        ctx.fill();
        ctx.restore();

        // Respawn ambient embers
        if (p.life >= p.maxLife || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          embers.splice(i, 1);
          if (phase < 4) {
            embers.push({
              x: Math.random() * width,
              y: height + 10,
              size: Math.random() * 2.5 + 0.8,
              speedX: (Math.random() - 0.5) * 1.2,
              speedY: -(Math.random() * 1.5 + 0.6),
              alpha: Math.random() * 0.7 + 0.3,
              color: colors[Math.floor(Math.random() * colors.length)],
              life: 0,
              maxLife: Math.random() * 120 + 80,
            });
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: phase === 4 ? 0 : 1, scale: phase === 4 ? 1.05 : 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={onComplete}
      className="fixed inset-0 z-[99999] bg-[#000817] flex flex-col justify-between select-none overflow-hidden cursor-pointer"
    >
      {/* 35mm Subtle Film Grain Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />

      {/* Atmospheric Ambient Blue Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] bg-cyan-500/20 rounded-full blur-[90px] pointer-events-none" />

      {/* Physics Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />

      {/* Anamorphic Cyan Lens Flare Sweep (Triggered during Collision / Phase 2-3) */}
      <AnimatePresence>
        {phase >= 2 && phase < 4 && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.9, 0.3], scaleX: [0, 1.4, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute top-1/2 left-0 right-0 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400 via-sky-200 to-transparent pointer-events-none z-20 shadow-[0_0_25px_rgba(56,189,248,0.9)]"
          />
        )}
      </AnimatePresence>

      {/* ── Top Widescreen Letterbox Bar ── */}
      <div className="relative z-30 w-full px-6 py-4 flex items-center justify-end">
        {/* Instant Skip Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-[#0062FF] text-white text-xs font-bold tracking-wider uppercase transition-all backdrop-blur-md border border-white/20 hover:border-blue-400 shadow-md"
        >
          <span>Skip</span>
          <FastForward className="w-3 h-3" />
        </button>
      </div>

      {/* ── Central Cinematic Stage ── */}
      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 text-center">
        
        {/* STAGE 1: SAGS (Srusti Academy) Emergence */}
        <AnimatePresence>
          {phase >= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.85, filter: 'blur(10px)' }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                filter: 'blur(0px)',
              }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center space-y-3"
            >
              {/* Dual Institutional Emblem with Cyan Halo */}
              <div className="relative flex items-center justify-center gap-3 mb-1">
                <div className="absolute inset-0 bg-cyan-400/25 rounded-full blur-xl animate-pulse" />
                <div className="relative h-14 sm:h-16 px-3 py-1.5 rounded-2xl bg-white shadow-[0_0_35px_rgba(56,189,248,0.35)] flex items-center justify-center border-2 border-white/50">
                  <img
                    src="/sagslogo.png"
                    alt="SAGS Logo"
                    className="h-full object-contain"
                  />
                </div>
              </div>

              {/* SAGS Headline */}
              <motion.div
                initial={{ letterSpacing: '0.15em' }}
                animate={{ letterSpacing: '0.25em' }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
                className="text-[11px] sm:text-xs md:text-sm font-black text-cyan-300 uppercase tracking-[0.25em] drop-shadow-[0_2px_10px_rgba(0,195,255,0.4)]"
              >
                SRUSTI ACADEMY OF GRADUATE STUDIES
              </motion.div>
              
              <div className="text-[9px] sm:text-[10px] text-slate-300 font-mono uppercase tracking-[0.3em]">
                PRESENTS
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 2: The Collaboration Collision ("✕") */}
        <AnimatePresence>
          {phase >= 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 2.5, rotate: -45, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, rotate: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="my-3 sm:my-4 relative"
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#0052CC] via-[#0062FF] to-[#38BDF8] flex items-center justify-center shadow-[0_0_30px_rgba(0,98,255,0.8)] border-2 border-white/60">
                <span className="text-xl sm:text-2xl font-black text-white font-sans leading-none">
                  ✕
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 3: CROSSFIRE 2026 Slam Reveal in Pure Diamond White + Sky Blue */}
        <AnimatePresence>
          {phase >= 3 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7, y: 40, filter: 'blur(14px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-3 max-w-4xl"
            >
              {/* Main Cinematic Title */}
              <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight uppercase">
                <span className="text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">CROSS</span>
                <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,98,255,0.8)]">
                  FIRE
                </span>
                <span className="ml-2 sm:ml-3 text-2xl sm:text-4xl md:text-5xl font-black text-cyan-300">
                  2026
                </span>
              </h1>

              {/* Sub-tagline & Badges in Blue & White */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-semibold"
              >
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-cyan-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>State-Level Talent Showdown</span>
                </div>
                
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600/20 border border-blue-400/40 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>₹81,000+ Grand Prize Pool</span>
                </div>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-[11px] sm:text-xs text-slate-300 font-mono tracking-widest uppercase pt-1"
              >
                6 Arenas • Sunday, Nov 15, 2026 • Srusti Campus, Bhubaneswar
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Bottom Widescreen Letterbox Bar ── */}
      <div className="relative z-30 w-full px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/[0.06] bg-[#000817]/60 backdrop-blur-md">
        
        {/* Left: Designed by TRUE INSPIRE TEAM */}
        <div className="text-[11px] text-slate-300 font-medium">
          Powered by <strong className="text-white">TRUE INSPIRE TEAM</strong>
        </div>

        {/* Center: Tap to Enter Prompt */}
        <div className="text-[11px] text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider animate-pulse">
          <span>Tap anywhere to Enter</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>

        {/* Right: Progress Tracker */}
        <div className="w-32 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#0052CC] via-[#0062FF] to-[#38BDF8]"
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>

    </motion.div>
  );
};
