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
  CheckCheck,
  Megaphone,
  MessageSquare,
  Ticket,
  Clock,
  Award,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useNotifications, formatNotificationTime } from '../hooks/useNotifications';
import { NotificationItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import './navigation.css';

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
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread'>('all');

  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsUnread,
    markAllAsRead, 
    deleteNotification, 
    clearAllNotifications, 
    resetToDefaultNotifications 
  } = useNotifications();

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.read_at) {
      markAsRead(item.id);
    }
    if (item.action_view) {
      setCurrentView(item.action_view);
      setNotificationsOpen(false);
    }
  };

  const handleNotificationAction = (item: NotificationItem, e: React.MouseEvent) => {
    e.stopPropagation();
    markAsRead(item.id);
    if (item.action_view) {
      setCurrentView(item.action_view);
      setNotificationsOpen(false);
    }
  };

  const getCategoryIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-3.5 h-3.5 text-cyan-600" />;
      case 'debate_topic':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-600" />;
      case 'registration':
        return <Ticket className="w-3.5 h-3.5 text-emerald-600" />;
      case 'event_reminder':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'score':
        return <Award className="w-3.5 h-3.5 text-orange-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-cyan-600" />;
    }
  };

  const getCategoryBadgeClass = (type: NotificationItem['type']) => {
    switch (type) {
      case 'announcement':
        return 'bg-cyan-50 border-cyan-200 text-cyan-700';
      case 'debate_topic':
        return 'bg-purple-50 border-purple-200 text-purple-700';
      case 'registration':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'event_reminder':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'score':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-700';
    }
  };

  const displayedNotifications = notifications.filter(n => {
    if (notifFilter === 'unread') return !n.read_at;
    return true;
  });
  
  // Track scroll position smoothly without layout shift
  const [scrolled, setScrolled] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    setUserDropdownOpen(false);
  }, [currentView]);

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (notificationsOpen) notificationButtonRef.current?.focus();
      else if (userDropdownOpen) userButtonRef.current?.focus();
      else if (mobileMenuOpen) menuButtonRef.current?.focus();
      setMobileMenuOpen(false);setNotificationsOpen(false);setUserDropdownOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [mobileMenuOpen, notificationsOpen, userDropdownOpen]);

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
          scrolled || currentView !== 'landing'
            ? 'bg-[#000d1a]/90 backdrop-blur-xl border-b border-cyan-500/20 shadow-[0_4px_30px_rgba(0,0,0,0.6)]' 
            : 'bg-[#000d1a]/40 backdrop-blur-md border-b border-white/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            
            {/* Brand Logo */}
            <button
              onClick={() => {
                setCurrentView('landing');
                setMobileMenuOpen(false);
              }} 
              className="cf-navbar-brand flex items-center gap-3 cursor-pointer group select-none shrink-0"
              aria-label="CrossFire home"
            >
              {currentView === 'events' || currentView === 'landing' ? <>
                <img className="cf-events-nav-logo" src="/hero-crossfire-title.png" alt="CrossFire" width="158" height="36" />
                <span className="cf-events-nav-year">2026</span>
              </> : <>
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-white p-1 shadow-lg group-hover:scale-105 transition-transform flex items-center justify-center border border-white/20">
                  <img src="/Logo.png" alt="CrossFire Logo" className="w-full h-full object-contain" />
                </div>
                {/* Micro-interaction glowing pulse */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-[#000d1a] animate-pulse" />
              </div>

              {/* Responsive Text morph */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-wider text-white">
                    CROSSFIRE
                  </span>
                  <span className="px-2 py-0.5 rounded-full border border-cyan-400/50 bg-[#001830] text-cyan-300 text-[10px] font-black tracking-wider shadow-[0_0_10px_rgba(0,212,255,0.25)] hidden sm:inline-block">
                    2026
                  </span>
                </div>
              </div>
              </>}
            </button>

            {/* Desktop Navigation (Center Pills) */}
            <nav aria-label="Main navigation" className="cf-desktop-nav hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2 h-full">
              <div className="flex items-center gap-1 p-1 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <button
                      key={item.id}
                      aria-current={isActive ? 'page' : undefined}
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
            <div className="cf-navbar-actions flex items-center gap-2 sm:gap-3">
              
              {/* Dynamic Register CTA (Desktop) */}
              <button
                onClick={() => setCurrentView('register')}
                className="cf-navbar-register hidden lg:flex relative overflow-hidden items-center gap-2 px-5 py-2 rounded-full font-bold group border border-cyan-400/40 shadow-[0_0_20px_rgba(0,136,255,0.3)]"
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
                  ref={notificationButtonRef}
                  aria-expanded={notificationsOpen}
                  aria-controls="notifications-panel"
                  onClick={() => { setNotificationsOpen(!notificationsOpen); setMobileMenuOpen(false); setUserDropdownOpen(false); }}
                  className="relative p-2.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[17px] h-[17px] px-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-2 ring-[#000d1a] shadow-sm animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {/* Working Dynamic Notifications Dropdown UI */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      id="notifications-panel"
                      className="cf-notification-panel absolute right-0 mt-3 w-84 sm:w-[420px] bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/90 z-50 text-gray-800 flex flex-col"
                    >
                      {/* Top Header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
                            <Bell className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#001F3F]">Notifications</span>
                              {unreadCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 text-[10px] font-black">
                                  {unreadCount} new
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline px-2 py-1 rounded-md hover:bg-orange-50 transition-colors"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Filter & Controls Bar */}
                      <div className="px-4 py-2 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setNotifFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              notifFilter === 'all'
                                ? 'bg-[#001F3F] text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                            }`}
                          >
                            All ({notifications.length})
                          </button>
                          <button
                            onClick={() => setNotifFilter('unread')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                              notifFilter === 'unread'
                                ? 'bg-orange-500 text-white shadow-xs'
                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
                            }`}
                          >
                            Unread ({unreadCount})
                          </button>
                        </div>

                        {notifications.length > 0 && (
                          <button
                            onClick={() => clearAllNotifications()}
                            className="text-[11px] text-gray-400 hover:text-red-600 font-medium transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* Dynamic Notifications Scroll List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100/90 overscroll-contain">
                        {displayedNotifications.length === 0 ? (
                          notifFilter === 'unread' && notifications.length > 0 ? (
                            <div className="py-8 px-6 text-center">
                              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                                <CheckCheck className="w-5 h-5" />
                              </div>
                              <h4 className="text-sm font-bold text-gray-800">You're All Caught Up!</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                No unread circulars. All {notifications.length} notifications are marked read.
                              </p>
                              <button
                                onClick={() => setNotifFilter('all')}
                                className="mt-3 text-xs font-bold text-orange-600 hover:underline"
                              >
                                View All ({notifications.length})
                              </button>
                            </div>
                          ) : (
                            <div className="py-10 px-6 text-center">
                              <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
                                <Bell className="w-6 h-6" />
                              </div>
                              <h4 className="text-sm font-bold text-gray-800">No Notifications Yet</h4>
                              <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                                Official circulars, debate topics, and event schedules will appear dynamically here.
                              </p>
                              <button
                                onClick={() => resetToDefaultNotifications()}
                                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#001F3F] text-white text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Reset Default Circulars</span>
                              </button>
                            </div>
                          )
                        ) : (
                          displayedNotifications.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className={`group relative p-3.5 sm:p-4 text-left hover:bg-orange-50/40 transition-colors cursor-pointer ${
                                !item.read_at ? 'bg-orange-50/25' : 'bg-white'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Category Icon Badge */}
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${getCategoryBadgeClass(
                                    item.type
                                  )}`}
                                >
                                  {getCategoryIcon(item.type)}
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h4 className="text-xs sm:text-sm font-bold text-[#001F3F] leading-snug group-hover:text-orange-600 transition-colors">
                                        {item.title}
                                      </h4>
                                      {item.tag && (
                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
                                          {item.tag}
                                        </span>
                                      )}
                                    </div>

                                    {/* Unread indicator / Dismiss */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      {!item.read_at && (
                                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" title="Unread" />
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteNotification(item.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-opacity"
                                        title="Dismiss notification"
                                        aria-label="Dismiss notification"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  <p className="text-[11px] sm:text-xs text-gray-600 mt-1 leading-relaxed">
                                    {item.message}
                                  </p>

                                  {/* Footer with dynamic relative time and action */}
                                  <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-gray-100/70">
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {formatNotificationTime(item.created_at)}
                                    </span>

                                    {item.action_view ? (
                                      <button
                                        onClick={(e) => handleNotificationAction(item, e)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#001F3F] hover:bg-orange-600 text-white text-[10px] font-bold transition-all shadow-xs"
                                      >
                                        <span>{item.action_label || 'View'}</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          item.read_at ? markAsUnread(item.id) : markAsRead(item.id);
                                        }}
                                        className="text-[10px] text-gray-400 hover:text-gray-700 font-medium hover:underline"
                                      >
                                        {item.read_at ? 'Mark unread' : 'Mark read'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Bottom Status Bar */}
                      <div className="px-4 py-2.5 bg-gray-50/90 border-t border-gray-100 flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                          <span className="text-gray-500 font-semibold truncate">Srusti Academy • CrossFire Feed</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium shrink-0 ml-2">
                          Design and build by <span className="font-bold text-gray-800">"True Inspire"</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User Profile / Access */}
              {user ? (
                <div className="relative" ref={userRef}>
                  <button
                    ref={userButtonRef}
                    aria-label="Account menu"
                    aria-expanded={userDropdownOpen}
                    aria-controls="account-panel"
                    onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotificationsOpen(false); setMobileMenuOpen(false); }}
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
                        id="account-panel"
                        className="cf-user-panel absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 text-gray-800"
                      >
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="font-bold text-sm text-navy">{user.first_name} {user.last_name}</p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        </div>
                        
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              setCurrentView((role === 'admin' || role === 'super_admin') ? 'admin' : role === 'judge' ? 'judge' : role === 'volunteer' ? 'volunteer' : 'dashboard');
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
                <div className="cf-navbar-signin flex items-center">
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
                ref={menuButtonRef}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => { setMobileMenuOpen(!mobileMenuOpen); setNotificationsOpen(false); setUserDropdownOpen(false); }}
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
              id="mobile-menu"
              className="lg:hidden border-t border-white/10 bg-[#000d1a] backdrop-blur-2xl px-4 py-5 shadow-2xl max-h-[calc(100dvh-140px)] overflow-y-auto"
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
                  <span>Register Free</span>
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
