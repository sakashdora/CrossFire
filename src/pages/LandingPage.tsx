import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  GraduationCap,
  Search,
  Flame,
  School,
  FileText,
  Ticket,
  Image as ImageIcon
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

interface StateInstitution {
  name: string;
  shortCode: string;
  city: string;
  board: 'CBSE' | 'CHSE' | 'ICSE';
  tag: string;
  color: string;
  badgeBg: string;
}

const STATE_INSTITUTIONS: StateInstitution[] = [
  {
    name: 'DAV Public School (CSPUR & Unit-8)',
    shortCode: 'DAV',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Top Contender',
    color: 'from-blue-600 to-indigo-600',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200'
  },
  {
    name: 'BJB Autonomous College',
    shortCode: 'BJB',
    city: 'Bhubaneswar',
    board: 'CHSE',
    tag: 'Defending Champs',
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200'
  },
  {
    name: 'DPS Kalinga',
    shortCode: 'DPS',
    city: 'Cuttack',
    board: 'CBSE',
    tag: 'Powerhouse',
    color: 'from-emerald-500 to-teal-700',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  },
  {
    name: 'Ravenshaw Higher Secondary School',
    shortCode: 'RHSS',
    city: 'Cuttack',
    board: 'CHSE',
    tag: 'Legacy Giant',
    color: 'from-purple-600 to-indigo-800',
    badgeBg: 'bg-purple-500/10 text-purple-600 border-purple-200'
  },
  {
    name: 'SAI International School',
    shortCode: 'SAI',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Elite Squad',
    color: 'from-sky-500 to-blue-700',
    badgeBg: 'bg-sky-500/10 text-sky-600 border-sky-200'
  },
  {
    name: 'KIIT International School',
    shortCode: 'KIIT',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Verified Delegation',
    color: 'from-rose-500 to-red-700',
    badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-200'
  },
  {
    name: 'Mothers Public School',
    shortCode: 'MPS',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Power Delegation',
    color: 'from-cyan-500 to-blue-600',
    badgeBg: 'bg-cyan-500/10 text-cyan-600 border-cyan-200'
  },
  {
    name: 'Rama Devi Women’s HS School',
    shortCode: 'RD',
    city: 'Bhubaneswar',
    board: 'CHSE',
    tag: 'Top Contender',
    color: 'from-fuchsia-500 to-pink-700',
    badgeBg: 'bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-200'
  },
  {
    name: 'Kendriya Vidyalaya No. 1',
    shortCode: 'KV-1',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Verified Delegation',
    color: 'from-blue-500 to-cyan-600',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-200'
  },
  {
    name: 'BJEM School',
    shortCode: 'BJEM',
    city: 'Bhubaneswar',
    board: 'CBSE',
    tag: 'Verified Squad',
    color: 'from-emerald-600 to-teal-800',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-200'
  },
  {
    name: 'St. Xavier’s High School',
    shortCode: 'STX',
    city: 'Bhubaneswar',
    board: 'ICSE',
    tag: 'Challenger',
    color: 'from-amber-600 to-yellow-700',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-200'
  },
  {
    name: 'Stewart School',
    shortCode: 'STW',
    city: 'Cuttack',
    board: 'ICSE',
    tag: 'Legacy Squad',
    color: 'from-violet-600 to-purple-800',
    badgeBg: 'bg-violet-500/10 text-violet-600 border-violet-200'
  },
  {
    name: 'Loyola School',
    shortCode: 'LOY',
    city: 'Bhubaneswar',
    board: 'ICSE',
    tag: 'Elite Delegation',
    color: 'from-sky-600 to-indigo-700',
    badgeBg: 'bg-sky-500/10 text-sky-600 border-sky-200'
  },
  {
    name: 'Prananath Autonomous College',
    shortCode: 'PN',
    city: 'Khordha',
    board: 'CHSE',
    tag: 'Regional Power',
    color: 'from-teal-500 to-emerald-700',
    badgeBg: 'bg-teal-500/10 text-teal-600 border-teal-200'
  }
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
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<'ALL' | 'CBSE' | 'CHSE' | 'ICSE'>('ALL');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowFloatingCta(window.scrollY > 450);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          
          {/* Dual Institutional Emblem Badges: CrossFire Center & Enlarged, College Logo on Right Side */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center gap-4 sm:gap-6 mb-6 flex-wrap"
          >
            {/* CrossFire Logo (Center & Prominent Large Size) */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl bg-white p-2 sm:p-2.5 shadow-[0_0_45px_rgba(0,132,255,0.55)] border-2 border-cyan-400 flex items-center justify-center hover:scale-105 transition-all duration-300">
                <img
                  src="/Logo.png"
                  alt="CrossFire 2026"
                  className="w-full h-full object-contain filter drop-shadow"
                />
              </div>
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[10px] sm:text-xs font-black uppercase rounded-full shadow-md tracking-wider border border-white/30 whitespace-nowrap">
                CROSSFIRE 2026
              </span>
            </div>

            {/* Connecting Subtle Divider */}
            <div className="hidden sm:flex flex-col items-center px-1">
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent" />
            </div>

            {/* Srusti SAGS College Emblem (Right Side with 'Organized by SAGS' label) */}
            <div className="flex flex-col items-center sm:items-start text-left">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-cyan-300 font-extrabold mb-1">
                Organized by SAGS
              </span>
              <div className="h-14 sm:h-16 px-4 py-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl shadow-black/50 border border-white/50 flex items-center justify-center hover:scale-105 transition-transform">
                <img
                  src="/sagslogo.png"
                  alt="Srusti Academy of Graduate Studies"
                  className="h-full object-contain max-h-12"
                />
              </div>
            </div>
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
              <span>Srusti Academy of Management and Technology</span>
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

          {/* Primary Action Buttons (Electric Cobalt + Frost Glass + Interactive Downloads) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-7 w-full max-w-md sm:max-w-none relative z-30"
          >
            {/* Primary Action: Register Free (Enlarged, no 60s) */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCurrentView('register')}
              className="relative overflow-hidden w-full sm:w-auto h-15 sm:h-16 px-10 sm:px-12 rounded-2xl bg-gradient-to-r from-[#0062FF] via-[#0084FF] to-[#00D4FF] text-white font-black text-base sm:text-lg shadow-[0_0_40px_rgba(0,132,255,0.55)] hover:shadow-[0_0_55px_rgba(0,212,255,0.7)] transition-all flex items-center justify-center gap-3 cursor-pointer group border-2 border-cyan-300/50"
            >
              <span className="relative z-10 flex items-center gap-2.5 tracking-wide">
                Register Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </motion.button>

            {/* Secondary Action: Explore Tracks */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto h-13 px-7 sm:px-8 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] backdrop-blur-xl text-white font-bold text-sm border border-white/20 hover:border-cyan-400/60 hover:shadow-[0_0_25px_rgba(56,189,248,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-300" />
              <span>Explore All 6 Tracks</span>
            </motion.button>

            {/* Tertiary Action: Official Downloads (Brochure & Poster) */}
            <div className="relative w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className={`w-full sm:w-auto h-13 px-6 rounded-2xl backdrop-blur-xl font-bold text-xs border transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  showDownloadMenu
                    ? 'bg-blue-600/30 text-white border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.3)]'
                    : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 hover:text-white border-white/15 hover:border-cyan-400/40'
                }`}
              >
                <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Brochure & Media (PDF)</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDownloadMenu ? 'rotate-180 text-cyan-300' : ''}`} />
              </motion.button>

              {/* Floating Download Popover Menu */}
              <AnimatePresence>
                {showDownloadMenu && (
                  <>
                    {/* Backdrop Click Dismiss */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowDownloadMenu(false)}
                    />

                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 w-72 sm:w-80 p-2.5 rounded-2xl bg-[#001428]/95 border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl z-50 text-left space-y-1.5"
                    >
                      <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Official Downloads</p>
                        <p className="text-[11px] text-slate-400">Direct event files & guidelines</p>
                      </div>

                      {/* 1. Official Brochure */}
                      <a
                        href="/Crossfire-2026-Brochure.pdf"
                        download="Crossfire-2026-Brochure.pdf"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setShowDownloadMenu(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0 group-hover:bg-[#0062FF] transition-colors">
                          <FileText className="w-4 h-4 text-cyan-300 group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">Championship Brochure</span>
                            <span className="text-[10px] font-semibold text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">7.4 MB</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">Schedule, rules & cash prize breakdown</span>
                        </div>
                      </a>

                      {/* 2. Official Poster */}
                      <a
                        href="/A3-Crossfire-2026-Poster.pdf"
                        download="A3-Crossfire-2026-Poster.pdf"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setShowDownloadMenu(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600 transition-colors">
                          <ImageIcon className="w-4 h-4 text-purple-300 group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">A3 Event Wall Poster</span>
                            <span className="text-[10px] font-semibold text-purple-400/80 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">8.0 MB</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">High-definition campus poster</span>
                        </div>
                      </a>

                      {/* 3. Meal Coupon Format */}
                      <a
                        href="/Crossfire-coupon.pdf"
                        download="Crossfire-coupon.pdf"
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => setShowDownloadMenu(false)}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                          <Ticket className="w-4 h-4 text-emerald-300 group-hover:text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold truncate">Pass & Meal Voucher</span>
                            <span className="text-[10px] font-semibold text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">1.3 MB</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block truncate">Official gate pass & food coupon spec</span>
                        </div>
                      </a>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Trust & Eligibility Badges (Cyber Frost Aesthetic) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto"
          >
            {[
              { label: '+2 2nd Year (Class 12) Only', icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-300" /> },
              { label: 'CBSE / ICSE / CHSE', icon: <Building2 className="w-3.5 h-3.5 text-sky-300" /> },
              { label: 'Max 2 Events / Student', icon: <Zap className="w-3.5 h-3.5 text-amber-300" /> },
              { label: '100% Free Entry & Refreshments', icon: <Coffee className="w-3.5 h-3.5 text-emerald-300" /> },
            ].map(({ label, icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-xs font-bold text-cyan-100 bg-[#001b33]/80 hover:bg-[#002647] border border-cyan-500/30 hover:border-cyan-400/60 px-3.5 py-1.5 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(56,189,248,0.12)] hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all cursor-default"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {icon}
                <span>{label}</span>
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


      {/* ─── 6. PARTICIPATING INSTITUTIONS & ARENA CONTINGENTS ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 overflow-hidden">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-[#0062FF] text-xs font-bold uppercase tracking-wider shadow-sm">
            <GraduationCap className="w-4 h-4 text-[#0062FF]" />
            <span>Statewide Collegiate Arena</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[#001F3F] tracking-tight">
            Odisha's Top Junior Colleges & Schools
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
            Delegations from 45+ premier institutions across Bhubaneswar, Cuttack, and beyond clash for the ₹50,000 championship pool and institutional glory.
          </p>

          {/* Quick Metrics Strip */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Building2 className="w-3.5 h-3.5 text-[#0062FF]" />
              45+ Registered Hubs
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-cyan-600" />
              1,000+ Aspirants
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              ₹50,000 Cash Pool
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              CBSE • CHSE • ICSE
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="max-w-3xl mx-auto mb-8 flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={institutionSearch}
              onChange={(e) => setInstitutionSearch(e.target.value)}
              placeholder="Search your school or college..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:border-[#0062FF] focus:ring-2 focus:ring-blue-100 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none transition-all shadow-sm"
            />
            {institutionSearch && (
              <button
                onClick={() => setInstitutionSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Board Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto justify-center">
            {(['ALL', 'CBSE', 'CHSE', 'ICSE'] as const).map((board) => (
              <button
                key={board}
                onClick={() => setSelectedBoardFilter(board)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedBoardFilter === board
                    ? 'bg-white text-[#0062FF] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {board === 'ALL' ? 'All Boards' : board}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Display: Filtered Results OR Infinite Dual Marquee */}
        {institutionSearch.trim() !== '' || selectedBoardFilter !== 'ALL' ? (
          /* Filtered Grid View */
          <div className="space-y-4">
            {(() => {
              const filtered = STATE_INSTITUTIONS.filter(inst => {
                const matchesSearch = inst.name.toLowerCase().includes(institutionSearch.toLowerCase()) ||
                  inst.city.toLowerCase().includes(institutionSearch.toLowerCase()) ||
                  inst.shortCode.toLowerCase().includes(institutionSearch.toLowerCase());
                const matchesBoard = selectedBoardFilter === 'ALL' || inst.board === selectedBoardFilter;
                return matchesSearch && matchesBoard;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 px-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                    <School className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-800">No listed institution found for "{institutionSearch}"</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Any recognized +2 institution in Odisha is eligible! Be the first to field a delegation from your institution.
                    </p>
                    <button
                      onClick={() => setCurrentView('register')}
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#0062FF] text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20"
                    >
                      <span>Register Your College Delegation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filtered.map((inst, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${inst.color} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                          {inst.shortCode}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#001F3F] truncate group-hover:text-[#0062FF] transition-colors">
                            {inst.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-medium">
                              {inst.city}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${inst.badgeBg}`}>
                              {inst.board}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setCurrentView('register')}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-[#0062FF] text-[#0062FF] hover:text-white text-[11px] font-bold transition-all shrink-0 flex items-center gap-1"
                        title="Register with this college"
                      >
                        <span>Join</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        ) : (
          /* Dual-Row Smooth Marquee */
          <div className="space-y-3.5 relative">
            {/* Fade edge overlays for high aesthetic finish */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#F8FAFC] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#F8FAFC] to-transparent z-10" />

            {/* Row 1: Sliding Left */}
            <div className="overflow-hidden py-1">
              <div className="animate-marquee-left flex gap-3.5">
                {[...STATE_INSTITUTIONS.slice(0, 7), ...STATE_INSTITUTIONS.slice(0, 7)].map((inst, idx) => (
                  <div
                    key={`row1-${idx}`}
                    className="w-72 sm:w-80 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all flex items-center gap-3 shrink-0 group cursor-pointer"
                    onClick={() => setCurrentView('register')}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${inst.color} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                      {inst.shortCode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${inst.badgeBg}`}>
                          {inst.board}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {inst.tag}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#001F3F] truncate group-hover:text-[#0062FF] transition-colors">
                        {inst.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {inst.city}, Odisha
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 2: Sliding Right */}
            <div className="overflow-hidden py-1">
              <div className="animate-marquee-right flex gap-3.5">
                {[...STATE_INSTITUTIONS.slice(7), ...STATE_INSTITUTIONS.slice(7)].map((inst, idx) => (
                  <div
                    key={`row2-${idx}`}
                    className="w-72 sm:w-80 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-400 hover:-translate-y-0.5 transition-all flex items-center gap-3 shrink-0 group cursor-pointer"
                    onClick={() => setCurrentView('register')}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${inst.color} text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform`}>
                      {inst.shortCode}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${inst.badgeBg}`}>
                          {inst.board}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {inst.tag}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#001F3F] truncate group-hover:text-[#0062FF] transition-colors">
                        {inst.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {inst.city}, Odisha
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Heroic Delegation Banner (Represent Your College) */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-[#001F3F] via-[#002D5C] to-[#001F3F] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl border border-blue-500/20">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Institutional Rolling Trophy</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Field Your College Delegation at CrossFire 2026
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Every victory across Quiz, Ramp Walk, Debate, Reels, Poster Making, and Treasure Hunt contributes points to your institution’s State Championship standing.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#0062FF] hover:bg-blue-600 text-white font-bold text-xs shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group"
              >
                <span>Register Your Delegation (Free)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
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
              Join hundreds of top +2 students across Odisha. Free registration with instant entry pass generation.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-3.5">
              <button
                onClick={() => setCurrentView('register')}
                className="px-8 py-3.5 rounded-xl bg-white hover:bg-sky-50 text-[#001F3F] font-black text-sm shadow-2xl hover:scale-105 active:scale-95 transition-all"
              >
                Register Free
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

      {/* Floating Mobile Register Quick-Action Pill (When Scrolled Past Hero) */}
      <AnimatePresence>
        {showFloatingCta && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed bottom-16 left-3 right-3 z-40 flex items-center justify-between p-2 pl-3 rounded-2xl bg-[#000d1a]/95 backdrop-blur-xl border border-cyan-400/40 shadow-[0_4px_30px_rgba(0,132,255,0.45)]"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 shrink-0 border border-cyan-400/30">
                <img src="/Logo.png" alt="Crossfire Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white leading-tight">CROSSFIRE 2026</span>
                <span className="text-[10px] font-bold text-cyan-300 leading-tight">₹50,000 Prizes • Nov 15</span>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('register')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0062FF] via-[#0084FF] to-[#00D4FF] text-white font-black text-xs shadow-lg shadow-blue-500/40 flex items-center gap-1.5 active:scale-95 transition-transform border border-cyan-300/50 cursor-pointer"
            >
              <span>Register Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
