import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { EventsDiscoveryPage } from './pages/EventsDiscoveryPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { JudgePanel } from './pages/JudgePanel';
import { AdminDashboard } from './pages/AdminDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { EventItem, Registration } from './types';
import { INITIAL_EVENTS } from './data/mockData';
import { Home, Calendar, Trophy, User, ShieldCheck, Gavel, UserPlus, HeartHandshake, ArrowUp } from 'lucide-react';

const CrossFireApp: React.FC = () => {
  const { user, role } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Auto scroll to top on any page view transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initial user registrations (seeded with 2 demo events matching Google Form)
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([
    {
      id: 'reg-demo-1',
      user_id: 'user-student-demo',
      event_id: 'ev-quiz',
      event: INITIAL_EVENTS[0], // Intelect Odyssey (Quiz)
      team_name: 'DAV Brainiacs',
      team_members: [{ name: 'Priya Sahoo (Roll 14)' }],
      status: 'confirmed',
      score: 89.5,
      score_locked: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'reg-demo-2',
      user_id: 'user-student-demo',
      event_id: 'ev-ramp-walk',
      event: INITIAL_EVENTS[4], // Glam 'n' Dazzle (Ramp Walk)
      status: 'confirmed',
      score: 90.0,
      score_locked: true,
      created_at: new Date().toISOString()
    }
  ]);

  const handleRegisterEvent = async (eventId: string, teamName?: string, members?: any[]): Promise<boolean> => {
    if (userRegistrations.length >= 2) {
      alert('Maximum 2 events registration limit reached per student.');
      return false;
    }

    const event = INITIAL_EVENTS.find(e => e.id === eventId);
    if (!event) return false;

    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      user_id: user?.id || 'guest',
      event_id: eventId,
      event,
      team_name: teamName,
      team_members: members,
      status: 'registered',
      created_at: new Date().toISOString()
    };

    setUserRegistrations(prev => [...prev, newReg]);
    return true;
  };

  const handleGoogleFormRegistrationSuccess = (events: EventItem[]) => {
    const newRegs: Registration[] = events.map(ev => ({
      id: `reg-${Date.now()}-${ev.id}`,
      user_id: user?.id || 'registered-student',
      event_id: ev.id,
      event: ev,
      team_name: `${user?.first_name || 'Student'}'s Team`,
      status: 'registered',
      created_at: new Date().toISOString()
    }));

    setUserRegistrations(newRegs);
  };

  const handleWithdrawEvent = (registrationId: string) => {
    setUserRegistrations(prev => prev.filter(r => r.id !== registrationId));
  };

  const handleSubmitMedia = (registrationId: string, url: string) => {
    setUserRegistrations(prev => prev.map(r => {
      if (r.id === registrationId) {
        return {
          ...r,
          media_url: url,
          media_submitted_at: new Date().toISOString()
        };
      }
      return r;
    }));
  };

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleSelectEvent = (_event: EventItem) => {
    setCurrentView('events');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-gray-900 pb-20 lg:pb-0">
      
      {/* Top Navbar */}
      <Navbar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={openAuth}
      />

      {/* Main View Router */}
      <main className="flex-grow pb-24 lg:pb-12 min-h-[75vh]">
        {currentView === 'landing' && (
          <LandingPage
            onSelectEvent={handleSelectEvent}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'register' && (
          <RegistrationPage
            onSuccess={handleGoogleFormRegistrationSuccess}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'events' && (
          <EventsDiscoveryPage
            userRegistrations={userRegistrations}
            onRegisterEvent={handleRegisterEvent}
            openAuthModal={openAuth}
          />
        )}

        {currentView === 'dashboard' && (
          <StudentDashboard
            userRegistrations={userRegistrations}
            onWithdrawEvent={handleWithdrawEvent}
            onSubmitMedia={handleSubmitMedia}
            setCurrentView={setCurrentView}
          />
        )}

        {currentView === 'judge' && (
          <JudgePanel />
        )}

        {currentView === 'volunteer' && (
          <VolunteerDashboard />
        )}

        {currentView === 'admin' && (
          <AdminDashboard />
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardPage />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Bottom Mobile App Bar (Fixed 5-Key Navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-navy text-white border-t border-navy-light/40 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-lg">
        <button
          onClick={() => setCurrentView('landing')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'landing' ? 'text-orange-400 bg-white/10' : 'text-gray-400'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentView('events')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'events' ? 'text-orange-400 bg-white/10' : 'text-gray-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Events</span>
        </button>

        <button
          onClick={() => setCurrentView('register')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-black transition-all ${
            currentView === 'register' 
              ? 'text-white bg-orange-500 shadow-md scale-105' 
              : 'text-orange-400 bg-orange-500/10'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Register</span>
        </button>

        <button
          onClick={() => setCurrentView('leaderboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'leaderboard' ? 'text-orange-400 bg-white/10' : 'text-gray-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Board</span>
        </button>

        <button
          onClick={() => {
            setCurrentView(
              role === 'admin' ? 'admin' : 
              role === 'judge' ? 'judge' : 
              role === 'volunteer' ? 'volunteer' : 
              'dashboard'
            );
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[10px] font-bold transition-colors ${
            currentView === 'dashboard' || currentView === 'judge' || currentView === 'volunteer' || currentView === 'admin' 
              ? 'text-orange-400 bg-white/10' 
              : 'text-gray-400'
          }`}
        >
          {role === 'admin' ? (
            <ShieldCheck className="w-4 h-4" />
          ) : role === 'judge' ? (
            <Gavel className="w-4 h-4" />
          ) : role === 'volunteer' ? (
            <HeartHandshake className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span>
            {role === 'admin' ? 'Admin' : 
             role === 'judge' ? 'Judge' : 
             role === 'volunteer' ? 'Volunteer' : 
             'Portal'}
          </span>
        </button>
      </div>

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 z-30 w-11 h-11 rounded-full bg-navy hover:bg-navy-light text-white shadow-2xl border border-white/20 flex items-center justify-center transition-all hover:scale-110 active:scale-95 backdrop-blur-md cursor-pointer group"
          aria-label="Scroll back to top"
        >
          <ArrowUp className="w-5 h-5 text-orange-400 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

      {/* Supabase Authentication & Registration Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CrossFireApp />
    </AuthProvider>
  );
};

export default App;
