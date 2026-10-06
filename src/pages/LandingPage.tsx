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
  Calendar,
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
  Image as ImageIcon,
  X,
  Bot,
  Send,
  Star
} from 'lucide-react';

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
    a: 'The total cash prize pool is ₹50,000 distributed across 6 events: Quiz has an ₹18,000 prize pool (Champion: ₹6,000, 1st Runner-up: ₹4,000, 2nd Runner-up: ₹3,500, plus ₹1,500 each for 3rd, 4th, and 5th finalists). Debate and Poster Making feature ₹7,000 each (Champion: ₹4,000, 1st Runner-up: ₹2,000, 2nd Runner-up: ₹1,000). Treasure Hunt, Ramp Walk, and Reels feature ₹6,000 each (Champion: ₹3,000, 1st Runner-up: ₹2,000, 2nd Runner-up: ₹1,000). Winners also receive championship trophies, medals, and official state certificates of merit.'
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
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleAiAsk = (query: string) => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiAnswer(null);
    setTimeout(() => {
      const q = query.toLowerCase();
      if (q.includes('event') || q.includes('track') || q.includes('competition')) {
        setAiAnswer('🏆 CROSSFIRE 2026 features 6 competitive tracks: Quiz (Team of 2, ₹18k pool), Treasure Hunt (Team of 3, ₹6k pool), Ramp Walk (Solo, ₹6k pool), Reels (Solo, ₹6k pool), Debate (Solo, ₹7k pool), and Poster Making (Solo, ₹7k pool). Each student can register for up to 2 events!');
      } else if (q.includes('prize') || q.includes('cash') || q.includes('pool') || q.includes('money')) {
        setAiAnswer('💰 Total Cash Pool: ₹50,000 INR! Quiz ₹18,000 (Champion ₹6k, 1st Runner-up ₹4k, 2nd Runner-up ₹3.5k, 3rd-5th finalists ₹1.5k each); Debate & Poster Making ₹7,000 each (Champion ₹4k, 1st Runner-up ₹2k, 2nd Runner-up ₹1k); Treasure Hunt, Ramp Walk & Reels ₹6,000 each (Champion ₹3k, 1st Runner-up ₹2k, 2nd Runner-up ₹1k).');
      } else if (q.includes('team') || q.includes('partner') || q.includes('group')) {
        setAiAnswer('👥 Team Tracks: Quiz requires a 2-student team. Treasure Hunt requires a 3-student team. Both teammates must belong to the same institution. Ramp Walk, Reels, Debate, and Poster Making are solo individual events.');
      } else if (q.includes('fee') || q.includes('free') || q.includes('food') || q.includes('lunch') || q.includes('refresh')) {
        setAiAnswer('✨ 100% Free Entry! There is ₹0 registration fee. All registered +2 students receive complimentary morning breakfast, lunch, and hospitality at Srusti Campus dining courtyard.');
      } else if (q.includes('time') || q.includes('date') || q.includes('schedule') || q.includes('venue')) {
        setAiAnswer('📅 Date: Sunday, November 15, 2026 at Srusti Academy of Management and Technology, Bhubaneswar. Gate check-in begins at 08:30 AM, events start at 10:00 AM, and the Grand Valedictory Ceremony is at 04:00 PM.');
      } else {
        setAiAnswer(`🤖 CROSSFIRE 2026 is Odisha's premier State-Level talent hunt for +2 12th students (CBSE, ICSE, CHSE) held at Srusti Academy on Nov 15, 2026. Max 2 events per student. All events are 100% free with cash prizes, championship trophies, and state certificates!`);
      }
      setAiLoading(false);
    }, 400);
  };

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
        
        {/* Dynamic Blue Fire Cosmic Particles Swarm Background */}
        <HeroParticlesBackground className="opacity-100" />

        {/* ── Desktop Top-Left Institutional Card (SAGS Crest) ── */}
        <div className="hidden lg:flex flex-col items-center absolute top-20 left-8 xl:left-14 z-20 group select-none">
          <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-3xl bg-white p-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] border border-cyan-400/40 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
            <img
              src="/sagslogo.png"
              alt="SAGS - Srusti Academy of Graduate Studies"
              className="w-full h-full object-contain filter drop-shadow-sm"
            />
          </div>
          <p className="mt-2 text-[11px] font-bold text-slate-200 leading-tight text-center max-w-[170px] drop-shadow-sm">
            Srusti Academy of Management<br />and Technology
          </p>
        </div>

        {/* Central Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-12 sm:pt-14 md:pt-16 pb-3 max-w-5xl mx-auto w-full">
          
          {/* Mobile Institutional Card (Compact on top) */}
          <div className="lg:hidden flex flex-col items-center mb-3 select-none">
            <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-lg border border-cyan-400/30 flex items-center justify-center">
              <img src="/sagslogo.png" alt="Srusti Academy" className="w-full h-full object-contain" />
            </div>
            <p className="mt-1.5 text-[10px] font-bold text-slate-300 text-center max-w-[200px]">
              Srusti Academy of Management and Technology
            </p>
          </div>

          {/* ── Center Hero Emblem: Glowing Cyan Target Reticle with Flame ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative -mb-1 flex items-center justify-center select-none"
          >
            <div className="relative w-20 h-14 sm:w-28 sm:h-18 md:w-32 md:h-20 flex items-center justify-center">
              <img
                src="/hero-flame-reticle.png"
                alt="CrossFire Reticle Flame"
                className="w-full h-full object-contain filter drop-shadow-[0_0_20px_rgba(0,212,255,0.5)] animate-pulse"
              />
            </div>
          </motion.div>

          {/* ── Main Display Title: Metallic Chrome CROSS + Fiery Orange FIRE ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="mb-0.5 flex items-center justify-center"
          >
            <img
              src="/hero-crossfire-title.png"
              alt="CROSSFIRE"
              className="w-[270px] sm:w-[380px] md:w-[480px] lg:w-[540px] h-auto object-contain filter drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] select-none"
            />
          </motion.div>

          {/* ── Subtitle Flanked by Cyan Accent Lines ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex items-center justify-center gap-3 sm:gap-5 my-1 w-full max-w-xl mx-auto select-none"
          >
            <span className="w-8 sm:w-16 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
            <span className="text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-[0.25em] text-slate-200 whitespace-nowrap">
              STATE LEVEL COMPETITION
            </span>
            <span className="w-8 sm:w-16 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
          </motion.div>

          {/* ── Glowing Cyan Tagline ── */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.6 }}
            className="text-xs sm:text-sm md:text-base font-black uppercase tracking-[0.35em] text-[#00d4ff] drop-shadow-[0_0_15px_rgba(0,212,255,0.75)] mt-0.5 mb-3 select-none"
          >
            IGNITE YOUR TALENT
          </motion.p>

          {/* ── Unified Date & Venue Pill ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="inline-flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 px-5 sm:px-7 py-2 rounded-full bg-[#001428]/80 border border-cyan-500/35 backdrop-blur-md text-xs sm:text-sm font-bold text-slate-200 shadow-[0_0_20px_rgba(0,140,255,0.12)] mb-3 sm:mb-4 select-none"
          >
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Sunday, November 15, 2026</span>
            </span>
            <span className="hidden sm:inline text-cyan-400/30 font-light">|</span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Srusti Academy of Management and Technology</span>
            </span>
          </motion.div>

          {/* ── Championship Starts In & Countdown Boxes ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mb-3 sm:mb-4 select-none"
          >
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.28em] font-black text-slate-300 mb-2">
              <span className="text-cyan-400 text-xs">✦</span>
              <span>CHAMPIONSHIP STARTS IN</span>
            </div>
            <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
          </motion.div>

          {/* ── Primary Action Buttons (Register Free, Explore Tracks, Brochure) ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4 sm:mb-5 w-full max-w-md sm:max-w-none relative z-30"
          >
            {/* Register Free Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCurrentView('register')}
              className="h-12 sm:h-13 px-8 sm:px-10 rounded-full bg-gradient-to-r from-[#0062FF] via-[#0084FF] to-[#00D4FF] text-white font-black text-sm sm:text-base shadow-[0_0_30px_rgba(0,132,255,0.55)] hover:shadow-[0_0_45px_rgba(0,212,255,0.7)] transition-all flex items-center justify-center gap-2.5 border border-cyan-300/40 cursor-pointer"
            >
              <span>Register Free</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            {/* Explore All 6 Tracks */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setCurrentView('events')}
              className="h-12 sm:h-13 px-6 sm:px-7 rounded-full bg-[#001428]/80 hover:bg-[#002447] text-white font-bold text-xs sm:text-sm border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,140,255,0.1)] hover:scale-105"
            >
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>Explore All 6 Tracks</span>
            </motion.button>

            {/* Brochure & Media (PDF) Dropdown */}
            <div className="relative w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className={`w-full sm:w-auto h-12 sm:h-13 px-5 sm:px-6 rounded-full backdrop-blur-md font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,140,255,0.1)] ${
                  showDownloadMenu
                    ? 'bg-blue-600/30 text-white border-cyan-400 shadow-[0_0_25px_rgba(56,189,248,0.3)]'
                    : 'bg-[#001428]/80 hover:bg-[#002447] text-slate-200 hover:text-white border-cyan-500/30 hover:border-cyan-400/60'
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

          {/* ── Continuous Bottom Trust Bar with Smooth Right-to-Left Moving Animation (No AI Badge) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="relative mt-2 sm:mt-3 max-w-4xl w-full mx-auto select-none"
          >
            {/* Single continuous pill bar matching reference design */}
            <div className="rounded-full bg-[#001428]/85 border border-cyan-500/40 backdrop-blur-md px-6 py-3.5 shadow-[0_0_25px_rgba(0,140,255,0.15)] overflow-hidden relative group">
              {/* Glowing top line highlight */}
              <div className="absolute top-0 inset-x-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent pointer-events-none" />

              {/* Continuous Right-to-Left Infinite Marquee */}
              <div className="w-full overflow-hidden flex">
                <motion.div
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ ease: 'linear', duration: 22, repeat: Infinity }}
                  className="flex items-center gap-6 sm:gap-8 whitespace-nowrap shrink-0 pr-6 sm:pr-8"
                >
                  {[
                    { icon: GraduationCap, label: '+2 2nd Year (Class 12) Only' },
                    { icon: FileText, label: 'CBSE / ICSE / CHSE' },
                    { icon: Zap, label: 'Max 2 Events / Student' },
                    { icon: Star, label: '100% Free Entry & Refreshnts' },
                    { icon: GraduationCap, label: '+2 2nd Year (Class 12) Only' },
                    { icon: FileText, label: 'CBSE / ICSE / CHSE' },
                    { icon: Zap, label: 'Max 2 Events / Student' },
                    { icon: Star, label: '100% Free Entry & Refreshnts' },
                  ].map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <React.Fragment key={idx}>
                        <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-200 hover:text-cyan-300 transition-colors">
                          <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        <span className="text-cyan-500/30 font-light">|</span>
                      </React.Fragment>
                    );
                  })}
                </motion.div>
              </div>
            </div>
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
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-950 shadow-sm">
                      <span className="text-[9px] block text-amber-700 font-black uppercase tracking-wider">🏆 Champion</span>
                      ₹{event.prize_distribution['1st']?.toLocaleString('en-IN')}
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 border border-slate-300/80 text-slate-800">
                      <span className="text-[9px] block text-slate-600 font-bold uppercase tracking-wider">1st Runner-up</span>
                      ₹{event.prize_distribution['2nd']?.toLocaleString('en-IN')}
                    </div>
                    <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-950 shadow-sm">
                      <span className="text-[9px] block text-orange-700 font-bold uppercase tracking-wider">2nd Runner-up</span>
                      ₹{event.prize_distribution['3rd']?.toLocaleString('en-IN')}
                    </div>
                  </div>
                  {event.prize_distribution['4th'] && (
                    <div className="text-[10px] text-center font-bold text-blue-700 bg-blue-100/70 rounded-md py-1 px-2 border border-blue-200/70">
                      + 3rd, 4th, 5th: ₹1,500 each (6 Finalists)
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

        {/* ─── OFFICIAL PRIZE & TEAM SIZE MATRIX TABLE ─── */}
        <div className="mt-14 bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgba(0,31,63,0.06)] overflow-hidden">
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#001F3F] via-[#002b5c] to-[#0062FF] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold text-amber-300 uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5" />
                <span>Official Prize Matrix</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Event Prize & Team Distribution
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                State-level cash pool of ₹50,000, trophies for champions, runner-up awards, and participation honors.
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0 bg-white/10 sm:bg-transparent p-3 sm:p-0 rounded-xl border border-white/10 sm:border-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">Total Cash Award</span>
              <span className="text-2xl sm:text-3xl font-black text-amber-400">₹50,000</span>
              <span className="text-[10px] text-slate-300 block font-semibold">100% Free Entry • ₹0 Fee</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold uppercase text-[10px] sm:text-xs tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Event</th>
                  <th className="py-3.5 px-3 text-center">Team size</th>
                  <th className="py-3.5 px-3 text-center text-amber-700 bg-amber-500/10">🏆 Champion</th>
                  <th className="py-3.5 px-3 text-center text-slate-700">1st Runner-up</th>
                  <th className="py-3.5 px-3 text-center text-orange-800">2nd Runner-up</th>
                  <th className="py-3.5 px-3 text-center text-slate-500">3rd</th>
                  <th className="py-3.5 px-3 text-center text-slate-500">4th</th>
                  <th className="py-3.5 px-3 text-center text-slate-500">5th</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right text-[#0062FF] font-black">Event total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#0062FF]"></span>
                    Quiz
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">2</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹6,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹4,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹3,500</td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">₹1,500</td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">₹1,500</td>
                  <td className="py-3.5 px-3 text-center text-slate-600 font-semibold">₹1,500</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹18,000</td>
                </tr>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Treasure Hunt
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">3</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹3,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹2,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹1,000</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹6,000</td>
                </tr>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Ramp Walk
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">1</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹3,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹2,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹1,000</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹6,000</td>
                </tr>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                    Reels
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">1</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹3,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹2,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹1,000</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹6,000</td>
                </tr>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Debate
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">1</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹4,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹2,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹1,000</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹7,000</td>
                </tr>
                <tr className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6 font-bold text-[#001F3F] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Poster Making
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-600">1</td>
                  <td className="py-3.5 px-3 text-center font-black text-amber-700 bg-amber-50/50">₹4,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">₹2,000</td>
                  <td className="py-3.5 px-3 text-center font-bold text-orange-800">₹1,000</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-3 text-center text-slate-400">–</td>
                  <td className="py-3.5 px-4 sm:px-6 text-right font-black text-[#001F3F]">₹7,000</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-100/90 font-black text-xs sm:text-sm text-[#001F3F] border-t-2 border-slate-300">
                  <td className="py-4 px-4 sm:px-6 uppercase tracking-wider">Grand Total (6 Tracks)</td>
                  <td className="py-4 px-3 text-center text-slate-500">—</td>
                  <td className="py-4 px-3 text-center text-amber-800 bg-amber-500/10">₹23,000</td>
                  <td className="py-4 px-3 text-center">₹14,000</td>
                  <td className="py-4 px-3 text-center text-orange-900">₹8,500</td>
                  <td className="py-4 px-3 text-center text-slate-600">₹1,500</td>
                  <td className="py-4 px-3 text-center text-slate-600">₹1,500</td>
                  <td className="py-4 px-3 text-center text-slate-600">₹1,500</td>
                  <td className="py-4 px-4 sm:px-6 text-right text-base font-black text-[#0062FF]">₹50,000</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Cash Awards & Championship Trophies awarded at Valedictory Ceremony (Nov 15, 2026).
            </span>
            <span className="font-bold text-[#001F3F]">
              Top 6 Teams qualify for Quiz Campus Finals
            </span>
          </div>
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

      {/* ─── AI EVENT ASSISTANT MODAL ─── */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#001428] border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-white relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                      <span>CROSSFIRE AI Assistant</span>
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-2 py-0.5 rounded-full font-bold">Live</span>
                    </h3>
                    <p className="text-xs text-slate-400">Instant answers regarding events, rules, fees & prizes</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Prompt Chips */}
              <div className="space-y-2 mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Popular Queries</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Competition Tracks & Teams',
                    '₹50,000 Cash Prize Breakdown',
                    'Schedule & Event Timings',
                    'Free Lunch & Hospitality Rules'
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        setAiQuestion(chip);
                        handleAiAsk(chip);
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 hover:border-cyan-400/40 text-slate-200 transition-all text-left cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Answer Box */}
              {aiAnswer && (
                <div className="p-4 rounded-2xl bg-blue-950/50 border border-cyan-500/40 text-xs sm:text-sm text-cyan-100 leading-relaxed mb-4 shadow-inner">
                  <p className="font-bold text-white mb-1.5 flex items-center gap-1.5 text-cyan-300 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    Assistant Insights
                  </p>
                  <p>{aiAnswer}</p>
                </div>
              )}

              {/* Question Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAiAsk(aiQuestion);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  placeholder="Ask anything about CROSSFIRE 2026..."
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0062FF] to-[#00D4FF] hover:from-blue-600 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Send className="w-4 h-4" />
                  <span>Ask</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
