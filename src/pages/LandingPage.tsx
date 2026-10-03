import React, { useEffect, useRef } from 'react';
import { CountdownTimer } from '../components/CountdownTimer';
import { EventItem } from '../types';
import { INITIAL_EVENTS } from '../data/mockData';
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
  Megaphone
} from 'lucide-react';

interface LandingPageProps {
  onSelectEvent: (event: EventItem) => void;
  setCurrentView: (view: string) => void;
}

const TICKER_ITEMS = [
  '🏆 Registration is now OPEN for CrossFire 2026 — Register before November 5th',
  '📋 Provisional list of verified institutions eligible for participation is now available',
  '🎯 Maximum 2 events per student — Choose wisely across Group A & Group B',
  '📍 Venue: Srusti Academy of Management & Technology, Chandaka Industrial Estate, Bhubaneswar',
  '💰 Total prize pool of ₹81,000+ across 6 competitive tracks',
  '✅ Open to all +2 (Class 12) students from CBSE, ICSE & CHSE councils',
  '🔔 Results and live scoring will be broadcasted on campus screens during the event',
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

    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.2,
        alpha: Math.random() * 0.8 + 0.2,
        speed: Math.random() * 0.004 + 0.001,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.alpha += star.speed;
        if (star.alpha > 1 || star.alpha < 0.1) star.speed = -star.speed;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 200, 130, ${Math.min(1, Math.max(0, star.alpha))})`;
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
      style={{ opacity: 0.7 }}
    />
  );
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectEvent,
  setCurrentView,
}) => {
  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-6 h-6 text-orange-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-orange-500" />;
      case 'Video': return <Video className="w-6 h-6 text-orange-500" />;
      case 'MessageSquareQuote': return <MessageSquareQuote className="w-6 h-6 text-orange-500" />;
      case 'Palette': return <Palette className="w-6 h-6 text-orange-500" />;
      case 'Compass': return <Compass className="w-6 h-6 text-orange-500" />;
      default: return <Trophy className="w-6 h-6 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-16 bg-[#F8FAFC]">

      {/* HERO — Dark Navy + Star Field */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#050D1A]">

        {/* Radial glow blobs */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-32 left-1/3 w-[500px] h-[300px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[300px] h-[400px] bg-orange-900/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Animated stars */}
        <StarField />

        {/* Main centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-28 pb-10">

          {/* Dual logo row */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <img
              src="/collegeLogo.jpeg"
              alt="Srusti Academy"
              className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] rounded-full object-cover border-2 border-orange-500/50 shadow-lg shadow-orange-500/25"
            />
            <div className="flex flex-col items-center px-2">
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
              <span className="text-white/20 text-[9px] font-bold tracking-widest uppercase my-1">x</span>
              <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/25 to-transparent" />
            </div>
            <img
              src="/Logo.png"
              alt="CrossFire 2026"
              className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] object-contain drop-shadow-2xl"
            />
          </div>

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-orange-300 text-[10px] sm:text-[11px] font-black uppercase tracking-widest">
              State-Level Talent Hunt &nbsp;•&nbsp; Srusti Academy &nbsp;•&nbsp; November 15, 2026
            </span>
          </div>

          {/* Main Title */}
          <div className="mb-2">
            <p className="text-white/30 text-xs sm:text-sm font-bold tracking-[0.35em] uppercase mb-4">
              Ignite Your Talent At
            </p>
            <h1 className="text-5xl sm:text-7xl lg:text-[96px] font-black tracking-tight leading-none select-none">
              <span className="text-white drop-shadow-lg">CROSS</span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #FF7B25 0%, #FFB347 40%, #FF7B25 80%, #E86A1D 100%)' }}
              >
                FIRE
              </span>
              <span className="text-white/50 ml-3 text-3xl sm:text-5xl lg:text-6xl align-middle font-bold">
                2026
              </span>
            </h1>
          </div>

          {/* Date + Venue */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-white/45 text-xs sm:text-sm font-medium mt-5 mb-10">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-orange-400" />
              November 15, 2026
            </span>
            <span className="text-white/20 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-400" />
              Srusti Academy, Bhubaneswar, Odisha
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/35 mb-5">
              Event Starts In
            </p>
            <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <button
              onClick={() => setCurrentView('register')}
              className="w-full sm:w-auto px-10 py-4 rounded-full font-black text-sm text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #FF7B25, #E86A1D)' }}
            >
              Register Free Today
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-sm border border-white/20 hover:border-orange-500/40 transition-all flex items-center justify-center gap-2"
            >
              Explore All 6 Events
            </button>
          </div>

          {/* Eligibility pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {['+2 2nd Year (Class 12)', 'CBSE / ICSE / CHSE', 'Max 2 Events per Student', 'Zero Registration Fee'].map((item) => (
              <span key={item} className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Live News Ticker */}
        <div className="relative z-10 w-full border-t border-white/10 bg-[#080F1E]/90 backdrop-blur-sm overflow-hidden">
          <div className="flex items-stretch">
            <div className="shrink-0 flex items-center gap-2 px-5 py-3 bg-orange-500 text-white font-black text-[10px] uppercase tracking-widest">
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>LATEST</span>
            </div>
            <div className="overflow-hidden flex-1 flex items-center">
              <div
                className="flex whitespace-nowrap"
                style={{ animation: 'ticker 50s linear infinite' }}
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="inline-block text-white/55 text-[11px] font-medium py-3 px-8 border-r border-white/10 last:border-0 hover:text-white/90 transition-colors cursor-default">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>

      {/* KPI Highlights Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Trophy className="w-6 h-6 text-orange-500" />, value: '₹81,000+', label: 'Total Cash Prize' },
            { icon: <Zap className="w-6 h-6 text-orange-500" />, value: '6', label: 'Competitive Tracks' },
            { icon: <Users className="w-6 h-6 text-orange-500" />, value: '300+', label: 'Top Students Expected' },
            { icon: <Sparkles className="w-6 h-6 text-orange-500" />, value: '100%', label: 'Merit & Fair Play' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0">{icon}</div>
              <div>
                <span className="text-2xl font-black text-navy block leading-none">{value}</span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 block">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The 6 Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest mb-2">
            <Zap className="w-4 h-4" />
            <span>Championship Arena</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-navy mb-3">Choose Your Battleground (Max 2)</h2>
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
            <p className="text-sm text-gray-500 font-medium max-w-xl">
              Select up to two competitive tracks to showcase your intellect, style, or creative flair.
            </p>
            <button onClick={() => setCurrentView('events')} className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors pb-1">
              <span>View Complete Guidelines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_EVENTS.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    {React.cloneElement(getEventIcon(event.event_icon) as React.ReactElement, { className: "w-6 h-6 text-white" })}
                  </div>
                  <span className="text-[9px] font-bold uppercase px-3 py-1.5 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1.5 border border-orange-100">
                    <Users className="w-3 h-3" />
                    {event.event_type === 'solo' ? 'Solo' : `Team of ${event.team_size}`}
                  </span>
                </div>
                <h3 className="text-lg font-black text-navy mb-2 group-hover:text-orange-600 transition-colors">{event.name}</h3>
                <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">{event.description}</p>
                <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block mb-2">Prize Pool</span>
                  <div className="flex items-center gap-4 text-xs font-bold text-navy">
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-orange-400" /> ₹{event.prize_distribution["1st"]}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-blue-400" /> ₹{event.prize_distribution["2nd"]}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-orange-700" /> ₹{event.prize_distribution["3rd"]}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {event.venue_location.split(' ')[0]}
                </span>
                <button onClick={() => onSelectEvent(event)} className="px-4 py-2 rounded-full bg-navy hover:bg-navy-dark text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5">
                  View Details & Rules <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Participate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-navy rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
              Hosted by Srusti Academy of Graduate Studies
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">Why State-Level Champions Compete at CrossFire</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300 pt-2">
              {[
                { icon: <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'State-Wide Peer Network', desc: 'Interact with the most ambitious +2 talents from leading schools across Odisha.' },
                { icon: <Trophy className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Prestige & Official Trophies', desc: 'Every participant receives official participation recognition; top performers win grand cash awards.' },
                { icon: <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Live Real-time Scoring', desc: 'Transparent rubric evaluation by certified external judges, broadcasted live on campus screens.' },
                { icon: <Users className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Campus Life Experience', desc: "Immerse in Srusti's high-tech amphitheatre, media labs, and vibrant management campus." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                  {icon}
                  <div><strong className="text-white block font-bold mb-1">{title}</strong>{desc}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button onClick={() => setCurrentView('register')} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors">
                Sign Up for CrossFire 2026
              </button>
              <button onClick={() => setCurrentView('leaderboard')} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors">
                Check Live Standings
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
