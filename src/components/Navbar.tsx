import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Calendar, 
  LayoutDashboard, 
  Bell, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  UserPlus 
} from 'lucide-react';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal
}) => {
  const { user, role, logout, switchRoleForTesting } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  return (
    <header className="sticky top-0 z-50 bg-[#001F3F] text-white shadow-xl border-b border-navy-light/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo with Crossfire + Srusti College Emblem */}
          <div 
            onClick={() => setCurrentView('landing')} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer group select-none shrink-0"
          >
            {/* Srusti College Official Logo */}
            <div className="h-9 sm:h-11 px-1.5 py-0.5 rounded-xl bg-white shadow-sm flex items-center justify-center border border-white/20 shrink-0">
              <img 
                src="/collegeLogo.jpeg" 
                alt="Srusti College Logo" 
                className="h-full object-contain" 
              />
            </div>

            <div className="relative shrink-0">
              {/* CrossFire Event Logo with glowing pulse */}
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-white p-1 shadow-md ring-2 ring-orange-500/50 group-hover:ring-orange-500 group-hover:scale-105 transition-all flex items-center justify-center">
                <img 
                  src="/Logo.png" 
                  alt="CrossFire Logo" 
                  className="w-full h-full object-contain" 
                />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-orange-500 rounded-full border-2 border-navy animate-pulse"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-2xl font-black tracking-wider text-white">
                  CROSS<span className="text-orange-500">FIRE</span>
                </span>
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded">
                  2026
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-300 font-medium tracking-tight hidden sm:block truncate max-w-[280px]">
                Srusti Academy of Management & Technology
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setCurrentView('landing')}
              className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'landing' ? 'text-orange-400 bg-white/10' : 'text-gray-200 hover:text-white hover:bg-white/5'
              }`}
            >
              Overview
            </button>

            <button
              onClick={() => setCurrentView('events')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'events' ? 'text-orange-400 bg-white/10' : 'text-gray-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Events (6 Tracks)</span>
            </button>

            <button
              onClick={() => setCurrentView('register')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                currentView === 'register' 
                  ? 'text-white bg-orange-500 shadow-md' 
                  : 'text-orange-400 hover:text-white hover:bg-orange-500/20'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
            </button>

            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentView === 'leaderboard' ? 'text-orange-400 bg-white/10' : 'text-gray-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Live Leaderboard</span>
            </button>
          </nav>

          {/* Role Access Center (Removed per role-aware requirement) */}

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-gray-200 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-bold text-navy text-xs sm:text-sm">Campus Alerts & Topics</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-orange-600 hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.map((item) => (
                      <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-xs text-navy">{item.title}</p>
                          <span className="text-[10px] text-gray-400 font-medium">Nov 15</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Login CTA */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-navy-light/60 hover:bg-navy-light text-white text-xs font-bold transition-all border border-white/10"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shadow-inner">
                    {user.first_name?.[0] || 'U'}
                  </div>
                  <span className="max-w-[150px] truncate hidden sm:flex items-center gap-1.5">
                    <span className="text-[10px] uppercase text-orange-400 font-black">[{role}]</span>
                    <span>{user.first_name}</span>
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 text-gray-800">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-bold text-xs sm:text-sm text-navy truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                        {role} Mode
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentView(role === 'admin' ? 'admin' : role === 'judge' ? 'judge' : role === 'volunteer' ? 'volunteer' : 'dashboard');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-orange-500" />
                      <span>Open My Portal</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        setCurrentView('register');
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      <span>Registration Form</span>
                    </button>

                    {/* Switch Persona Grid */}
                    <div className="p-2 border-t border-gray-100 bg-gray-50/80 my-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block px-2 mb-1.5">
                        Switch Persona (Testing)
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            switchRoleForTesting('student');
                            setCurrentView('dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className={`p-1.5 rounded-lg text-left font-bold transition-colors cursor-pointer ${
                            role === 'student' ? 'bg-orange-500 text-white' : 'hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          Student
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            switchRoleForTesting('volunteer');
                            setCurrentView('volunteer');
                            setUserDropdownOpen(false);
                          }}
                          className={`p-1.5 rounded-lg text-left font-bold transition-colors cursor-pointer ${
                            role === 'volunteer' ? 'bg-emerald-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          Volunteer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            switchRoleForTesting('judge');
                            setCurrentView('judge');
                            setUserDropdownOpen(false);
                          }}
                          className={`p-1.5 rounded-lg text-left font-bold transition-colors cursor-pointer ${
                            role === 'judge' ? 'bg-purple-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          Judge
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            switchRoleForTesting('admin');
                            setCurrentView('admin');
                            setUserDropdownOpen(false);
                          }}
                          className={`p-1.5 rounded-lg text-left font-bold transition-colors cursor-pointer ${
                            role === 'admin' ? 'bg-blue-600 text-white' : 'hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          Admin
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-bold text-gray-200 hover:text-white cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black shadow-md hover:shadow-orange-500/30 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register Free</span>
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-navy-dark border-t border-navy-light/30 px-4 pt-3 pb-6 space-y-3 animate-fadeIn">
          
          {/* Quick Persona Switcher in Mobile Drawer */}
          <div className="bg-black/30 p-2.5 rounded-2xl border border-white/10 space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Switch Persona (Testing)
            </span>
            <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
              {(['student', 'volunteer', 'judge', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchRoleForTesting(r);
                    setCurrentView(r === 'student' ? 'dashboard' : r);
                    setMobileMenuOpen(false);
                  }}
                  className={`py-1.5 rounded-lg capitalize transition-colors text-center cursor-pointer ${
                    role === r 
                      ? 'bg-orange-500 text-white shadow-sm' 
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              currentView === 'landing' ? 'bg-orange-500 text-white' : 'text-gray-200 hover:bg-white/5'
            }`}
          >
            Overview
          </button>

          <button
            onClick={() => { setCurrentView('events'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              currentView === 'events' ? 'bg-orange-500 text-white' : 'text-gray-200 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Events (6 Tracks)</span>
          </button>

          <button
            onClick={() => { setCurrentView('register'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black cursor-pointer ${
              currentView === 'register' ? 'bg-orange-500 text-white' : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Student Registration Form</span>
            </div>
            <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">New</span>
          </button>

          <button
            onClick={() => { setCurrentView('leaderboard'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer ${
              currentView === 'leaderboard' ? 'bg-orange-500 text-white' : 'text-gray-200 hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Live Leaderboard</span>
          </button>

          <button
            onClick={() => {
              setCurrentView(role === 'admin' ? 'admin' : role === 'judge' ? 'judge' : role === 'volunteer' ? 'volunteer' : 'dashboard');
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-gray-200 hover:bg-white/5 cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-orange-500" />
            <span>My {role === 'admin' ? 'Admin' : role === 'judge' ? 'Judge' : role === 'volunteer' ? 'Volunteer' : 'Student'} Portal</span>
          </button>
        </div>
      )}
    </header>
  );
};
