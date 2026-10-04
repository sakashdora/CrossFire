import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Trophy, 
  Upload, 
  CheckCircle, 
  Clock, 
  Trash2, 
  Bell, 
  School, 
  Calendar, 
  PlusCircle,
  MapPin, 
  Utensils, 
  Compass, 
  Sparkles,
  Printer,
  QrCode,
  Copy,
  Check,
  Wifi,
  Phone,
  X,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

interface StudentDashboardProps {
  userRegistrations: Registration[];
  onWithdrawEvent: (registrationId: string) => void;
  onSubmitMedia: (registrationId: string, url: string) => void;
  setCurrentView: (view: string) => void;
}

interface CampusVenue {
  id: string;
  name: string;
  block: string;
  floor: string;
  events: string[];
  coordinator: string;
  phone: string;
  status: 'Open' | 'Check-in Live' | 'Evaluating';
  capacity: string;
}

const CAMPUS_VENUES: CampusVenue[] = [
  {
    id: 'auditorium-a',
    name: 'Auditorium A',
    block: 'Main Academic Block',
    floor: 'Ground Floor',
    events: ['Intelect Odyssey (Quiz)'],
    coordinator: 'Prof. S. K. Mishra',
    phone: '+91 94370 12345',
    status: 'Check-in Live',
    capacity: '400 Seats (Full AC)'
  },
  {
    id: 'amphitheatre',
    name: 'Srusti Open Amphitheatre',
    block: 'Central Courtyard East',
    floor: 'Ground Level',
    events: ["Glam 'n' Dazzle (Ramp Walk)"],
    coordinator: 'Prof. R. Mohapatra',
    phone: '+91 98610 54321',
    status: 'Open',
    capacity: '800 Standing / Seated'
  },
  {
    id: 'seminar-hall',
    name: 'Management Seminar Hall 1',
    block: 'Management Wing',
    floor: '1st Floor',
    events: ['Spontanity Erena (Extempore/Debate)'],
    coordinator: 'Dr. P. R. Das',
    phone: '+91 94371 98765',
    status: 'Open',
    capacity: '150 Seats'
  },
  {
    id: 'comp-lab-2',
    name: 'Advanced Computing Lab 2',
    block: 'IT & Tech Wing',
    floor: '2nd Floor',
    events: ['Shorts / Reels Screening', 'Spectrum on Canvas Digital Review'],
    coordinator: 'Er. A. Mohanty',
    phone: '+91 99380 67890',
    status: 'Evaluating',
    capacity: '90 High-End Terminals'
  },
  {
    id: 'dining-courtyard',
    name: 'Dining Courtyard & Cafeteria',
    block: 'Student Recreation Wing',
    floor: 'Ground Floor',
    events: ['Complimentary Student & Teacher Lunch (01:00 PM - 02:00 PM)'],
    coordinator: 'Mr. B. Nayak (Catering Lead)',
    phone: '+91 93370 11223',
    status: 'Open',
    capacity: '6 Food Counters (Veg & Non-Veg)'
  },
  {
    id: 'gate-1',
    name: 'Security Gate 1 & Welcome Desk',
    block: 'Campus Main Entrance',
    floor: 'Ground Level',
    events: ['Entry QR Badge Verification, Kit Collection & Teacher Escorts'],
    coordinator: 'Student Volunteer Helpdesk',
    phone: '+91 94370 00000',
    status: 'Open',
    capacity: 'All Registered Delegates'
  }
];

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userRegistrations,
  onWithdrawEvent,
  onSubmitMedia,
  setCurrentView,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tracks' | 'schedule' | 'venues' | 'alerts' | 'essentials'>('tracks');
  
  // Modals state
  const [showPassModal, setShowPassModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState<CampusVenue | null>(null);
  const [mediaModalRegId, setMediaModalRegId] = useState<string | null>(null);
  const [mediaLink, setMediaLink] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  
  // Copy feedback state
  const [copiedPassId, setCopiedPassId] = useState(false);
  const [copiedWifi, setCopiedWifi] = useState(false);

  const { notifications } = useNotifications();

  const handleMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaModalRegId || !mediaLink.trim()) return;

    onSubmitMedia(mediaModalRegId, mediaLink.trim());
    setUploadSuccess(true);
    setTimeout(() => {
      setMediaModalRegId(null);
      setMediaLink('');
      setUploadSuccess(false);
    }, 1200);
  };

  const copyToClipboard = (text: string, type: 'pass' | 'wifi') => {
    navigator.clipboard.writeText(text);
    if (type === 'pass') {
      setCopiedPassId(true);
      setTimeout(() => setCopiedPassId(false), 2000);
    } else {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

      {/* SECTION 1: DIGITAL EVENT PASS & QUICK ID CARD */}
      <div className="bg-gradient-to-br from-[#00142B] via-[#0A2540] to-[#001020] rounded-3xl p-5 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-white/10">
        {/* Ambient lighting glows */}
        <div className="absolute top-0 right-0 w-80 sm:w-96 h-80 sm:h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Student Dossier */}
          <div className="space-y-3.5 text-center lg:text-left w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Official Competitor Pass • Srusti Academy CrossFire 2026</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center lg:justify-start">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white font-black text-2xl flex items-center justify-center shadow-lg border-2 border-white/20">
                {user?.first_name?.[0] || 'C'}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {user?.first_name} {user?.last_name || 'Competitor'}
                </h1>
                <p className="text-xs text-orange-300 font-semibold mt-0.5">
                  Verified Candidate • Roll Pass #{passId}
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                <School className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <strong className="text-white">{user?.institute_name || user?.school_name || 'DAV Public School'}</strong>
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-white font-bold">
                {user?.course_stream || '12th Science'}
              </span>
              <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg text-gray-300">
                City: <strong className="text-white">{user?.city_town || 'Bhubaneswar'}</strong>
              </span>
            </div>

            {/* Badges & Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-3">
              <button
                onClick={() => setShowMealModal(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
                title="Click to view food voucher QR code"
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.food_preference || 'Veg'} Lunch Token Active</span>
              </button>

              <button
                onClick={() => copyToClipboard(passId, 'pass')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-gray-200 border border-white/15 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Copy Official Pass ID"
              >
                {copiedPassId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPassId ? 'Copied ID!' : `ID: ${passId}`}</span>
              </button>

              <button
                onClick={() => setShowPassModal(true)}
                className="px-4 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/30 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Official Admit Pass</span>
              </button>
            </div>
          </div>

          {/* QR Code Pass Box (Touch to enlarge) */}
          <div 
            onClick={() => setShowPassModal(true)}
            className="bg-white text-navy p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col items-center text-center cursor-pointer hover:scale-105 transition-transform group shrink-0"
            title="Tap to open full-screen entry pass badge"
          >
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-center relative">
              {/* Simulated QR Code with high contrast */}
              <div className="grid grid-cols-5 gap-1 w-full h-full p-0.5">
                <div className="bg-navy rounded-sm col-span-2 row-span-2" />
                <div className="bg-transparent" />
                <div className="bg-navy rounded-sm col-span-2 row-span-2" />
                <div className="bg-navy rounded-sm" />
                <div className="bg-orange-500 rounded-sm" />
                <div className="bg-navy rounded-sm" />
                <div className="bg-navy rounded-sm" />
                <div className="bg-orange-500 rounded-sm" />
                <div className="bg-navy rounded-sm col-span-2 row-span-2" />
                <div className="bg-transparent" />
                <div className="bg-navy rounded-sm col-span-2 row-span-2" />
              </div>
              <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                <QrCode className="w-8 h-8 text-orange-600 drop-shadow" />
              </div>
            </div>
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider mt-2 block group-hover:text-orange-600 transition-colors">
              Tap for Gate QR
            </span>
          </div>

        </div>
      </div>

      {/* QUICK STATS SUMMARY BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-orange-500" />
          </div>
          <div className="min-w-0">
            <span className="text-lg sm:text-xl font-black text-navy block leading-none">
              {userRegistrations.length} / 2 Tracks
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">
              {userRegistrations.length === 2 ? 'Slots Full' : '1 Slot Left'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <span className="text-lg sm:text-xl font-black text-emerald-800 block leading-none truncate">
              {user?.food_preference || 'Veg'} Thali
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">
              Complimentary Meal
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <span className="text-lg sm:text-xl font-black text-navy block leading-none">
              08:30 AM
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">
              Reporting at Gate 1
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <div className="min-w-0">
            <span className="text-lg sm:text-xl font-black text-navy block leading-none">
              ₹81,000+
            </span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-1 block truncate">
              Total Cash Prize Pool
            </span>
          </div>
        </div>
      </div>

      {/* MOBILE-RESPONSIVE SEGMENTED TABS */}
      <div className="flex items-center gap-1 sm:gap-2 p-1.5 rounded-2xl bg-gray-100 border border-gray-200/80 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('tracks')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'tracks'
              ? 'bg-white text-navy shadow-sm border border-gray-200/60'
              : 'text-gray-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <Compass className="w-4 h-4 text-orange-500" />
          <span>My Events ({userRegistrations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-white text-navy shadow-sm border border-gray-200/60'
              : 'text-gray-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <Calendar className="w-4 h-4 text-orange-500" />
          <span>Campus Timeline</span>
        </button>

        <button
          onClick={() => setActiveTab('venues')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'venues'
              ? 'bg-white text-navy shadow-sm border border-gray-200/60'
              : 'text-gray-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <MapPin className="w-4 h-4 text-orange-500" />
          <span>Venues & Rooms</span>
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'alerts'
              ? 'bg-white text-navy shadow-sm border border-gray-200/60'
              : 'text-gray-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <Bell className="w-4 h-4 text-orange-500" />
          <span>Alerts</span>
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
        </button>

        <button
          onClick={() => setActiveTab('essentials')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
            activeTab === 'essentials'
              ? 'bg-white text-navy shadow-sm border border-gray-200/60'
              : 'text-gray-500 hover:text-navy hover:bg-white/50'
          }`}
        >
          <Wifi className="w-4 h-4 text-orange-500" />
          <span>WiFi & Helpdesk</span>
        </button>
      </div>

      {/* TAB 1: MY REGISTERED TRACKS & ROOM GUIDE */}
      {activeTab === 'tracks' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-navy flex items-center gap-2">
                <Compass className="w-6 h-6 text-orange-500 shrink-0" />
                <span>My Competitive Tracks & Reporting Status</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Stage allocations, evaluation status, and reporting schedules for your registered competitions.
              </p>
            </div>

            {userRegistrations.length < 2 && (
              <button
                onClick={() => setCurrentView('events')}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer hover:scale-105 active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add 2nd Track ({userRegistrations.length}/2)</span>
              </button>
            )}
          </div>

          {userRegistrations.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <Trophy className="w-12 h-12 text-orange-400 mx-auto" />
              <h3 className="text-lg font-bold text-navy">No Events Registered Yet</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                You can choose up to 2 competitions across Group A and Group B. Complete your registration to lock your slots!
              </p>
              <button
                onClick={() => setCurrentView('register')}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Open Registration Form
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {userRegistrations.map((reg, index) => {
                const event = reg.event;
                const isMediaRequired = event?.slug === 'reels' || event?.slug === 'poster-making';

                return (
                  <div
                    key={reg.id}
                    className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
                            Track #{index + 1} • {event?.group || 'Group A'}
                          </span>
                          <h3 className="text-lg sm:text-xl font-black text-navy mt-1.5">{event?.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{event?.description}</p>
                        </div>

                        {reg.score !== undefined && reg.score !== null ? (
                          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right shrink-0">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Official Score</span>
                            <span className="text-lg font-black text-emerald-800">{reg.score} / 100</span>
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                            Awaiting Call
                          </span>
                        )}
                      </div>

                      {/* Milestone Progress Tracker */}
                      <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between text-[10px] font-bold text-gray-500 mb-1.5">
                          <span className="text-emerald-700 font-black">1. Registered ✓</span>
                          <span className="text-navy font-bold">2. Gate Scan</span>
                          <span>3. Stage</span>
                          <span>4. Result</span>
                        </div>
                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: reg.score ? '100%' : '50%' }}
                          />
                        </div>
                      </div>

                      {/* Room & Venue Assignment Card */}
                      <div className="p-4 rounded-2xl bg-navy-50/80 border border-navy-100 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500 font-bold flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            Assigned Stage & Room:
                          </span>
                          <span className="text-navy font-black text-xs sm:text-sm text-right">
                            {event?.venue_location}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-navy-100/60">
                          <span className="text-gray-500 font-bold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            Reporting Window:
                          </span>
                          <span className="text-navy font-bold">
                            Nov 15 • 09:15 AM
                          </span>
                        </div>
                      </div>

                      {/* Media Upload Area for Reels / Poster */}
                      {isMediaRequired && (
                        <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between gap-3 text-xs">
                          <div className="min-w-0">
                            <strong className="text-navy block truncate">
                              {event?.slug === 'reels' ? 'Reel Video Link' : 'Digital Poster Artwork'}
                            </strong>
                            <span className="text-[11px] text-gray-500 block truncate">
                              {reg.media_url ? `✓ Uploaded: ${reg.media_url}` : 'Submission deadline: Nov 14, 06:00 PM'}
                            </span>
                          </div>

                          <button
                            onClick={() => setMediaModalRegId(reg.id)}
                            className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>{reg.media_url ? 'Replace' : 'Upload'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                      <span className="text-gray-400 text-[11px]">
                        Format: <strong className="text-navy">{event?.event_type === 'solo' ? 'Individual (Solo)' : `Team (${event?.team_size} Members)`}</strong>
                      </span>

                      <button
                        onClick={() => {
                          if (confirm('Withdraw from this event? Your slot will be released.')) {
                            onWithdrawEvent(reg.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Withdraw</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CAMPUS EVENT TIMELINE */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-navy flex items-center gap-2">
              <Calendar className="w-6 h-6 text-orange-500" />
              <span>Full Day Master Schedule • Sunday, November 15, 2026</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Synchronized timings for stage inaugurations, competitions, complimentary lunch, and grand prize distribution.
            </p>
          </div>

          <div className="divide-y divide-gray-100 text-xs sm:text-sm">
            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                <strong className="text-gray-900 text-sm">08:30 AM - 09:30 AM</strong>
              </div>
              <span className="text-gray-600 sm:text-right">Campus Entry, Security QR Badge Scanning & Welcome Kit at Gate 1</span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></span>
                <strong className="text-orange-600 text-sm">09:30 AM - 11:30 AM</strong>
              </div>
              <span className="text-navy font-bold sm:text-right">Intelect Odyssey (Quiz Preliminary & Buzzer Finals) — Auditorium A</span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                <strong className="text-navy text-sm">11:30 AM - 01:00 PM</strong>
              </div>
              <span className="text-navy font-bold sm:text-right">Glam 'n' Dazzle (Ramp Walk & Traditional Attire) — Open Amphitheatre</span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-emerald-50/60 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-600 shrink-0" />
                <strong className="text-emerald-800 text-sm">01:00 PM - 02:00 PM</strong>
              </div>
              <span className="text-emerald-800 font-black sm:text-right">Complimentary Hot Buffet Lunch for Students & Escorting Teachers (Dining Courtyard)</span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                <strong className="text-navy text-sm">02:00 PM - 03:30 PM</strong>
              </div>
              <span className="text-navy font-bold sm:text-right">Spontanity Erena (Debate) & Spectrum on Canvas (Poster Making)</span>
            </div>

            <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-orange-50/80 p-3 rounded-2xl">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-500 shrink-0" />
                <strong className="text-orange-600 text-sm">03:30 PM - 04:30 PM</strong>
              </div>
              <span className="text-orange-700 font-black sm:text-right">Grand Valedictory, ₹81,000+ Cash Handover & College Champions Trophy</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CAMPUS VENUES & ROOM FINDER */}
      {activeTab === 'venues' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-navy flex items-center gap-2">
              <MapPin className="w-6 h-6 text-orange-500" />
              <span>Campus Venue & Stage Locator</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Interactive directory of buildings, floors, stage coordinators, and reporting gates at Srusti Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAMPUS_VENUES.map((venue) => (
              <div 
                key={venue.id} 
                onClick={() => setSelectedVenue(venue)}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      {venue.floor}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {venue.status}
                    </span>
                  </div>

                  <h4 className="text-base font-black text-navy group-hover:text-orange-500 transition-colors">
                    {venue.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">{venue.block}</p>

                  <div className="pt-2 border-t border-gray-100 space-y-1 text-xs">
                    <div className="text-gray-700 font-semibold truncate">
                      {venue.events[0]}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      Capacity: {venue.capacity}
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-orange-600 font-bold">
                  <span>View Details & Contacts</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CAMPUS ANNOUNCEMENTS & LIVE BROADCASTS */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg sm:text-xl font-black text-navy flex items-center gap-2">
              <Bell className="w-6 h-6 text-orange-500" />
              <span>Campus Live Announcements & Directives</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Official circulars from the Organizing Secretary, Faculty Convener, and Security Desk.
            </p>
          </div>

          <div className="space-y-3.5">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 sm:p-5 rounded-2xl bg-navy-50/70 border border-navy-100/80 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-navy text-sm">{n.title}</span>
                    <span className="text-[10px] text-gray-400 font-semibold shrink-0">Nov 15, 2026</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ESSENTIALS & HELP (WIFI, HELPDESK) */}
      {activeTab === 'essentials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          {/* High-Speed Campus WiFi Voucher */}
          <div className="bg-gradient-to-br from-[#0B1E36] to-[#051124] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-white/10 flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider border border-cyan-500/30">
                <Wifi className="w-3.5 h-3.5" />
                <span>Free Student & Teacher 5G WiFi</span>
              </div>
              <h3 className="text-xl font-black text-white">Campus High-Speed Internet Access</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Connect your devices to submit digital media, view live standings, and stream your reels.
              </p>

              <div className="p-4 rounded-2xl bg-white/10 border border-white/15 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Network (SSID):</span>
                  <strong className="text-white font-mono text-sm">Srusti_Guest_Crossfire</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-gray-400">Security Password:</span>
                  <strong className="text-orange-400 font-mono text-sm">Crossfire@2026</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => copyToClipboard('Crossfire@2026', 'wifi')}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-black text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedWifi ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWifi ? 'Password Copied to Clipboard!' : 'Copy WiFi Password'}</span>
            </button>
          </div>

          {/* Emergency & Volunteer Helpdesk */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-200 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-wider border border-orange-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>24/7 Event Control Desk</span>
              </div>
              <h3 className="text-xl font-black text-navy">Volunteer & First-Aid Support</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Need directions, medical assistance, or costume adjustments? Approach any volunteer wearing the official Crossfire badge.
              </p>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Central Helpdesk (Gate 1)</span>
                  <strong className="text-navy">+91 94370 00000</strong>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Medical First-Aid (Health Unit)</span>
                  <strong className="text-navy">Extension: 104</strong>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                  <span className="font-bold text-gray-700">Venue Address</span>
                  <span className="text-gray-500 text-right">Plot 38/1, Chandaka Estate, Bhubaneswar</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('venues')}
              className="w-full py-2.5 rounded-xl bg-navy hover:bg-navy-light text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-orange-400" />
              <span>Explore All Campus Venues</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: OFFICIAL DIGITAL ADMIT PASS (PRINTABLE & DOWNLOADABLE) */}
      {/* ============================================================== */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Actions Header */}
            <div className="px-5 py-3.5 bg-navy text-white flex items-center justify-between shrink-0">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-orange-400">
                <QrCode className="w-4 h-4" />
                <span>Official Digital Admit Card</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow"
                  title="Print this pass"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setShowPassModal(false)}
                  className="p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Pass Body */}
            <div className="p-6 overflow-y-auto space-y-5 bg-white print:p-0">
              
              {/* College & Competition Header */}
              <div className="border-b-2 border-dashed border-gray-200 pb-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-3">
                  <img src="/collegeLogo.jpeg" alt="Srusti Academy" className="h-10 object-contain" />
                  <span className="text-gray-300 font-light">|</span>
                  <img src="/Logo.png" alt="Crossfire 2026" className="h-10 object-contain" />
                </div>
                <h3 className="text-lg font-black text-navy tracking-tight">
                  SRUSTI ACADEMY OF MANAGEMENT & TECHNOLOGY
                </h3>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  CrossFire 2026 • State-Level Talent Hunt • Official Gate Pass
                </p>
              </div>

              {/* Student Identification Profile */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Candidate Name:</span>
                  <strong className="text-navy font-black text-sm">{user?.first_name} {user?.last_name || 'Competitor'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Official Pass ID:</span>
                  <strong className="text-orange-600 font-mono font-black">{passId}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Institution / School:</span>
                  <strong className="text-navy">{user?.institute_name || user?.school_name || 'DAV Public School'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Class & Stream:</span>
                  <strong className="text-navy">{user?.course_stream || '+2 2nd Year Science'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Meal Voucher:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {user?.food_preference || 'Veg'} Buffet Lunch Active
                  </span>
                </div>
              </div>

              {/* Registered Tracks on Pass */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                  Registered Competitions & Venues
                </span>
                {userRegistrations.map((reg, i) => (
                  <div key={reg.id} className="p-3 rounded-xl bg-navy-50/80 border border-navy-100 text-xs flex justify-between items-center">
                    <div>
                      <strong className="text-navy font-black block">{i + 1}. {reg.event?.name}</strong>
                      <span className="text-[11px] text-gray-500">Venue: {reg.event?.venue_location}</span>
                    </div>
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                      09:15 AM
                    </span>
                  </div>
                ))}
              </div>

              {/* Barcode & Security Stamp */}
              <div className="pt-2 text-center space-y-2">
                <div className="flex items-center justify-center gap-1.5 h-10 w-full bg-gray-100 rounded-lg p-1">
                  {[...Array(35)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-full bg-navy ${i % 3 === 0 ? 'w-1.5' : i % 2 === 0 ? 'w-0.5' : 'w-1'}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 font-mono">
                  VERIFIED BY SRUSTI ACADEMY REGISTRATION CELL • PRESENT AT GATE 1
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 text-[11px]">
                Valid with Government ID card
              </span>
              <button
                onClick={() => setShowPassModal(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 rounded-xl cursor-pointer"
              >
                Close Pass
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: INTERACTIVE FOOD TOKEN VOUCHER */}
      {/* ============================================================== */}
      {showMealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-5 border border-gray-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <Utensils className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Official Meal Token Active
              </span>
              <h3 className="text-xl font-black text-navy mt-2">
                {user?.food_preference || 'Veg'} Buffet Lunch
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Scan this voucher at the Dining Courtyard counter between 01:00 PM and 02:00 PM.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 space-y-2">
              <div className="text-2xl font-black text-navy font-mono">
                TOKEN #{passId.slice(-4)}
              </div>
              <p className="text-[11px] text-gray-500 font-semibold">
                Delegate: {user?.first_name} ({user?.institute_name || 'DAV Public School'})
              </p>
            </div>

            <button
              onClick={() => setShowMealModal(false)}
              className="w-full py-2.5 bg-navy hover:bg-navy-light text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Done / Return to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: VENUE DETAIL POPUP */}
      {/* ============================================================== */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {selectedVenue.block}
                </span>
                <h3 className="text-xl font-black text-navy mt-1">{selectedVenue.name}</h3>
                <p className="text-xs text-gray-500">{selectedVenue.floor} • Capacity: {selectedVenue.capacity}</p>
              </div>
              <button
                onClick={() => setSelectedVenue(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Faculty Coordinator:</span>
                <strong className="text-navy">{selectedVenue.coordinator}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Direct Hotline:</span>
                <a href={`tel:${selectedVenue.phone}`} className="text-orange-600 font-bold hover:underline flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{selectedVenue.phone}</span>
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold">Stage Readiness:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {selectedVenue.status}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <strong className="text-navy block">Allocated Competitions:</strong>
              {selectedVenue.events.map((ev, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-orange-50/70 border border-orange-100 text-navy font-bold flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedVenue(null)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
            >
              Close Guide
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: MEDIA UPLOAD MODAL */}
      {/* ============================================================== */}
      {mediaModalRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <h3 className="text-lg font-black text-navy">Upload Competition Media</h3>
            <p className="text-xs text-gray-500">
              Paste your public URL (YouTube Unlisted, Instagram Reel, Google Drive link) for preliminary evaluation:
            </p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Media link confirmed! Evaluator will review prior to finals.</span>
              </div>
            )}

            <form onSubmit={handleMediaSubmit} className="space-y-3">
              <input
                type="url"
                required
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMediaModalRegId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                >
                  Confirm Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
