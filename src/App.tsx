import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventsProvider, useEvents } from './context/EventsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CinematicIntro } from './components/CinematicIntro';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { EventsDiscoveryPage } from './pages/EventsDiscoveryPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { JudgePanel } from './pages/JudgePanel';
import { AdminDashboard } from './pages/AdminDashboard';
import { VolunteerDashboard } from './pages/VolunteerDashboard';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { EventItem } from './types';

import { Home, Calendar, Trophy, User, ShieldCheck, Gavel, UserPlus, HeartHandshake, ArrowUp } from 'lucide-react';

import { ShieldAlert } from 'lucide-react';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, role, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Authenticating...</p>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center border border-gray-100">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-navy mb-2">Access Denied</h2>
        <p className="text-gray-600 text-sm mb-6">You must be signed in to view this portal.</p>
        <button 
          onClick={() => window.location.hash = 'landing'} 
          className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }
  
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl text-center border border-gray-100">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-navy mb-2">Unauthorized Request</h2>
        <p className="text-gray-600 text-sm mb-6">Your current role ({role}) does not have permission to access this area.</p>
        <button 
          onClick={() => window.location.hash = 'landing'} 
          className="px-6 py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

const CrossFireApp: React.FC = () => {
  const { role } = useAuth();
  const [currentView, setCurrentView] = useState<string>(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'landing';
  });

  useEffect(() => {
    window.location.hash = currentView;
  }, [currentView]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentView(hash || 'landing');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Cinematic Opening Screen State (Always-On on every page load / refresh)
  const [showIntro, setShowIntro] = useState<boolean>(true);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  // Auto scroll to top on any page view transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

  const { userRegistrations, handleRegisterEvent, handleWithdrawEvent, handleSubmitMedia, refreshRegistrations } = useEvents();



  const handleGoogleFormRegistrationSuccess = async (_selectedEvents?: EventItem[]) => {
    // For real implementation, form submits events to Supabase directly
    // Then we just refresh the registrations
    if (refreshRegistrations) {
       await refreshRegistrations();
    }
  };



  const openAuth = (mode: 'login' | 'register') => {
    if (mode === 'register') {
      setCurrentView('register');
      return;
    }
    setAuthModalOpen(true);
  };

  const handleSelectEvent = (_event: EventItem) => {
    setCurrentView('events');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-gray-900 pb-20 lg:pb-0">
      
      {/* Cinematic Opening Screen: SAGS x CROSSFIRE */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Top Navbar */}
      <Navbar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={openAuth}
        onReplayIntro={handleReplayIntro}
      />

      {/* Main View Router */}
      <main className={`flex-grow pb-24 lg:pb-12 min-h-[75vh] ${currentView !== 'landing' ? 'pt-16 sm:pt-[72px]' : ''}`}>
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
          <ProtectedRoute allowedRoles={['student', 'admin', 'super_admin']}>
            <StudentDashboard
              userRegistrations={userRegistrations}
              onWithdrawEvent={handleWithdrawEvent}
              onSubmitMedia={handleSubmitMedia}
              setCurrentView={setCurrentView}
            />
          </ProtectedRoute>
        )}

        {currentView === 'judge' && (
          <ProtectedRoute allowedRoles={['judge', 'admin', 'super_admin']}>
            <JudgePanel />
          </ProtectedRoute>
        )}

        {currentView === 'volunteer' && (
          <ProtectedRoute allowedRoles={['volunteer', 'admin', 'super_admin']}>
            <VolunteerDashboard />
          </ProtectedRoute>
        )}

        {currentView === 'admin' && (
          <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        )}

        {currentView === 'leaderboard' && (
          <LeaderboardPage />
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

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
              (role === 'admin' || role === 'super_admin') ? 'admin' : 
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
          {(role === 'admin' || role === 'super_admin') ? (
            <ShieldCheck className="w-4 h-4" />
          ) : role === 'judge' ? (
            <Gavel className="w-4 h-4" />
          ) : role === 'volunteer' ? (
            <HeartHandshake className="w-4 h-4" />
          ) : (
            <User className="w-4 h-4" />
          )}
          <span>
            {role === 'super_admin' ? 'Super Admin' :
             role === 'admin' ? 'Admin' : 
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

      {/* Portal Sign In Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <EventsProvider>
        <CrossFireApp />
      </EventsProvider>
    </AuthProvider>
  );
};

export default App;
