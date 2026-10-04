import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  ArrowRight, 
  CheckCircle2,
  Calendar,
  Award,
  IdCard,
  Users,
  School
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChampionshipNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRegister: () => void;
}

export const ChampionshipNoticeModal: React.FC<ChampionshipNoticeModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRegister,
}) => {
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('crossfire_notice_dismissed_until', (Date.now() + 24 * 60 * 60 * 1000).toString());
      } catch (e) {
        // Ignore storage errors
      }
    }
    onClose();
  };

  // Keyboard shortcut ESC to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontShowAgain]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          
          {/* Deep blur backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-[#000a17]/75 backdrop-blur-md"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 360 }}
            className="relative w-full max-w-2xl my-auto flex flex-col bg-[#FAFCFF] text-slate-800 rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,18,60,0.4)] border border-blue-200/90 overflow-hidden select-none"
          >
            {/* 1. macOS Style Dark Window Title Bar */}
            <div className="relative px-3.5 sm:px-5 py-2.5 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleClose}
                  className="w-3 h-3 rounded-full bg-[#FF5F56] border border-[#E0443E] hover:opacity-80 transition-opacity cursor-pointer flex items-center justify-center group"
                  aria-label="Close"
                >
                  <X className="w-1.5 h-1.5 text-red-950 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
              </div>

              <div className="px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/80 shadow-inner flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[11px] font-semibold text-slate-200 tracking-wide">
                  Srusti Academy • Official Notice
                </span>
              </div>

              <button
                onClick={handleClose}
                className="w-6 h-6 rounded-md text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close Notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Modal Body */}
            <div 
              className="relative p-4 sm:p-6 space-y-4 overflow-y-auto"
              style={{
                backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
                backgroundColor: '#FAF8F5'
              }}
            >
              
              {/* Header */}
              <div className="relative text-center space-y-2">
                <div className="flex items-center justify-center gap-2.5">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white p-1 shadow-sm border border-blue-200 flex items-center justify-center">
                    <img src="/Logo.png" alt="CrossFire 2026 Logo" className="w-full h-full object-contain" />
                  </div>
                  <div className="text-left">
                    <span className="block text-xs sm:text-sm font-black text-[#0062FF] tracking-wider leading-none">
                      CROSSFIRE <span className="text-slate-900">2026</span>
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Srusti Academy of Graduate Studies
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFF9E6] border border-[#F6D268] text-[#B45309] text-[10px] sm:text-[11px] font-black tracking-wider uppercase">
                  <span>STATE-LEVEL TALENT HUNT • NOV 15, 2026</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                  Registration Now Open ✨
                </h2>

                <p className="text-[11px] sm:text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
                  100% Free participation for +2 Final Year students across Odisha. Win from ₹50,000 total cash prize pool.
                </p>
              </div>

              {/* Stats Cards — Real Data */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                
                {/* Card 1: Students Registered */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0062FF]" />
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-black text-[#0062FF] leading-none">480+</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                      Students Registered
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    +2 Final Year students across Odisha
                  </span>
                </div>

                {/* Card 2: Colleges Registered */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col items-center gap-2 text-center">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <School className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-3xl sm:text-4xl font-black text-orange-500 leading-none">50+</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                      Colleges Registered
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    CBSE, ICSE & CHSE institutions
                  </span>
                </div>

              </div>

              {/* Official Rules */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#FFFDF5] border border-[#F6D268] text-slate-800">
                
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-200/80">
                  <div className="w-6 h-6 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center shrink-0">
                    <Bell className="w-3.5 h-3.5 text-[#D97706]" />
                  </div>
                  <h4 className="font-black text-[#78350F] uppercase tracking-wide text-[11px] sm:text-xs">
                    PARTICIPATION RULES
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-snug">
                  
                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Eligibility:</strong>
                      +2 2nd Year (Class 12) from CBSE, ICSE & CHSE.
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    <IdCard className="w-3.5 h-3.5 text-[#0062FF] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">ID Required:</strong>
                      School/College ID Card mandatory at entry gate.
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Date & Reporting:</strong>
                      Sun, Nov 15, 2026 — 09:30 AM at Srusti Campus.
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                    <Award className="w-3.5 h-3.5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">Entry & Prizes:</strong>
                      Max 2 events/student. Free Entry. ₹50,000 Cash Pool.
                    </div>
                  </div>

                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-4 sm:px-6 py-2.5 sm:py-3 bg-[#F1F5F9] border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 shrink-0">
              
              <label className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-slate-800 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded border-slate-400 text-[#0062FF] focus:ring-[#0062FF] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Don't show this today</span>
              </label>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleClose}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                >
                  Enter Portal
                </button>

                <button
                  onClick={() => {
                    handleClose();
                    onNavigateToRegister();
                    try {
                      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
                    } catch (e) {}
                  }}
                  className="flex-1 sm:flex-none relative overflow-hidden px-5 py-2 rounded-xl bg-[#0062FF] hover:bg-blue-600 text-white font-black text-xs shadow-sm shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-blue-400/40"
                >
                  <span>Register Free</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
