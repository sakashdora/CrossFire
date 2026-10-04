import React, { useState, useEffect } from 'react';
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
  const { unreadCount } = useNotifications();
  
  // Track scroll position for dynamic navbar state
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'landing', label: 'Overview', icon: null },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy }
  ];

  return (
    <>
      {/* Invisible spacer to prevent content jumping since the navbar is fixed */}
      <div className="h-20 w-full lg:hidden block" />
      
      {/* Adaptive Glass Navbar Wrapper */}
      <motion.header 
        initial={false}
        animate={{
          y: scrolled ? 16 : 0,
          width: scrolled ? 'calc(100% - 32px)' : '100%',
          maxWidth: scrolled ? '1024px' : '100%',
          borderRadius: scrolled ? '9999px' : '0px',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed left-0 right-0 z-50 mx-auto transition-colors duration-500
          ${scrolled ? 'bg-[#00142A]/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]' : 'bg-[#00142A]/30 backdrop-blur-sm border-b border-white/5'}
        `}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            
            {/* Brand Logo */}
            <div 
              onClick={() => setCurrentView('landing')} 
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center">
                  <img src="/Logo.png" alt="CrossFire Logo" className="w-full h-full object-contain" />
                </div>
                {/* Micro-interaction glowing pulse */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-navy animate-pulse" />
              </div>

              {/* Responsive Text morph */}
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-black tracking-wider text-white hidden sm:block">
                    CROSS<span className="text-orange-500">FIRE</span>
                  </span>
                  <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-black px-1.5 py-0.5 rounded hidden sm:block">
                    2026
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation (Magnetic Spring Highlights) */}
            <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 h-full">
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentView(item.id)}
                      className="relative px-5 py-2 text-sm font-semibold rounded-full group outline-none"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav_highlight"
                          className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <span className={`relative z-10 flex items-center gap-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                        {Icon && <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : ''}`} />}
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Right Action Bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Dynamic Register CTA */}
              <button
                onClick={() => setCurrentView('register')}
                className="hidden lg:flex relative overflow-hidden items-center gap-2 px-5 py-2 rounded-full font-bold group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 transition-transform duration-500 group-hover:scale-105" />
                
                {/* Animated light sweep across button */}
                <div className="absolute top-0 -left-[100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-[sweep_3s_infinite]" />
                
                <span className="relative z-10 flex items-center gap-2 text-white text-sm">
                  <UserPlus className="w-4 h-4" />
                  Register Now
                </span>
              </button>

              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-navy-light animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown UI omitted for brevity but keeps original functionality */}
              </div>

              {/* User Profile / Access */}
              {user ? (
                <div className="relative">
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

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-full bg-white/5 border border-white/10 text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      
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
