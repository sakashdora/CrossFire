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
    <div className="space-y-10 sm:space-y-16 pb-20 lg:pb-16 bg-[#F8FAFC]">

      {/* HERO — Dark Navy + Star Field */}
      <section className="relative min-h-[90vh] lg:min-h-screen flex flex-col justify-between overflow-hidden bg-[#050D1A]">

        {/* Radial glow blobs */}
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[400px] sm:h-[500px] bg-orange-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-20 left-1/4 w-[350px] sm:w-[500px] h-[250px] sm:h-[300px] bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-[250px] sm:w-[350px] h-[350px] sm:h-[450px] bg-orange-900/15 rounded-full blur-[90px] pointer-events-none" />

        {/* Animated stars */}
        <StarField />

        {/* Main centered content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-10 max-w-5xl mx-auto w-full">

          {/* Dual logo row with premium white badge framing for high contrast */}
          <div className="flex items-center justify-center gap-3 sm:gap-5 mb-5 sm:mb-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl shadow-black/40 border border-white/40 flex items-center justify-center transition-transform hover:scale-105">
              <img
                src="/collegeLogo.jpeg"
                alt="Srusti Academy of Management"
                className="w-full h-full object-contain"
              />
            </div>
            
            <div className="flex flex-col items-center px-1">
              <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
              <span className="text-white/40 text-[10px] sm:text-xs font-black tracking-widest uppercase my-0.5">x</span>
              <div className="w-px h-6 sm:h-8 bg-gradient-to-b from-transparent via-white/30 to-transparent" />
            </div>

            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-xl shadow-orange-500/25 border border-orange-500/40 flex items-center justify-center transition-transform hover:scale-105">
              <img
                src="/Logo.png"
                alt="CrossFire 2026"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Live event badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-orange-500/35 bg-orange-500/10 mb-4 sm:mb-6 max-w-full">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
            <span className="text-orange-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
              State-Level Talent Hunt &bull; Srusti Academy &bull; November 15, 2026
            </span>
          </div>

          {/* Main Title */}
          <div className="mb-2 max-w-4xl mx-auto">
            <p className="text-white/40 text-[10px] sm:text-xs md:text-sm font-bold tracking-[0.3em] uppercase mb-2 sm:mb-3">
              Ignite Your Talent At
            </p>
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[88px] font-black tracking-tight leading-[1.08] select-none">
              <span className="text-white drop-shadow-lg">CROSS</span>
              <span
                className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #FF7B25 0%, #FFB347 40%, #FF7B25 80%, #E86A1D 100%)' }}
              >
                FIRE
              </span>
              <span className="inline-block ml-2 sm:ml-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-xl sm:rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black align-middle shadow-inner">
                2026
              </span>
            </h1>
          </div>

          {/* Date + Venue Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-white/70 text-xs sm:text-sm font-semibold mt-3 mb-5 sm:mb-6">
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <CalendarDays className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              November 15, 2026
            </span>
            <span className="text-white/30 hidden sm:inline">&bull;</span>
            <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
              Srusti Academy, Bhubaneswar
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-5 sm:mb-7">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-white/40 mb-3">
              Event Starts In
            </p>
            <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-5 sm:mb-6 w-full max-w-md sm:max-w-none">
            <button
              onClick={() => setCurrentView('register')}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-2xl font-black text-sm text-white shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #FF7B25, #E86A1D)' }}
            >
              <span>Register Free Today</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto h-12 sm:h-14 px-8 sm:px-10 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 text-white font-bold text-sm border border-white/20 hover:border-orange-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Explore All 6 Events</span>
            </button>
          </div>

          {/* Eligibility pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
            {['+2 2nd Year (Class 12)', 'CBSE / ICSE / CHSE', 'Max 2 Events per Student', 'Zero Registration Fee'].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Live News Ticker */}
        <div className="relative z-10 w-full border-t border-white/10 bg-[#080F1E]/95 backdrop-blur-md overflow-hidden">
          <div className="flex items-stretch h-11 sm:h-12">
            <div className="shrink-0 flex items-center gap-2 px-4 sm:px-5 bg-orange-500 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-md">
              <Megaphone className="w-3.5 h-3.5 shrink-0" />
              <span>LATEST</span>
            </div>
            <div className="overflow-hidden flex-1 flex items-center">
              <div
                className="flex whitespace-nowrap"
                style={{ animation: 'ticker 50s linear infinite' }}
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="inline-block text-white/60 text-xs font-semibold py-2 px-6 sm:px-8 border-r border-white/10 last:border-0 hover:text-white transition-colors cursor-default">
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pt-4 sm:pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {[
            { icon: <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />, value: '₹81,000+', label: 'Total Cash Prize' },
            { icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />, value: '6', label: 'Competitive Tracks' },
            { icon: <Users className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />, value: '300+', label: 'Top Students Expected' },
            { icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />, value: '100%', label: 'Merit & Fair Play' },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                {icon}
              </div>
              <div className="min-w-0">
                <span className="text-xl sm:text-2xl font-black text-navy block leading-none truncate">{value}</span>
                <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">{label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* The 6 Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10">
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest mb-2">
            <Zap className="w-4 h-4" />
            <span>Championship Arena</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-navy mb-2 sm:mb-3">
            Choose Your Battleground (Max 2)
          </h2>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-500 font-medium max-w-xl">
              Select up to two competitive tracks to showcase your intellect, style, or creative flair.
            </p>
            <button
              onClick={() => setCurrentView('events')}
              className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors self-start sm:self-auto"
            >
              <span>View Complete Guidelines</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {INITIAL_EVENTS.map((event) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                    {React.cloneElement(getEventIcon(event.event_icon) as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6 text-white" })}
                  </div>
                  <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-orange-50 text-orange-700 flex items-center gap-1.5 border border-orange-100">
                    <Users className="w-3 h-3" />
                    {event.event_type === 'solo' ? 'Solo' : `Team of ${event.team_size}`}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-navy mb-1.5 group-hover:text-orange-600 transition-colors">
                  {event.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed min-h-[38px] line-clamp-2">
                  {event.description}
                </p>
                <div className="mt-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Prize Pool</span>
                  <div className="flex items-center gap-3 text-xs font-bold text-navy">
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-orange-400" /> ₹{event.prize_distribution["1st"]}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-blue-400" /> ₹{event.prize_distribution["2nd"]}</span>
                    <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-orange-700" /> ₹{event.prize_distribution["3rd"]}</span>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {event.venue_location.split(' ')[0]}
                </span>
                <button
                  onClick={() => onSelectEvent(event)}
                  className="h-9 px-3.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs transition-colors shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Participate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="bg-navy rounded-3xl text-white p-6 sm:p-10 md:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-3xl space-y-5 sm:space-y-6">
            <span className="text-orange-400 text-[10px] sm:text-xs font-black uppercase tracking-widest inline-block">
              Hosted by Srusti Academy of Graduate Studies
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">
              Why State-Level Champions Compete at CrossFire
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs text-gray-300 pt-2">
              {[
                { icon: <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'State-Wide Peer Network', desc: 'Interact with the most ambitious +2 talents from leading schools across Odisha.' },
                { icon: <Trophy className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Prestige & Official Trophies', desc: 'Every participant receives official participation recognition; top performers win grand cash awards.' },
                { icon: <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Live Real-time Scoring', desc: 'Transparent rubric evaluation by certified external judges, broadcasted live on campus screens.' },
                { icon: <Users className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />, title: 'Campus Life Experience', desc: "Immerse in Srusti's high-tech amphitheatre, media labs, and vibrant management campus." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5">
                  {icon}
                  <div><strong className="text-white block font-bold mb-1">{title}</strong>{desc}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                Sign Up for CrossFire 2026
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                Check Live Standings
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
