import React, { useState } from 'react';
import { INITIAL_EVENTS } from '../data/mockData';
import { 
  ShieldCheck, 
  CheckCircle, 
  Send, 
  Download, 
  Gavel, 
  Search, 
  Users, 
  Radio, 
  AlertTriangle, 
  Unlock, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

interface RosterStudent {
  id: string;
  name: string;
  school: string;
  city: string;
  stream: string;
  board: string;
  events: string[];
  contact: string;
  checkedIn: boolean;
  score: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'broadcast' | 'disputes' | 'roster'>('overview');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'debate' | 'quiz' | 'judges'>('all');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'in_app'>('whatsapp');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'Science' | 'Commerce' | 'Arts'>('all');
  const [disputeUnlockedIds, setDisputeUnlockedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const kpis = [
    { label: 'Total Registrations', value: '245 / 300', trend: '81.6% capacity', color: 'text-navy', bg: 'bg-navy-50', icon: <Users className="w-5 h-5 text-navy" /> },
    { label: "Today's Venue Check-in", value: '184', trend: '75.1% Present', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: <CheckCircle className="w-5 h-5 text-emerald-600" /> },
    { label: 'Scoring Completed', value: '4 of 6 Tracks', trend: 'Round 1 Done', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Gavel className="w-5 h-5 text-orange-600" /> },
    { label: 'Prize Budget Active', value: '₹81,000', trend: 'State Pool', color: 'text-purple-700', bg: 'bg-purple-50', icon: <Sparkles className="w-5 h-5 text-purple-600" /> },
  ];

  // Master roster mock
  const [rosterList, setRosterList] = useState<RosterStudent[]>([
    { id: 'CF-101', name: 'Akash Pattnaik', school: 'DAV Public School', city: 'Bhubaneswar', stream: 'Science', board: 'CBSE', events: ['Intelect Odyssey (Quiz)', "Glam 'n' Dazzle"], contact: '+91 9876543210', checkedIn: true, score: 89.5 },
    { id: 'CF-102', name: 'Rohan Mohanty', school: 'BJB English Medium', city: 'Bhubaneswar', stream: 'Science', board: 'CBSE', events: ['Intelect Odyssey (Quiz)'], contact: '+91 9876543211', checkedIn: true, score: 92.0 },
    { id: 'CF-103', name: 'Ananya Dash', school: 'Mothers Public School', city: 'Bhubaneswar', stream: 'Commerce', board: 'CBSE', events: ["Glam 'n' Dazzle"], contact: '+91 9876543212', checkedIn: true, score: 94.5 },
    { id: 'CF-104', name: 'Debasish Swain', school: 'Stewart School', city: 'Cuttack', stream: 'Arts', board: 'ICSE', events: ['Spontanity Erena (Debate)'], contact: '+91 9876543213', checkedIn: false, score: 0 },
    { id: 'CF-105', name: 'Tanvi Agarwal', school: 'SAI International School', city: 'Bhubaneswar', stream: 'Commerce', board: 'CBSE', events: ['Spectrum on Canvas'], contact: '+91 9876543214', checkedIn: true, score: 86.0 },
    { id: 'CF-106', name: 'Siddharth Rout', school: 'BJB Higher Secondary', city: 'Bhubaneswar', stream: 'Science', board: 'CHSE', events: ['Hidden Horizon'], contact: '+91 9876543215', checkedIn: true, score: 91.0 },
    { id: 'CF-107', name: 'Priyanka Tripathy', school: 'KIIT International School', city: 'Bhubaneswar', stream: 'Science', board: 'CBSE', events: ['Spontanity Erena (Debate)'], contact: '+91 9876543216', checkedIn: true, score: 88.0 },
  ]);

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcastSent(true);
    showToast(`Broadcast dispatched via ${broadcastChannel.toUpperCase()} to ${broadcastTarget.toUpperCase()} recipients!`);
    setTimeout(() => {
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 2500);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8,ID,Student Name,Email,School,Board,Stream,Events Registered,Total Score,CheckedIn\n"
        + rosterList.map(r => `${r.id},"${r.name}","${r.name.toLowerCase().replace(/\s+/g, '')}@student.edu.in","${r.school}",${r.board},12th ${r.stream},"${r.events.join('; ')}",${r.score},${r.checkedIn ? 'Yes' : 'No'}`).join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `CrossFire_2026_Master_Roster_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      showToast('Master Roster CSV successfully downloaded!');
    }, 600);
  };

  const handleUnlockScore = (disputeId: string, candidateName: string) => {
    setDisputeUnlockedIds(prev => [...prev, disputeId]);
    showToast(`Score unlocked for ${candidateName}. Assigned judge notified for rubric revision.`);
  };

  const filteredRoster = rosterList.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      student.school.toLowerCase().includes(rosterSearch.toLowerCase()) ||
      student.id.toLowerCase().includes(rosterSearch.toLowerCase());
    const matchesStream = streamFilter === 'all' || student.stream === streamFilter;
    return matchesSearch && matchesStream;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-navy text-white px-4 py-3 rounded-2xl shadow-2xl border border-orange-500/50 flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-[#001F3F] to-[#082d5a] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Super Admin Control Hub
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Operations & Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
            Real-time management for Srusti Academy State-Level Talent Hunt • Campus Live Operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 relative z-10">
          <button
            onClick={() => {
              setRosterList(prev => [...prev]);
              showToast('Refreshed real-time telemetry from registration and gate scanners.');
            }}
            className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Exporting...' : 'Export Master Roster (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-sm space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 block truncate">
                {kpi.label}
              </span>
              <div className="p-1.5 rounded-xl bg-gray-50 border border-gray-100">
                {kpi.icon}
              </div>
            </div>
            <div className={`text-xl sm:text-2xl lg:text-3xl font-black ${kpi.color}`}>
              {kpi.value}
            </div>
            <span className={`text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full ${kpi.bg} ${kpi.color} inline-block`}>
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile-Friendly Navigation Segmented Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('logistics')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'logistics'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Gavel className="w-3.5 h-3.5 text-orange-500" />
          <span>Track Logistics</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'broadcast'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Send className="w-3.5 h-3.5 text-blue-500" />
          <span>Broadcast Desk</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Disputes & Overrides (2)</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-emerald-500" />
          <span>Student Roster ({rosterList.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stream Demographics Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
              <h3 className="text-sm sm:text-base font-black text-navy flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>+2 Academic Stream Demographics</span>
              </h3>
              <span className="text-xs text-gray-400 font-medium">Google Form Cohort Breakdown</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-900">12th Science</span>
                  <span className="text-xs font-black text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded-full">58.0%</span>
                </div>
                <div className="text-2xl font-black text-blue-950">142 Students</div>
                <div className="w-full bg-blue-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-purple-900">12th Commerce</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-full">27.7%</span>
                </div>
                <div className="text-2xl font-black text-purple-950">68 Students</div>
                <div className="w-full bg-purple-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full transition-all duration-1000" style={{ width: '27.7%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-900">12th Arts</span>
                  <span className="text-xs font-black text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">14.3%</span>
                </div>
                <div className="text-2xl font-black text-amber-950">35 Students</div>
                <div className="w-full bg-amber-200 h-2 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full transition-all duration-1000" style={{ width: '14.3%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Operations Pulse Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Real-Time Check-In Velocity */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-navy flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Gate Check-In Velocity</span>
              </h3>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">184 of 245 Arrived</span>
                <span className="font-black text-navy">75.1%</span>
              </div>
              <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: '75.1%' }}></div>
              </div>
              <p className="text-[11px] text-gray-500">
                Peak morning arrival reached at 09:15 AM. 4 volunteer check-in scanners active at Main Campus Gate.
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-navy flex items-center gap-2">
                <Radio className="w-4 h-4 text-orange-500" />
                <span>Super Admin Quick Directives</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => { setActiveTab('broadcast'); setBroadcastTarget('debate'); setBroadcastMessage('Semi-Finals Debate Topic Announcement: "Should AI be granted autonomy in civil adjudication?"'); }}
                  className="p-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 text-left transition-colors cursor-pointer"
                >
                  📢 Broadcast Debate Topic
                </button>
                <button
                  onClick={() => { setActiveTab('disputes'); }}
                  className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 text-left transition-colors cursor-pointer"
                >
                  ⚖️ Review Score Disputes
                </button>
                <button
                  onClick={() => { setActiveTab('roster'); }}
                  className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 text-left transition-colors cursor-pointer"
                >
                  🔍 Search Participant Pass
                </button>
                <button
                  onClick={handleExportCSV}
                  className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-left transition-colors cursor-pointer"
                >
                  📊 Download CSV Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRACK LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Gavel className="w-5 h-5 text-orange-500" />
                <span>Track Logistics & Assigned Evaluators</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Monitoring room status, registration capacity, and evaluation readiness across 6 competitive tracks.
              </p>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-3">Event Name</th>
                  <th className="py-3 px-3 text-center">Format</th>
                  <th className="py-3 px-3 text-center">Capacity</th>
                  <th className="py-3 px-3">Room Location</th>
                  <th className="py-3 px-3">Assigned Panel</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {INITIAL_EVENTS.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50/80">
                    <td className="py-3.5 px-3 font-bold text-navy">
                      <div>{event.name}</div>
                      <span className="text-[10px] text-gray-400 font-normal">{event.group}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-600">
                      {event.event_type === 'solo' ? 'Solo' : `Team (${event.team_size})`}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="font-bold text-navy">{event.current_participants ?? 0} / {event.max_participants ?? 1}</div>
                      <div className="w-16 bg-gray-100 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-full rounded-full" 
                          style={{ width: `${Math.round(((event.current_participants || 0) / (event.max_participants || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-gray-700 font-medium">
                      {event.venue_location}
                    </td>
                    <td className="py-3.5 px-3 text-gray-700">
                      Dr. M. Senapati & Team
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active Stage ✓
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {INITIAL_EVENTS.map((event) => (
              <div key={event.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-navy text-xs">{event.name}</h4>
                    <span className="text-[10px] text-gray-500">{event.venue_location}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-200/60">
                  <span className="text-gray-500">Format: {event.event_type === 'solo' ? 'Solo' : `Team (${event.team_size})`}</span>
                  <span className="font-bold text-navy">{event.current_participants} / {event.max_participants} registered</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST DESK */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              <span>Instant Broadcast Console</span>
            </h3>
            <p className="text-xs text-gray-500">
              Transmit urgent debate topics, schedule amendments, or score announcements directly to participants via Twilio WhatsApp, SMS, or In-App push.
            </p>

            {broadcastSent && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-bold animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Message broadcasted successfully to all target recipients!</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                  Recipient Audience
                </label>
                <select
                  value={broadcastTarget}
                  onChange={(e) => setBroadcastTarget(e.target.value as any)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-navy"
                >
                  <option value="all">All Registered Students (245)</option>
                  <option value="debate">War of Words Debate Finalists (30)</option>
                  <option value="quiz">Brain Buzz Quiz Teams (44)</option>
                  <option value="judges">Evaluation Judges Panel (8)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastChannel('whatsapp')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      broadcastChannel === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastChannel('sms')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      broadcastChannel === 'sms' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastChannel('in_app')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      broadcastChannel === 'in_app' ? 'bg-navy text-white border-navy' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    In-App Push
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase text-gray-600">
                    Announcement Message
                  </label>
                  <span className="text-[10px] text-gray-400 font-medium">Quick Template Presets</span>
                </div>
                
                {/* Quick Message Templates */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage("Debate Semi-Finals Motion: 'Is generative AI empowering or diluting human critical thinking?' Preparation starts now. Stage: Hall B.")}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-medium"
                  >
                    Debate Motion
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage("Buffet Lunch is now officially served at Campus Dining Hall until 02:30 PM. Please present your digital token.")}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-medium"
                  >
                    Lunch Announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastMessage("Valedictory & Prize Distribution Ceremony starts at 04:30 PM in Main Auditorium A. All participants must report.")}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-medium"
                  >
                    Ceremony Reminder
                  </button>
                </div>

                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Type broadcast text here..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Broadcast Now</span>
              </button>
            </form>
          </div>

          {/* Broadcast Logs */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-navy flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Broadcast Activity Feed</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">WhatsApp • All Students</span>
                  <span className="text-[10px] text-gray-400">09:00 AM</span>
                </div>
                <p className="text-gray-600 text-[11px]">
                  "Welcome to Srusti Campus for Crossfire 2026! Report to Main Registration Desk for admit card barcode scanning."
                </p>
                <span className="text-[10px] font-bold text-emerald-700">Delivered: 245/245 (100%)</span>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy">In-App • Quiz Participants</span>
                  <span className="text-[10px] text-gray-400">10:15 AM</span>
                </div>
                <p className="text-gray-600 text-[11px]">
                  "Quiz Prelims Written Test complete. Buzzer final qualifiers list posted in Auditorium A."
                </p>
                <span className="text-[10px] font-bold text-emerald-700">Delivered: 44/44 (100%)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES & SCORE UNLOCKS */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span>Judge Dispute Desk & Score Override Authority</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Super Admin override powers to unlock evaluated scores if judging appeals or calculation revisions occur.
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy text-sm">Rohan Mohanty & Ayush Dash</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">BJB English Medium</span>
                </div>
                <p className="text-gray-500 text-[11px] mt-1">
                  Track: <strong>Intelect Odyssey (Quiz)</strong> • Locked Score: <strong className="text-navy">92.0 Pts</strong> • Evaluator: Dr. M. Senapati
                </p>
                <p className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                  Appeal Reason: Buzzer latency review requested on Round 3 Question #4 bonus point.
                </p>
              </div>
              
              {disputeUnlockedIds.includes('disp-1') ? (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlocked for Judge</span>
                </span>
              ) : (
                <button
                  onClick={() => handleUnlockScore('disp-1', 'Rohan Mohanty & Ayush Dash')}
                  className="px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock for Revision</span>
                </button>
              )}
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-navy text-sm">Ananya Dash</span>
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Mothers Public School</span>
                </div>
                <p className="text-gray-500 text-[11px] mt-1">
                  Track: <strong>Glam 'n' Dazzle (Ramp Walk)</strong> • Locked Score: <strong className="text-navy">94.5 Pts</strong> • Evaluator: Prof. A. Ray
                </p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Routine audit: Reviewing costume theme consistency point allocation.
                </p>
              </div>

              {disputeUnlockedIds.includes('disp-2') ? (
                <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1 shrink-0">
                  <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Unlocked for Judge</span>
                </span>
              ) : (
                <button
                  onClick={() => handleUnlockScore('disp-2', 'Ananya Dash')}
                  className="px-3.5 py-2 bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 font-bold rounded-xl shadow-sm transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Unlock for Revision</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STUDENT ROSTER */}
      {activeTab === 'roster' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={rosterSearch}
                onChange={(e) => setRosterSearch(e.target.value)}
                placeholder="Search by student, ID, or school..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
              />
            </div>

            {/* Stream Filter */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
              {(['all', 'Science', 'Commerce', 'Arts'] as const).map(stream => (
                <button
                  key={stream}
                  onClick={() => setStreamFilter(stream)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                    streamFilter === stream
                      ? 'bg-navy text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {stream === 'all' ? 'All Streams' : stream}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                  <th className="py-3 px-3">Pass ID</th>
                  <th className="py-3 px-3">Student Name</th>
                  <th className="py-3 px-3">School / Board</th>
                  <th className="py-3 px-3">Stream</th>
                  <th className="py-3 px-3">Events Registered</th>
                  <th className="py-3 px-3 text-center">Gate Check-in</th>
                  <th className="py-3 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRoster.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="py-3 px-3 font-mono font-bold text-navy">{s.id}</td>
                    <td className="py-3 px-3">
                      <strong className="text-navy block">{s.name}</strong>
                      <span className="text-[10px] text-gray-400">{s.contact}</span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      <div>{s.school}</div>
                      <span className="text-[10px] font-bold text-gray-400">{s.board} • {s.city}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-800">
                        12th {s.stream}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 text-[11px]">
                      {s.events.join(', ')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {s.checkedIn ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Checked-In ✓
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-navy">
                      {s.score > 0 ? `${s.score} pts` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Roster */}
          <div className="md:hidden space-y-3">
            {filteredRoster.map(s => (
              <div key={s.id} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                      {s.id}
                    </span>
                    <h4 className="font-bold text-navy text-xs mt-1">{s.name}</h4>
                    <p className="text-[10px] text-gray-500">{s.school} • {s.board}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    s.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {s.checkedIn ? 'Checked-In' : 'Pending'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">12th {s.stream}</span>
                  <span className="font-bold text-navy">{s.score > 0 ? `${s.score} pts` : 'Not Scored'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
