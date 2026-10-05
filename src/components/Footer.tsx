import React, { useState } from 'react';
import { MapPin, Phone, Mail, Calendar, ExternalLink, Copy, Check, CheckCircle2, Download, Heart } from 'lucide-react';

interface FooterProps {
  setCurrentView?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const officialEmail = 'mail@srustiacademy.ac.in';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleNavigate = (view: string) => {
    if (setCurrentView) {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-[#000511] text-slate-300 border-t border-white/5 font-sans">
      
      {/* Glowing Top Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

          {/* Col 1: Brand & Event Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-md flex items-center justify-center">
                <img src="/Logo.png" alt="CrossFire 2026" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-lg font-black text-white tracking-wider">
                  CROSS<span className="text-orange-500">FIRE</span>{' '}
                  <span className="text-sm font-bold text-orange-400">2026</span>
                </p>
                <p className="text-[11px] text-slate-400">Srusti Academy • State Talent Hunt</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-orange-500 shrink-0" />
              <span>Sunday, Nov 15, 2026 — Report by 09:30 AM</span>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <a
                href="/crossfire-2026-brochure.pdf"
                download="Crossfire - 2026 Brochure.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-orange-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Brochure (PDF)
              </a>
              <a
                href="/crossfire-2026-poster.pdf"
                download="A3 Crossfire - 2026 Poster.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-orange-400 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Event Poster
              </a>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <button onClick={() => handleNavigate('events')} className="text-slate-400 hover:text-white transition-colors">
                Events →
              </button>
              <button onClick={() => handleNavigate('leaderboard')} className="text-slate-400 hover:text-white transition-colors">
                Leaderboard →
              </button>
              <button onClick={() => handleNavigate('register')} className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
                Register Free →
              </button>
            </div>
          </div>

          {/* Col 2: Venue */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              Venue
            </h4>

            <div className="text-xs space-y-1 text-slate-400">
              <p className="font-bold text-white text-sm">Srusti Academy of Graduate Studies</p>
              <p>Plot No. 38/1, Chandaka Industrial Estate,</p>
              <p>Near Infocity, Patia, Bhubaneswar — 751024</p>
            </div>

            <a
              href="https://maps.google.com/?q=Srusti+Academy+of+Graduate+Studies+Bhubaneswar"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open in Google Maps
            </a>

            <p className="text-[11px] text-slate-500 pt-1 border-t border-white/5">
              Eligibility: +2 2nd Year (Class 12) — CBSE, ICSE & CHSE. College ID mandatory.
            </p>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              Contact
            </h4>

            {/* Email */}
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <a
                href={`mailto:${officialEmail}`}
                className="text-slate-300 hover:text-orange-400 transition-colors truncate"
              >
                {officialEmail}
              </a>
              <button
                onClick={handleCopyEmail}
                className="p-1 rounded-md bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors shrink-0"
                title="Copy email"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {copiedEmail && (
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Copied!
              </p>
            )}

            {/* Coordinators */}
            <div className="text-xs space-y-1 text-slate-400">
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1">Coordinators</p>
              <p>Mr. N.R. Swain — <span className="text-amber-400 font-bold">+91 7008671339</span></p>
              <p>Mr. A. Meher — <span className="text-amber-400 font-bold">+91 8455090984</span></p>
            </div>

            <p className="text-[10px] text-slate-600 border-t border-white/5 pt-2">
              Media: Prameya News • News 7
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© 2026 Srusti Academy of Graduate Studies. All rights reserved.</p>
          <div className="flex items-center gap-1.5">
            <span>Designed with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>by <strong className="text-slate-400">True Inspire Team</strong></span>
          </div>
        </div>
      </div>

    </footer>
  );
};
