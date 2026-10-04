import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountdownTimer } from '../components/CountdownTimer';
import { HeroParticlesBackground } from '../components/HeroParticlesBackground';
import { EventItem } from '../types';
import { useEvents } from '../context/EventsContext';
import {
  Trophy,
  Sparkles,
  Users,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Brain,
  Video,
  MessageSquareQuote,
  Palette,
  Compass,
  CalendarDays,
  Megaphone,
  Clock,
  Download,
  ChevronDown,
  Award,
  Building2,
  Coffee,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onSelectEvent: (event: EventItem) => void;
  setCurrentView: (view: string) => void;
}

const TICKER_ITEMS = [
  '🏆 Registration is now OPEN for CrossFire 2026 — Zero entry fee for all +2 students',
  '💰 Grand Prize Pool of ₹81,000+ with ₹13,500 cash per track + trophies & merit certificates',
  '🎯 Maximum 2 events per student — Choose across Academic, Cultural, Media & Arts arenas',
  '📍 Venue: Srusti Academy of Graduate Studies, Chandaka Industrial Estate, Patia, Bhubaneswar',
  '✅ Exclusively for Class 12 / +2 2nd Year students from CBSE, ICSE & CHSE councils',
  '⚡ Free welcome breakfast & refreshments provided for all registered participants',
  '📊 Live real-time scoring and leaderboard broadcast on campus arena screens',
];

const SCHEDULE_ITEMS = [
  {
    time: '08:30 AM – 09:30 AM',
    title: 'Contingent Reporting & Welcome Breakfast',
    description: 'Registration verification, badge collection, team kit distribution, and complimentary campus breakfast.',
    icon: Coffee,
    tag: 'Check-In'
  },
  {
    time: '09:30 AM – 10:15 AM',
    title: 'Grand Inauguration & Opening Ceremony',
    description: 'Dignitary addresses, lighting of the Crossfire flame, and briefing on fair play & judging standards.',
    icon: Zap,
    tag: 'Main Stage'
  },
  {
    time: '10:30 AM – 01:30 PM',
    title: 'Track Battles & Preliminary Rounds',
    description: 'Brain Buzz (Quiz), War of Words (Debate), Canvas Craft, Shorts/Reels & Campus Quest preliminary heats.',
    icon: Sparkles,
    tag: 'Multi-Arena'
  },
  {
    time: '01:30 PM – 02:30 PM',
    title: 'Networking Lunch & Media Showcase',
    description: 'Complimentary buffet lunch for all participants with student DJ sets and finalist reel screenings.',
    icon: Users,
    tag: 'Campus Arena'
  },
  {
    time: '02:30 PM – 04:00 PM',
    title: 'Glam Walk & Grand Stage Finals',
    description: 'High-octane Ramp Walk finals, final debate face-off, and live countdown scoring reveal.',
    icon: Trophy,
    tag: 'Amphitheatre'
  },
  {
    time: '04:00 PM – 05:00 PM',
    title: 'Valedictory & ₹81,000+ Prize Distribution',
    description: 'Awarding cash prizes, championship trophies, medals, and institutional merit certificates.',
    icon: Award,
    tag: 'Awards Gala'
  },
];

const TOP_COLLEGES = [
  'DAV Public School (CSPUR & Unit-8)',
  'DPS Kalinga',
  'BJB Autonomous College',
  'Ravenshaw Higher Secondary School',
  'KIIT International School',
  'Mothers Public School',
  'SAI International School',
  'Kendriya Vidyalaya (Bhubaneswar & Cuttack)',
  'Rama Devi Women’s Higher Secondary School',
  'BJEM School',
  'St. Xavier’s High School',
  'Stewart School',
];

