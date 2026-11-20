import React, { useState } from 'react';
import { Sparkles, ArrowUpRight, Mail, X, Info } from 'lucide-react';

const STORAGE_KEY = 'crossfire_showcase_banner_dismissed';

export const ShowcaseBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // sessionStorage unavailable
    }
  };

  if (dismissed) return null;

  return (
    <aside
      aria-label="Showcase mode announcement"
      className="relative z-50 bg-[#07131b] border-b border-orange-500/30 text-white px-3.5 py-2.5 sm:px-6 sm:py-3 shadow-lg"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-[13px]">
        {/* Messages */}
        <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 font-bold uppercase tracking-wider text-[10px] shrink-0">
            <Sparkles className="w-3 h-3 text-orange-400" aria-hidden="true" />
            <span>Showcase Mode</span>
          </span>
          <div className="leading-snug text-slate-200">
            <p className="font-semibold text-slate-100">
              This website is currently operating in showcase mode. Our backend services are temporarily paused, but you can still explore the design and experience.
            </p>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Want a premium website like this for your brand or business? Let&apos;s build something exceptional together.
            </p>
          </div>
        </div>

        {/* CTAs & Close Button */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto justify-end">
          <a
            href="mailto:info.trueinspire.ac@gmail.com"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Start a Project</span>
          </a>

          <a
            href="https://true-inspires.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white border border-white/20 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Explore True Inspires</span>
            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
          </a>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss showcase notice"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1 cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export const ShowcaseHeroSection: React.FC = () => {
  return (
    <section
      aria-labelledby="showcase-section-title"
      className="my-8 max-w-5xl mx-auto px-4 sm:px-6"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0b1c26] via-[#07131b] to-[#04090d] border border-orange-500/25 p-6 sm:p-8 md:p-10 shadow-2xl text-white">
        <div
          className="absolute -top-24 -right-24 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Interactive Digital Showcase</span>
            </div>
            
            <h2 id="showcase-section-title" className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
              Operating in Showcase Mode
            </h2>
            
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              This website is currently operating in showcase mode. Our backend services are temporarily paused, but you can still explore the design and experience.
            </p>

            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              Want a premium website like this for your brand or business? Let&apos;s build something exceptional together.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <a
              href="mailto:info.trueinspire.ac@gmail.com"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span>Start a Project</span>
            </a>

            <a
              href="https://true-inspires.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm transition-all hover:scale-[1.02] cursor-pointer"
            >
              <span>Explore True Inspires</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export const ShowcaseFeatureNotice: React.FC<{ featureName?: string }> = ({
  featureName = 'This feature',
}) => {
  return (
    <div
      role="status"
      className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3 my-4"
    >
      <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-bold text-amber-100">Showcase Mode Notice</p>
        <p className="text-amber-200/90 mt-0.5">
          {featureName} is connected to backend services that are temporarily paused in showcase mode. You are viewing a static demonstration of the interface.
        </p>
      </div>
    </div>
  );
};
