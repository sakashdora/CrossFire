import React, { useState } from 'react';
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
  Clock,
  Download,
  ChevronDown,
  Award,
  Building2,
  Coffee,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

const StaggeredText = ({ text, className }: { text: string, className?: string }) => {
  const letters = Array.from(text);
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 * i }
    })
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", damping: 12, stiffness: 200 } as any
    },
    hidden: {
      opacity: 0,
      y: 40,
      rotateX: 90,
      transition: { type: "spring", damping: 12, stiffness: 200 } as any
    }
  };

  return (
    <motion.div
      style={{ display: 'inline-flex', overflow: 'visible', perspective: 1000 }}
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ display: 'inline-block' }}
          className="hover:text-cyan-300 hover:drop-shadow-[0_0_15px_rgba(56,189,248,0.8)] transition-all duration-300 cursor-default"
        >
          {letter === " " ? "\u00A0" : letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

interface LandingPageProps {
  onSelectEvent: (event: EventItem) => void;
  setCurrentView: (view: string) => void;
}


const SCHEDULE_ITEMS = [
  {
    time: '09:30 AM – 10:00 AM',
    title: 'Registration & Check-in',
    description: 'Registration verification, badge collection, team kit distribution, and campus reception at Gate 1.',
    icon: Coffee,
    tag: 'Check-In'
  },
  {
    time: '10:00 AM – 10:30 AM',
    title: 'Opening Ceremony',
    description: 'Dignitary addresses, lighting of the CrossFire ceremonial lamp, and briefing on fair play & judging standards.',
    icon: Zap,
    tag: 'Main Stage'
  },
  {
    time: '10:30 AM – 12:00 PM',
    title: 'Quiz (Written Selection & Finals)',
    description: 'Written preliminary test selecting top 6 teams of two, followed by high-voltage campus buzzer finals.',
    icon: Sparkles,
    tag: 'Auditorium A'
  },
  {
    time: '11:30 AM – 12:30 PM',
    title: 'Ramp Walk Event',
    description: 'Solo 2-minute stage showcase celebrating confidence, poise, styling, and charismatic stage presence.',
    icon: Trophy,
    tag: 'Amphitheatre'
  },
  {
    time: '12:30 PM – 01:30 PM',
    title: 'Lunch Break & Refreshments',
    description: 'Complimentary hot buffet lunch for all participants, escorting teachers, and coordinators at Dining Courtyard.',
    icon: Users,
    tag: 'Dining Courtyard'
  },
  {
    time: '01:30 PM – 02:30 PM',
    title: 'Debate Event',
    description: 'Solo live debate on contemporary topics communicated on event morning via WhatsApp / SMS.',
    icon: Sparkles,
    tag: 'Seminar Hall B'
  },
  {
    time: '02:30 PM – 03:00 PM',
    title: 'Reels Screening & Poster Making Judging',
    description: 'Campus-shot reels screening alongside evaluation of physical poster making artworks.',
    icon: Trophy,
    tag: 'Media Lab Block'
  },
  {
    time: '03:00 PM – 04:00 PM',
    title: 'Treasure Hunt Event',
    description: 'Multi-station clue decoding challenge across campus grounds in teams of 3 students.',
    icon: Sparkles,
    tag: 'Central Quad'
  },
  {
    time: '04:00 PM – 05:00 PM',
    title: 'Valedictory & ₹50,000 Prize Distribution',
    description: 'Awarding cash prizes, championship trophies, medals, and merit certificates with media coverage.',
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
    a: 'The total cash prize pool is ₹50,000 distributed across 6 events: Quiz has a ₹24,500 prize pool (1st: ₹6,000, 2nd: ₹4,000, 3rd: ₹3,500, plus ₹1,500 each for 4th, 5th, and 6th positions). Ramp Walk and Reels feature ₹9,000 each (1st: ₹3,000, 2nd: ₹2,000, 3rd: ₹1,000). Debate and Poster Making feature ₹7,000 each (1st: ₹4,000, 2nd: ₹2,000, 3rd: ₹1,000), and Treasure Hunt features ₹8,000 (1st: ₹3,000, 2nd: ₹2,000, 3rd: ₹1,000). Winners also receive championship trophies and state certificates.'
  },
  {
    q: 'Can students from the same college form a team?',
    a: 'Yes! For team events (Quiz with a team of 2, and Treasure Hunt with a team of 3), team members should belong to the same institution. You can register your team members during registration or report together at the campus.'
  },
  {
    q: 'Will all participants receive official certificates?',
    a: 'Yes, every registered student who participates in the event receives an Official Certificate of State Participation from Srusti Academy of Graduate Studies, recognized for academic portfolios.'
  }
];


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
      <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-[#000d1a] group">
        
        {/* Exclusive Dynamic Blue Fire Particles Background */}
        <HeroParticlesBackground className="opacity-100" />

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
          <div className="space-y-2 mb-4 perspective-1000">
            <motion.p
              initial={{ opacity: 0, letterSpacing: '0em' }}
              animate={{ opacity: 1, letterSpacing: '0.3em' }}
              transition={{ delay: 0.1, duration: 1 }}
              className="text-slate-300 text-xs sm:text-sm font-bold uppercase"
            >
              Ignite Your Talent At
            </motion.p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] uppercase flex items-center justify-center flex-wrap">
              <StaggeredText text="CROSS" className="text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.8)]" />
              <StaggeredText text="FIRE" className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(0,98,255,0.7)] ml-2" />
              <motion.span 
                initial={{ opacity: 0, scale: 0.5, rotateX: 90 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                transition={{ type: "spring", damping: 10, stiffness: 100, delay: 1 }}
                className="inline-block ml-2 sm:ml-4 px-3 py-0.5 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-cyan-300 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black align-middle shadow-[0_0_20px_rgba(56,189,248,0.2)]"
              >
                2026
              </motion.span>
            </h1>
          </div>

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
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('register')}
              className="relative overflow-hidden w-full sm:w-auto h-13 px-8 sm:px-10 rounded-2xl bg-[#0062FF] text-white font-black text-sm shadow-[0_0_40px_rgba(0,98,255,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer group border border-blue-400/50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 flex items-center gap-2">
                Register Free in 60s
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto h-13 px-8 sm:px-10 rounded-2xl bg-white/5 hover:bg-white/10 backdrop-blur-md text-white font-bold text-sm border border-white/20 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All 6 Tracks</span>
            </motion.button>

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

      {/* Remaining Page Sections */}
      <div className="space-y-10 sm:space-y-16 pt-4 sm:pt-6">


      {/* ─── 2. KPI METRIC POWER CARDS (Clean Pure White + Deep Navy) ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            { 
              icon: <Trophy className="w-6 h-6 text-[#0062FF]" />, 
              value: '₹50,000', 
              label: 'Total Cash Pool',
              sub: 'Cash Awards + Trophies'
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
              Compete in up to <strong>2 competitive tracks</strong>. Total cash pool of <strong>₹50,000</strong> plus institutional trophies, cash awards, and certified merit honors.
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
                    <span className="text-[#0062FF] font-extrabold">₹{event.prize_pool.toLocaleString('en-IN')} Pool</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    <div className="p-2 rounded-lg bg-blue-100 border border-blue-200 text-[#001F3F]">
                      <span className="text-[9px] block text-slate-500 font-semibold">1st Place</span>
                      ₹{event.prize_distribution['1st']?.toLocaleString('en-IN')}
                    </div>
                    <div className="p-2 rounded-lg bg-sky-100/70 border border-sky-200 text-[#003D7A]">
                      <span className="text-[9px] block text-slate-500 font-semibold">2nd Place</span>
                      ₹{event.prize_distribution['2nd']?.toLocaleString('en-IN')}
                    </div>
                    <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-sm">
                      <span className="text-[9px] block text-slate-500 font-semibold">3rd Place</span>
                      ₹{event.prize_distribution['3rd']?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {event.prize_distribution['4th'] && (
                    <div className="text-[10px] text-center font-bold text-blue-700 bg-blue-100/60 rounded-md py-1 px-2 border border-blue-200/60">
                      + 4th, 5th, 6th Runner-ups: ₹1,500 each
                    </div>
                  )}
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
                  title: '₹50,000 Cash & Trophies',
                  desc: 'Substantial cash awards across all 6 tracks with bespoke institutional trophies and accredited merit certificates.'
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
