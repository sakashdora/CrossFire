import React, { useState } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail,
  Calendar, 
  ExternalLink, 
  Copy, 
  Check, 
  Heart, 
  ShieldCheck, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  Download, 
  Flame, 
  CheckCircle2, 
  Info, 
  ChevronRight 
} from 'lucide-react';

interface FooterProps {
  setCurrentView?: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentView }) => {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const officialEmail = 'crossfire2026@srusti.edu.in';

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(officialEmail);
    setCopiedEmail(true);
    setTimeout(() => {
      setCopiedEmail(false);
    }, 2500);
  };

  const handleNavigate = (view: string) => {
    if (setCurrentView) {
      setCurrentView(view);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const eventTracks = [
    { name: 'Brain Buzz', category: 'State Quiz', prize: '₹13,500' },
    { name: 'Glam Walk', category: 'Fashion & Runway', prize: '₹13,500' },
    { name: 'Shorts & Reels', category: 'Media Challenge', prize: '₹13,500' },
    { name: 'War of Words', category: 'State Debate', prize: '₹13,500' },
    { name: 'Canvas Craft', category: 'Poster Designing', prize: '₹13,500' },
    { name: 'Campus Quest', category: 'Treasure Hunt', prize: '₹13,500' },
  ];

  return (
    <footer className="relative bg-[#000511] text-slate-300 overflow-hidden font-sans border-t border-white/5">
      
      {/* SaaS Ambient Atmospheric Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-gradient-to-b from-orange-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-navy-light/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-600/10 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Precision Glowing Top Horizon Line */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-orange-500/40 via-amber-400/50 to-transparent shadow-[0_0_12px_rgba(255,107,53,0.4)]" />

      {/* SaaS Pre-Footer Action Strip */}
      <div className="border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl">
            
            <div className="space-y-1.5 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                <span>Odisha's Largest +2 Talent Hunt</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Compete for <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent">₹81,000+ Prize Pool</span> & State Glory
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Free registration for Class 12 / +2 2nd Year students across Odisha. Maximum 2 events per student.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
              <button
                onClick={() => handleNavigate('register')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Register for Free</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <a
                href="/Crossfire - 2026 Brochure.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-all"
              >
                <Download className="w-4 h-4 text-orange-400" />
                <span>Official Brochure</span>
              </a>
            </div>

          </div>
        </div>
      </div>

      {/* Main 4-Column Information Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          
          {/* Column 1 (Span 4): Brand & Institutional Heritage */}
          <div className="lg:col-span-4 space-y-5">
            <div className="flex items-center gap-3">
              {/* SAGS Emblem */}
              <div className="h-11 px-2 py-1 rounded-xl bg-white shadow-md flex items-center justify-center border border-white/20">
                <img 
                  src="/sagslogo.png" 
                  alt="SAGS Logo" 
                  className="h-full object-contain" 
                />
              </div>

              {/* Event Logo */}
              <div className="w-11 h-11 rounded-xl bg-white p-1 shadow-md ring-2 ring-orange-500/50 flex items-center justify-center">
                <img 
                  src="/Logo.png" 
                  alt="CrossFire 2026 Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black text-white tracking-wider">
                    CROSS<span className="text-orange-500">FIRE</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-orange-500 text-white">
                    2026
                  </span>
                </div>
                <p className="text-[11px] text-amber-400 font-semibold">
                  State-Level Talent Hunt • Srusti Campus
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              The marquee talent showdown organized by <strong className="text-slate-200">Srusti Academy of Graduate Studies</strong>, empowering +2 Final Year students across Odisha to showcase excellence in academic, artistic, and cultural arenas.
            </p>

            {/* Date & Live Registration Pill */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-xs text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Sunday, Nov 15, 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Registrations Live</span>
              </div>
            </div>

            {/* PDF Downloads */}
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
              <a
                href="/A3 Crossfire -2026 Poster.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Event Poster (A3)</span>
              </a>
              <span>•</span>
              <a
                href="/Crossfire - 2026 Brochure.pdf"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-orange-400" />
                <span>Full Brochure (PDF)</span>
              </a>
            </div>
          </div>

          {/* Column 2 (Span 3): 6 Competitive Tracks */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                <span>6 Competitive Tracks</span>
              </h4>
              <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                ₹13.5k Each
              </span>
            </div>

            <ul className="space-y-1.5 text-xs">
              {eventTracks.map((track, idx) => (
                <li 
                  key={idx}
                  onClick={() => handleNavigate('events')}
                  className="group flex items-center justify-between p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:scale-125 transition-transform shrink-0" />
                    <span className="font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                      {track.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-400/90 group-hover:text-amber-300 shrink-0 ml-2">
                    {track.prize}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleNavigate('events')}
              className="inline-flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors pt-1"
            >
              <span>Explore track guidelines & rules</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Column 3 (Span 3): Venue & Campus Coordinates */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>Campus & Coordinates</span>
            </h4>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2.5 text-xs">
              <div>
                <p className="font-bold text-white">Srusti Academy of Graduate Studies</p>
                <p className="text-[11px] text-amber-400 font-medium">Autonomous Institution</p>
              </div>

              <p className="text-slate-400 leading-relaxed">
                Plot No. 38/1, Chandaka Industrial Estate, Near Infocity, Patia, Bhubaneswar, Odisha 751024
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span>15 mins from Master Canteen & KIIT Sq.</span>
              </div>

              <a 
                href="https://maps.google.com/?q=Srusti+Academy+of+Graduate+Studies+Bhubaneswar" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-between w-full px-3 py-2 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 text-xs font-bold border border-orange-500/20 hover:border-orange-500/40 transition-all"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Eligibility Note */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Eligibility Notice</span>
              </div>
              <p className="text-slate-300 leading-snug">
                Exclusively for <strong className="text-white">+2 2nd Year (Class 12)</strong> students from CBSE, ICSE & CHSE. Valid College ID mandatory.
              </p>
            </div>
          </div>

          {/* Column 4 (Span 2): Official Desk & Quick Channels */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-orange-500" />
              <span>Official Desk</span>
            </h4>

            {/* Single Official Institutional Email Card */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-orange-500" />
                <span>Official Email</span>
              </span>
              
              <div className="flex items-center justify-between gap-1.5">
                <a 
                  href={`mailto:${officialEmail}?subject=CROSSFIRE%202026%20Inquiry`}
                  className="text-xs font-semibold text-slate-200 hover:text-orange-400 transition-colors truncate"
                  title="Send official email"
                >
                  {officialEmail}
                </a>

                <button
                  onClick={handleCopyEmail}
                  className="p-1.5 rounded-md bg-white/5 hover:bg-orange-500/20 text-slate-400 hover:text-orange-400 transition-colors shrink-0 border border-white/10"
                  title="Copy email to clipboard"
                  aria-label="Copy Email"
                >
                  {copiedEmail ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {copiedEmail && (
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Copied to clipboard!</span>
                </p>
              )}
            </div>

            {/* Helpline Numbers */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1 text-xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Coordinator Helplines
              </span>
              <p className="text-slate-200 font-bold">+91 94370 00000</p>
              <p className="text-slate-400 text-[11px]">0674-2744444 (Desk)</p>
            </div>

            {/* Portal Quick Links */}
            <div className="flex flex-col gap-1 text-xs">
              <button
                onClick={() => handleNavigate('leaderboard')}
                className="text-left text-slate-400 hover:text-white transition-colors"
              >
                → Live Scoreboard
              </button>
              <button
                onClick={() => handleNavigate('dashboard')}
                className="text-left text-slate-400 hover:text-white transition-colors"
              >
                → Student Dashboard
              </button>
            </div>

          </div>

        </div>

        {/* Subtle Horizontal Divider */}
        <div className="mt-12 mb-8 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Sublime Bottom Bar: True Inspire Team Signature & Copyright */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 text-xs text-slate-400">
          
          {/* Left: Copyright Notice */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <p>© 2026 True Inspire. All rights reserved.</p>
            <span className="hidden sm:inline text-slate-600">•</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-slate-200 cursor-pointer transition-colors">Terms of Participation</span>
              <span>•</span>
              <span className="hover:text-slate-200 cursor-pointer transition-colors">Safety & POSH</span>
            </div>
          </div>

          {/* Right: Signature "Designed & Developed by TRUE INSPIRE TEAM" Badge */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <div className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/10 hover:border-orange-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(255,107,53,0.08)] hover:shadow-[0_0_20px_rgba(255,107,53,0.2)] transition-all duration-300">
              <span className="text-[11px] text-slate-300">Designed &amp; Developed with</span>
              <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse shrink-0" />
              <span className="text-[11px] text-slate-300">by</span>
              <span className="text-xs font-black tracking-wider bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 bg-clip-text text-transparent uppercase">
                TRUE INSPIRE TEAM
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/5 text-[10px] text-slate-400">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>Verified Portal</span>
            </div>
          </div>

        </div>

      </div>

    </footer>
  );
};
