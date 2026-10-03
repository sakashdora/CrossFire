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
    <div className="space-y-16 sm:space-y-24 pb-16">

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-gray-200 bg-gradient-to-b from-[#F0F4F8] via-[#F8FAFC] to-white">

        {/* Subtle decorative background shapes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-navy/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-semibold text-navy">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span>State-Level Talent Hunt • November 15, 2026</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-black text-navy tracking-tight leading-[1.15]">
            IGNITE YOUR TALENT AT <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500">
              CROSSFIRE 2026
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-gray-600 font-normal leading-relaxed">
            The biggest inter-school talent festival for <strong>+2 Final Year Students</strong> across Odisha.
            Compete in 6 adrenaline-pumping events, claim your share of <strong>₹81,000+ cash prizes</strong>, and leave your mark on the Srusti Campus stage!
          </p>

          {/* Countdown Clock */}
          <div className="pt-2 pb-4">
            <p className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3">
              Event Commences In:
            </p>
            <CountdownTimer targetDate="2026-11-15T09:30:00+05:30" />
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setCurrentView('register')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-base shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              <span>Register Free Today</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentView('events')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-navy font-bold text-base border border-gray-300 shadow-sm hover:border-gray-400 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore All 6 Events</span>
            </button>
          </div>

          {/* Fast eligibility checklist */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-navy font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> +2 2nd Year (Class 12)
            </span>
            <span className="flex items-center gap-1.5 text-navy font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> CBSE / ICSE / CHSE
            </span>
            <span className="flex items-center gap-1.5 text-navy font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Max 2 Events per Student
            </span>
            <span className="flex items-center gap-1.5 text-navy font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Zero Registration Fee
            </span>
          </div>

        </div>
      </section>

      {/* KPI Highlights Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
            <span className="text-3xl font-black text-navy block">₹81,000+</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Cash Prize</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
            <span className="text-3xl font-black text-orange-500 block">6</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competitive Tracks</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
            <span className="text-3xl font-black text-navy block">300+</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Students Expected</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm text-center">
            <span className="text-3xl font-black text-emerald-600 block">100%</span>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Merit & Fair Play</span>
          </div>
        </div>
      </section>

      {/* The 6 Events Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              <span>Championship Arena</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-navy">
              Choose Your Battleground (Max 2)
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Select up to two competitive tracks to showcase your intellect, style, or creative flair.
            </p>
          </div>

          <button
            onClick={() => setCurrentView('events')}
            className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 self-start md:self-auto"
          >
            <span>View Complete Guidelines</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_EVENTS.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {getEventIcon(event.event_icon)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-full bg-navy-50 text-navy border border-navy-100">
                      {event.event_type === 'solo' ? '👤 Solo' : `👥 Team of ${event.team_size}`}
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-navy group-hover:text-orange-600 transition-colors">
                  {event.name}
                </h3>
                <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
                  {event.description}
                </p>

                {/* Prize Breakdown */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500 font-medium">Prize Pool:</span>
                    <span className="text-navy font-black">₹{event.prize_pool.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>🥇 ₹{event.prize_distribution["1st"]}</span>
                    <span>🥈 ₹{event.prize_distribution["2nd"]}</span>
                    <span>🥉 ₹{event.prize_distribution["3rd"]}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {event.venue_location.split(' ')[0]}
                </span>
                <button
                  onClick={() => onSelectEvent(event)}
                  className="px-3.5 py-1.5 rounded-lg bg-navy hover:bg-orange-500 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  View Details & Rules
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Srusti Campus & Why Participate */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
