import React from 'react';
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
  Compass
} from 'lucide-react';

interface LandingPageProps {
  onSelectEvent: (event: EventItem) => void;
  setCurrentView: (view: string) => void;
}

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

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-20 px-4 sm:px-6 lg:px-8 border-b border-gray-200">
        
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.jpg" alt="Campus Hero" className="w-full h-full object-cover object-center opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/30"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-bold text-gray-500 tracking-wider uppercase mb-2">
              <span>STATE-LEVEL TALENT HUNT • NOVEMBER 15, 2026</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-6xl font-black text-navy tracking-tight leading-[1.1]">
              IGNITE YOUR TALENT AT <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
                CROSSFIRE 2026
              </span>
            </h1>

            <p className="max-w-xl text-sm sm:text-base text-gray-600 font-medium leading-relaxed">
              The biggest inter-school talent festival for <strong>+2 Final Year Students</strong> across Odisha.
              Compete in 6 adrenaline-pumping events, claim your share of <strong>₹81,000+ cash prizes</strong>, and leave your mark on the Srusti Campus stage!
            </p>

            {/* Countdown Clock */}
            <div className="pt-2 pb-2">
              <p className="text-[10px] uppercase tracking-widest font-bold text-navy mb-3">
                Event Commences In:
              </p>
              <div className="inline-block">
                <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-start gap-4 pt-4">
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                <span>Register Free Today</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentView('events')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-gray-50 text-navy font-bold text-sm border-2 border-navy/10 shadow-sm hover:border-navy/30 transition-all flex items-center justify-center gap-2"
              >
                <span>Explore All 6 Events</span>
              </button>
            </div>

            {/* Fast eligibility checklist */}
            <div className="pt-4 flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-[10px] text-gray-500 font-bold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> +2 2nd Year (Class 12)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> CBSE / ICSE / CHSE
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Max 2 Events per Student
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Zero Registration Fee
              </span>
            </div>
          </div>
          
          {/* Right Logo */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="rotate-[-2deg] flex flex-col items-end transform transition-transform hover:scale-105 duration-500 pt-8">
               <span className="text-3xl font-[Yellowtail] text-orange-500 mb-2 mr-4 italic drop-shadow-md">Talent Meets Opportunity</span>
               <div className="flex flex-col items-center justify-center space-y-1">
                 <img src="/Logo.png" alt="CrossFire" className="w-64 h-64 object-contain drop-shadow-2xl" />
                 <span className="bg-white/90 backdrop-blur px-5 py-2 rounded-full text-navy font-black tracking-widest text-sm shadow-xl uppercase border border-white/50 -mt-4 relative z-10">
                    State Level Competition
                 </span>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Highlights Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-12 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Trophy className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-navy block leading-none">₹81,000+</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 block">Total Cash Prize</span>
            </div>
          </div>
          <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Users className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-navy block leading-none">6</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 block">Competitive Tracks</span>
            </div>
          </div>
          <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-navy block leading-none">300+</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 block">Top Students Expected</span>
            </div>
          </div>
          <div className="bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-md flex items-center gap-4 hover:-translate-y-1 transition-transform">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
               <Sparkles className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-navy block leading-none">100%</span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5 block">Merit & Fair Play</span>
            </div>
          </div>
        </div>
      </section>

      {/* The 6 Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-widest mb-2">
            <Zap className="w-4 h-4" />
            <span>Championship Arena</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-navy mb-3">
            Choose Your Battleground (Max 2)
          </h2>
          <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
             <p className="text-sm text-gray-500 font-medium max-w-xl">
               Select up to two competitive tracks to showcase your intellect, style, or creative flair.
             </p>
             <button
               onClick={() => setCurrentView('events')}
               className="text-xs font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 transition-colors pb-1"
             >
               <span>View Complete Guidelines</span>
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_EVENTS.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg hover:border-orange-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform">
                    {React.cloneElement(getEventIcon(event.event_icon) as React.ReactElement, { className: "w-6 h-6 text-white" })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1.5 border border-blue-100">
                      <Users className="w-3 h-3" />
                      {event.event_type === 'solo' ? 'Solo' : `Team of ${event.team_size}`}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-black text-navy mb-2 group-hover:text-orange-600 transition-colors">
                  {event.name}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed min-h-[40px]">
                  {event.description}
                </p>

                {/* Prize Breakdown */}
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
                <button
                  onClick={() => onSelectEvent(event)}
                  className="px-4 py-2 rounded-full bg-navy hover:bg-navy-dark text-white font-bold text-xs transition-colors shadow-md flex items-center gap-1.5"
                >
                  View Details & Rules <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Srusti Campus & Why Participate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="bg-navy rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">
              Hosted by Srusti Academy of Graduate Studies
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Why State-Level Champions Compete at CrossFire
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-300 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <ShieldCheck className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold mb-1">State-Wide Peer Network</strong>
                  Interact with the most ambitious +2 talents from leading schools across Odisha.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Trophy className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold mb-1">Prestige & Official Trophies</strong>
                  Every participant receives official participation recognition; top performers win grand cash awards.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Zap className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold mb-1">Live Real-time Scoring</strong>
                  Transparent rubric evaluation by certified external judges, broadcasted live on campus screens.
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                <Users className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block font-bold mb-1">Campus Life Experience</strong>
                  Immerse in Srusti's high-tech amphitheatre, media labs, and vibrant management campus.
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setCurrentView('register')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition-colors"
              >
                Sign Up for CrossFire 2026
              </button>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
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