const FAQS = [
  {
    q: 'Who is eligible to participate in CROSSFIRE 2026?',
    a: 'Participation is exclusively open to +2 2nd Year (Class 12) students from CBSE, ICSE, and CHSE councils across Odisha. A valid School/College ID or authorization letter is mandatory at reporting time.'
  },
  {
    q: 'How many events can a single student participate in?',
    a: 'Each student can register for a maximum of 2 competitive events. This ensures optimal schedule management without overlapping event slots.'
  },
  {
    q: 'Is there any registration or entry fee?',
    a: 'No! Registration for CROSSFIRE 2026 is 100% Free. In addition, complimentary welcome breakfast, refreshments, and lunch are provided to all registered participants.'
  },
  {
    q: 'What is the cash prize structure for each track?',
    a: 'Each of the 6 competitive tracks features a total prize pool of ₹13,500: 1st Place wins ₹7,000 Cash + Trophy + Certificate; 2nd Place wins ₹4,000 Cash + Medal + Certificate; 3rd Place wins ₹2,500 Cash + Medal + Certificate.'
  },
  {
    q: 'Can students from the same college form a team?',
    a: 'Yes! For team events (like Brain Buzz Quiz and Campus Quest), all team members should belong to the same institution. You can designate your team name during the registration process.'
  },
  {
    q: 'Will all participants receive official certificates?',
    a: 'Yes, every registered student who participates in the event receives an Official Certificate of State Participation from Srusti Academy of Graduate Studies, recognized for academic portfolios.'
  }
];

