import React, { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EventsProvider, useEvents } from './context/EventsContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { CinematicIntro } from './components/CinematicIntro';
import { LandingPage } from './pages/LandingPage';
import { EventItem } from './types';

import { Home, Calendar, Trophy, User, ShieldCheck, Gavel, UserPlus, HeartHandshake, ArrowUp } from 'lucide-react';

import { ShieldAlert } from 'lucide-react';

const EventsDiscoveryPage = lazy(() => import('./pages/EventsDiscoveryPage').then(module => ({ default: module.EventsDiscoveryPage })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const JudgePanel = lazy(() => import('./pages/JudgePanel').then(module => ({ default: module.JudgePanel })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const VolunteerDashboard = lazy(() => import('./pages/VolunteerDashboard').then(module => ({ default: module.VolunteerDashboard })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const RegistrationPage = lazy(() => import('./pages/RegistrationPage').then(module => ({ default: module.RegistrationPage })));

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
  const { role, user } = useAuth();
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
  const [selectedLandingEvent, setSelectedLandingEvent] = useState<EventItem | null>(null);
  
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  // Only greet visitors arriving at the landing page; deep links stay direct.
  const [showIntro, setShowIntro] = useState(() => currentView === 'landing' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setShowIntro(true);
  }, []);

  // Auto scroll to top on any page view transition
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (currentView !== 'events') setSelectedLandingEvent(null);
    if (currentView !== 'landing') setShowIntro(false);
  }, [currentView]);

  const { userRegistrations, handleWithdrawEvent, handleSubmitMedia, refreshRegistrations } = useEvents();



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

  const handleSelectEvent = (event: EventItem) => {
    setSelectedLandingEvent(event);
    setCurrentView('events');
  };

  return (
    <div className={`min-h-screen flex flex-col text-gray-900 ${currentView === 'events' ? 'cf-events-view' : currentView === 'landing' ? 'cf-landing-view' : ''} ${currentView === 'landing' || currentView === 'events' ? 'bg-[#080e10]' : 'bg-[#F8FAFC]'} pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0`}>
      <a href="#main-content" className="skip-to-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
      
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
      <main id="main-content" tabIndex={-1} className={`flex-grow min-h-[75vh] ${currentView !== 'landing' ? `pt-16 sm:pt-[72px] ${currentView === 'events' ? '' : 'pb-12'}` : ''}`}>
        <Suspense fallback={<div className="min-h-[60vh] grid place-items-center text-slate-500" role="status">Loading page…</div>}>
        {currentView === 'landing' && (
          <LandingPage
            onSelectEvent={handleSelectEvent}
            setCurrentView={setCurrentView}
            introActive={showIntro}
            onReplayIntro={handleReplayIntro}
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
            initialEvent={selectedLandingEvent}
            userRegistrations={userRegistrations}
            onRegister={() => setCurrentView('register')}
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
        </Suspense>
      </main>

      {/* Footer */}
      <Footer setCurrentView={setCurrentView} />

      {/* Bottom Mobile App Bar (Fixed 5-Key Navigation) */}
      <nav aria-label="Mobile navigation" className="mobile-bottom-nav lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#071116] text-white border-t border-white/10 px-2 pt-1.5 flex items-center justify-around shadow-2xl backdrop-blur-lg">
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
            if (!user) { openAuth('login'); return; }
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
      </nav>

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
