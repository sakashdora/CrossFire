import React, { useState, useEffect, useRef } from 'react';
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
  UserPlus,
  CheckCheck
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openAuthModal: (mode: 'login' | 'register') => void;
  onReplayIntro?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal
}) => {
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  
  // Track scroll position smoothly without layout shift
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: null },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  return (
    <>
      {/* Fixed Full-Width Modern Glass Navbar (Zero layout shifting, zero jitter) */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${
          scrolled 
            ? 'bg-[#000d1a]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]' 
            : 'bg-[#000d1a]/40 backdrop-blur-md border-b border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            
            {/* Brand Logo */}
            <div 
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }} 
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center border border-white/20">
                  <img src="/Logo.png" alt="CrossFire Logo" className="w-full h-full object-contain" />
                </div>
                {/* Micro-interaction glowing pulse */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#000d1a] animate-pulse" />
              </div>

              {/* Responsive Text morph */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-wider text-white">
                    CROSS<span className="text-cyan-400">FIRE</span>
                  </span>
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[10px] font-black px-1.5 py-0.5 rounded hidden sm:inline-block">
                    2026
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation (Center Pills) */}
            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 h-full">
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className="relative px-5 py-2 text-sm font-semibold rounded-full group outline-none transition-colors"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav_highlight"
                          className="absolute inset-0 bg-blue-600/30 rounded-full border border-cyan-400/40 shadow-[0_0_15px_rgba(0,198,255,0.3)]"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-2 transition-colors duration-200 ${isActive ? 'text-cyan-200 font-bold' : 'text-gray-300 group-hover:text-white'}`}>
                        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : ''}`} />}
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Dynamic Register CTA (Desktop) */}
              <button
                onClick={() => setCurrentView('register')}
                className="hidden lg:flex relative overflow-hidden items-center gap-2 px-5 py-2 rounded-full font-bold group border border-cyan-400/40 shadow-[0_0_20px_rgba(0,136,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 transition-transform duration-500 group-hover:scale-105" />
                
                {/* Animated light sweep across button */}
                <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[sweep_3s_infinite]" />
                
                <span className="relative z-10 flex items-center gap-2 text-white text-sm font-extrabold">
                  <UserPlus className="w-4 h-4" />
                  Register Now
                </span>
              </button>



              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#000d1a] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Working Notifications Dropdown UI */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 text-gray-800"
                    >
                      <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-orange-500" />
                          <span className="font-black text-sm text-navy">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-gray-400 font-medium">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((item) => (
                            <div
                              key={item.id}
                              onClick={() => markAsRead(item.id)}
                              className={`p-3.5 hover:bg-orange-50/50 transition-colors cursor-pointer ${!item.read_at ? 'bg-orange-50/30' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-xs font-bold text-navy leading-tight">{item.title}</h4>
                                {!item.read_at && (
                                  <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 mt-1 leading-normal">{item.message}</p>
                              <span className="text-[10px] text-gray-400 mt-1.5 block">
                                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile / Access */}
              {user ? (
                <div className="relative" ref={userRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-sm font-bold transition-all border border-white/10 hover:border-white/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black shadow-inner">
                      {user.first_name?.[0] || 'U'}
                    </div>
                    <span className="hidden sm:block tracking-wide">{user.first_name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.18 }}
                        className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 text-gray-800"
                      >
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="font-bold text-sm text-navy">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setCurrentView(role === 'admin' ? 'admin' : role === 'judge' ? 'judge' : role === 'volunteer' ? 'volunteer' : 'dashboard');
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Open My Portal
                          </button>
                        </div>

                        <div className="border-t border-gray-100 pt-2 pb-1">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="w-full text-left px-5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center">
                  <button
                    onClick={() => openAuthModal('login')}
                    className="px-4 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Working Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="lg:hidden border-t border-white/10 bg-[#000d1a]/98 backdrop-blur-2xl px-4 py-5 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setCurrentView(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all text-left ${
                        isActive 
                          ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,198,255,0.2)]' 
                          : 'text-gray-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {Icon && <Icon className="w-4 h-4 text-cyan-400 shrink-0" />}
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setCurrentView('register');
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm shadow-lg shadow-blue-500/30 active:scale-98 transition-transform border border-cyan-400/40"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register Free in 60s</span>
                </button>



                {/* User Status / Quick Auth in Mobile Menu */}
                <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                  {user ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs">
                          {user.first_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{user.first_name} {user.last_name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          logout();
                        }}
                        className="text-xs text-red-400 font-bold hover:underline px-2 py-1"
                      >
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 w-full">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          openAuthModal('login');
                        }}
                        className="flex-1 py-2.5 text-center rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-colors"
                      >
                        Sign In
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      
      {/* Global CSS for Sweep Animation */}
      <style>{`
        @keyframes sweep {
          0% { left: -100%; }
          30% { left: 200%; }
          100% { left: 200%; }
        }
      `}</style>
    </>
  );
};