const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const stars: { x: number; y: number; r: number; alpha: number; speed: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 160; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.005 + 0.002,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) star.speed = -star.speed;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 220, 255, ${Math.min(1, Math.max(0, star.alpha))})`;
        ctx.fill();
      });
      animationId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.65 }}
    />
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectEvent,
  setCurrentView,
}) => {
  const { events } = useEvents();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-5 h-5 text-white" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-white" />;
      case 'Video': return <Video className="w-5 h-5 text-white" />;
      case 'MessageSquareQuote': return <MessageSquareQuote className="w-5 h-5 text-white" />;
      case 'Palette': return <Palette className="w-5 h-5 text-white" />;
      case 'Compass': return <Compass className="w-5 h-5 text-white" />;
      default: return <Trophy className="w-5 h-5 text-white" />;
    }
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-800 font-sans">

      {/* ─── 1. HERO ARENA SECTION (Deep Srusti Navy + Pure White + Cyan Shimmer) ─── */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-[#001F3F]">
        
        {/* Ambient Cyan / Royal Blue Radial Shaders */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] sm:w-[900px] h-[450px] bg-blue-500/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 -left-32 w-[350px] h-[350px] bg-sky-500/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-[350px] h-[350px] bg-cyan-400/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Dynamic Starfield Canvas */}
        <StarField />

        {/* Central Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-16 sm:pt-20 md:pt-24 pb-12 max-w-5xl mx-auto w-full">
          
          {/* Dual Institutional Emblem Badges */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-3 sm:gap-4 mb-6"
          >
            {/* Srusti SAGS College Emblem */}
            <div className="h-14 sm:h-16 px-3 py-1 rounded-2xl bg-white shadow-2xl shadow-black/40 border border-white/40 flex items-center justify-center hover:scale-105 transition-transform">
              <img
                src="/sagslogo.png"
                alt="Srusti Academy of Graduate Studies"
                className="h-full object-contain"
              />
            </div>

            <div className="flex flex-col items-center px-0.5">
              <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
              <span className="text-cyan-300 text-xs font-black uppercase my-0.5">✕</span>
              <div className="w-px h-5 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
            </div>

            {/* CrossFire Logo */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 shadow-2xl shadow-blue-500/30 border border-blue-400/50 flex items-center justify-center hover:scale-105 transition-transform">
              <img
                src="/Logo.png"
                alt="CrossFire 2026"
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>

          {/* Live Status Pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/40 bg-blue-500/20 mb-4 shadow-[0_0_20px_rgba(56,189,248,0.2)]"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <span className="text-cyan-200 text-xs font-black uppercase tracking-wider">
              State-Level Talent Championship • Srusti Campus
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="space-y-2 mb-4"
          >
            <p className="text-slate-300 text-xs sm:text-sm font-bold tracking-[0.3em] uppercase">
              Ignite Your Talent At
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] uppercase">
              <span className="text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]">CROSS</span>
              <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,98,255,0.7)]">
                FIRE
              </span>
              <span className="inline-block ml-2 sm:ml-3 px-3 py-0.5 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-cyan-300 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black align-middle shadow-inner">
                2026
              </span>
            </h1>
          </motion.div>

          {/* Date & Location Pill Strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2.5 text-white/90 text-xs sm:text-sm font-semibold mb-6"
          >
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
              <CalendarDays className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Sunday, November 15, 2026</span>
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5 bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Srusti Academy, Patia, Bhubaneswar</span>
            </span>
          </motion.div>

          {/* Dynamic Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-6"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-slate-300 mb-3">
              Championship Starts In
            </p>
            <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
          </motion.div>

          {/* Primary Action Buttons (Electric Cobalt + Frost Glass) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 w-full max-w-md sm:max-w-none"
          >
            <button
              onClick={() => setCurrentView('register')}
              className="w-full sm:w-auto h-13 px-8 sm:px-10 rounded-2xl bg-[#0062FF] hover:bg-blue-600 text-white font-black text-sm shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Register Free in 60s</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto h-13 px-8 sm:px-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/25 hover:border-cyan-300/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All 6 Tracks</span>
            </button>

            <a
              href="/Crossfire - 2026 Brochure.pdf"
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto h-13 px-6 rounded-2xl bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white font-semibold text-xs border border-white/15 hover:border-white/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Brochure (PDF)</span>
            </a>
          </motion.div>

          {/* Trust & Eligibility Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto"
          >
            {[
              '+2 2nd Year (Class 12) Only',
              'CBSE / ICSE / CHSE',
              'Max 2 Events / Student',
              '100% Free Entry & Refreshments'
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-200 bg-blue-500/20 border border-blue-400/30 px-3 py-1 rounded-full backdrop-blur-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span>{item}</span>
              </span>
            ))}
          </motion.div>

        </div>
      </section>

        {/* Live News Broadcast Ticker */}
        <div className="relative z-10 w-full border-t border-white/15 bg-[#00142A]/95 backdrop-blur-md overflow-hidden">
          <div className="flex items-stretch h-11 sm:h-12">
            <div className="shrink-0 flex items-center gap-2 px-4 sm:px-5 bg-[#0062FF] text-white font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-md">
              <Megaphone className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span>LATEST UPDATES</span>
            </div>
            <div className="overflow-hidden flex-1 flex items-center">
              <div
                className="flex whitespace-nowrap"
                style={{ animation: 'ticker 50s linear infinite' }}
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span
                    key={i}
                    className="inline-block text-slate-200 text-xs font-semibold py-2 px-6 sm:px-8 border-r border-white/15 last:border-0 hover:text-white transition-colors cursor-default"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => setTickerMinimized(true)}
              className="px-3 text-white/40 hover:text-white flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              title="Minimize announcements ticker"
              aria-label="Minimize ticker"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      <style>{`
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Remaining Page Sections */}
      <div className="space-y-10 sm:space-y-16 pt-4 sm:pt-6">


      {/* ─── 2. KPI METRIC POWER CARDS (Clean Pure White + Deep Navy) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              icon: <Trophy className="w-6 h-6 text-[#0062FF]" />, 
              value: '₹81,000+', 
              label: 'Total Cash Pool',
              sub: '₹13.5k Per Track + Trophies'
            },
            { 
              icon: <Zap className="w-6 h-6 text-[#0284C7]" />, 
              value: '6 Battlegrounds', 
              label: 'Championship Tracks',
              sub: 'Solo & Team Categories'
            },
            { 
              icon: <Building2 className="w-6 h-6 text-[#0062FF]" />, 
              value: '50+ Colleges', 
              label: 'Participating Schools',
              sub: 'Across Odisha Districts'
            },
            { 
              icon: <ShieldCheck className="w-6 h-6 text-[#0284C7]" />, 
              value: '100% Free', 
              label: 'Zero Registration Fee',
              sub: 'Free Lunch & Certificates'
            },
          ].map(({ icon, value, label, sub }) => (
            <div
              key={label}
              className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,31,63,0.06)] hover:shadow-[0_16px_35px_rgba(0,31,63,0.12)] hover:border-blue-300 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3.5 shadow-sm">
                {icon}
              </div>
              <span className="text-2xl sm:text-3xl font-black text-[#001F3F] block leading-tight">
                {value}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-800 block mt-1">
                {label}
              </span>
              <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                {sub}
              </span>
            </div>
          ))}
        </div>
      </section>


      {/* ─── 3. THE 6 CHAMPIONSHIP BATTLEGROUND TRACKS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0062FF] text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#0062FF]" />
              <span>Championship Arena</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#001F3F] tracking-tight">
              Choose Your <span className="text-[#0062FF]">Battleground</span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Compete in up to <strong>2 competitive tracks</strong>. Each track awards ₹13,500 cash, institutional trophies, and certified merit honors.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('events')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#001F3F] hover:bg-blue-900 text-white text-xs font-bold shadow-md transition-all self-start md:self-auto"
          >
            <span>View All Rules & Rubrics</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="group relative flex flex-col justify-between p-6 sm:p-7 rounded-2xl bg-white border border-slate-200/90 shadow-[0_8px_30px_rgba(0,31,63,0.06)] hover:shadow-[0_16px_35px_rgba(0,98,255,0.12)] hover:border-blue-400 transition-all duration-300"
            >
              <div>
                {/* Top Row: Icon & Solo/Team Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#001F3F] to-[#0062FF] flex items-center justify-center shadow-md shadow-blue-600/25 group-hover:scale-105 transition-transform">
                    {getEventIcon(event.event_icon)}
                  </div>
                  
                  <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-[#0062FF]" />
                    {event.event_type === 'solo' ? 'Solo Event' : `Team of ${event.team_size}`}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="text-lg sm:text-xl font-black text-[#001F3F] group-hover:text-[#0062FF] transition-colors mb-2">
                  {event.name}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed min-h-[38px] line-clamp-2 mb-5">
                  {event.description}
                </p>

                {/* Prize Breakdown Card */}
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 space-y-2 mb-5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <span>Prize Distribution</span>
                    <span className="text-[#0062FF] font-extrabold">₹13,500 Pool</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    <div className="p-2 rounded-lg bg-blue-100 border border-blue-200 text-[#001F3F]">
                      <span className="text-[9px] block text-slate-500 font-semibold">1st Place</span>
                      ₹{event.prize_distribution['1st']}
                    </div>
                    <div className="p-2 rounded-lg bg-sky-100/70 border border-sky-200 text-[#003D7A]">
                      <span className="text-[9px] block text-slate-500 font-semibold">2nd Place</span>
                      ₹{event.prize_distribution['2nd']}
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
                      <span className="text-[9px] block text-slate-500 font-semibold">3rd Place</span>
                      ₹{event.prize_distribution['3rd']}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#0062FF] shrink-0" />
                  {event.venue_location}
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectEvent(event)}
                    className="h-9 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 hover:text-[#001F3F] transition-colors"
                  >
                    Rules
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="h-9 px-4 rounded-xl bg-[#0062FF] hover:bg-blue-600 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1"
                  >
                    <span>Join</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </section>


      {/* ─── 4. EVENT DAY SCHEDULE TIMELINE (Sunday, Nov 15, 2026) ─── */}
      <section className="bg-slate-100/80 py-16 sm:py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0062FF] text-xs font-bold uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-[#0062FF]" />
              <span>Event Roadmap</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight">
              Sunday, <span className="text-[#0062FF]">November 15, 2026</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              A full-day power-packed championship itinerary at Srusti Academy Campus.
            </p>
          </div>

          {/* Timeline Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SCHEDULE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 space-y-3 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0062FF] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {item.tag}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#0062FF] font-mono">
                    {item.time}
                  </div>

                  <h3 className="text-base font-bold text-[#001F3F] group-hover:text-[#0062FF] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>


      {/* ─── 5. WHY COMPETE AT CROSSFIRE (Flagship Navy Heroic Card) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-[#001F3F] via-[#00162E] to-[#000F24] text-white p-8 sm:p-12 relative overflow-hidden shadow-2xl">
          
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-cyan-300 text-xs font-black uppercase tracking-widest inline-block">
              Organized by Srusti Academy of Graduate Studies
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Why State-Level Champions Compete at CrossFire
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Designed as Odisha's gold-standard +2 talent hunt, CrossFire offers more than just competition—it is a platform for recognition, networking, and academic prestige.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 pt-2">
              {[
                {
                  icon: <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />,
                  title: 'State-Wide Peer Network',
                  desc: 'Compete alongside the brightest +2 minds and creators from 50+ leading schools across Odisha.'
                },
                {
                  icon: <Trophy className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />,
                  title: '₹81,000+ Cash & Trophies',
                  desc: 'Substantial cash prizes with bespoke institutional trophies and accredited participation certificates.'
                },
                {
                  icon: <Zap className="w-5 h-5 text-cyan-300 shrink-0 mt-0.5" />,
                  title: 'Live Real-time Scoring',
                  desc: 'Transparent rubric evaluation by certified expert judges, broadcasted live on arena screens.'
                },
                {
                  icon: <Building2 className="w-5 h-5 text-sky-300 shrink-0 mt-0.5" />,
                  title: 'Campus Life & Media Experience',
                  desc: 'Experience Srusti’s high-tech air-conditioned amphitheatre, studio media labs, and lush campus.'
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                >
                  {icon}
                  <div>
                    <strong className="text-white block font-bold mb-1">{title}</strong>
                    <span className="text-slate-300">{desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto h-12 px-7 rounded-xl bg-[#0062FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Register for CrossFire 2026</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="w-full sm:w-auto h-12 px-7 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <span>Check Live Standings</span>
              </button>
            </div>
          </div>

        </div>
      </section>


      {/* ─── 6. PARTICIPATING INSTITUTIONS HALL OF FAME ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0062FF] text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-[#0062FF]" />
            <span>State Contingents</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#001F3F] tracking-tight">
            Leading +2 Colleges in the Arena
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Top junior colleges and higher secondary schools fielding student contingents.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {TOP_COLLEGES.map((college, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 text-xs font-semibold text-slate-700 hover:text-[#001F3F] transition-all flex items-center gap-2.5 group"
            >
              <span className="w-2 h-2 rounded-full bg-[#0062FF] group-hover:scale-125 transition-transform shrink-0" />
              <span className="truncate">{college}</span>
            </div>
          ))}
        </div>
      </section>


      {/* ─── 7. FREQUENTLY ASKED QUESTIONS (Accordion) ─── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200">
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0062FF] text-xs font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#0062FF]" />
            <span>Got Questions?</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#001F3F] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Everything you need to know about participation, eligibility, and rules.
          </p>
        </div>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#001F3F] hover:text-[#0062FF] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#0062FF] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-4 sm:px-5 pb-4 sm:pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3.5"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>


      {/* ─── 8. FINAL HIGH-CONVERSION BANNER (Deep Navy to Royal Blue Gradient) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#001F3F] via-[#003366] to-[#0062FF] p-8 sm:p-12 text-center text-white overflow-hidden shadow-2xl">
          
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
              Ready to Claim State Glory?
            </h2>
            <p className="text-xs sm:text-sm text-sky-100 leading-relaxed font-medium">
              Join hundreds of top +2 students across Odisha. Free registration takes less than 60 seconds.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => setCurrentView('register')}
                className="px-8 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-[#001F3F] font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Register Now for Free
              </button>

              <button
                onClick={() => setCurrentView('events')}
                className="px-6 py-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs border border-white/30 transition-all"
              >
                View Track Details
              </button>
            </div>
          </div>

        </div>
      </section>
    </div>
  </div>
);
};
