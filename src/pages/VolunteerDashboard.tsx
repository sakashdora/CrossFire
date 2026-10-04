import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle, 
  Search, 
  QrCode, 
  Utensils, 
  MapPin, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  Send,
  Phone,
  Clock,
  Camera,
  X,
  PhoneCall
} from 'lucide-react';

interface VolunteerAttendee {
  id: string;
  name: string;
  institute: string;
  city: string;
  course: string;
  events: string[];
  contact: string;
  foodPreference: 'Veg' | 'Non-veg';
  checkedIn: boolean;
  checkInTime?: string;
  foodRedeemed: boolean;
  foodRedeemTime?: string;
  roomReported: boolean;
  assignedRoom: string;
}

export const VolunteerDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checkin' | 'food' | 'rooms' | 'incidents'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | 'Veg' | 'Non-veg'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'pending'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Sample attendee master roster
  const [attendees, setAttendees] = useState<VolunteerAttendee[]>([
    {
      id: 'CF-101',
      name: 'Akash Pattnaik',
      institute: 'DAV Public School, Chandrasekharpur',
      city: 'Bhubaneswar',
      course: '12th Science',
      events: ['Quiz', 'Ramp Walk'],
      contact: '+91 9876543210',
      foodPreference: 'Veg',
      checkedIn: true,
      checkInTime: '08:45 AM',
      foodRedeemed: false,
      roomReported: true,
      assignedRoom: 'Auditorium A (Quiz)'
    },
    {
      id: 'CF-102',
      name: 'Rohan Mohanty',
      institute: 'Buxi Jagabandhu English Medium School',
      city: 'Bhubaneswar',
      course: '12th Science',
      events: ['Quiz'],
      contact: '+91 9876543211',
      foodPreference: 'Non-veg',
      checkedIn: true,
      checkInTime: '08:52 AM',
      foodRedeemed: true,
      foodRedeemTime: '01:15 PM',
      roomReported: true,
      assignedRoom: 'Auditorium A (Quiz)'
    },
    {
      id: 'CF-103',
      name: 'Ananya Dash',
      institute: 'Mothers Public School',
      city: 'Bhubaneswar',
      course: '12th Commerce',
      events: ['Ramp Walk'],
      contact: '+91 9876543212',
      foodPreference: 'Veg',
      checkedIn: true,
      checkInTime: '09:05 AM',
      foodRedeemed: true,
      foodRedeemTime: '01:20 PM',
      roomReported: false,
      assignedRoom: 'Open Air Amphitheatre'
    },
    {
      id: 'CF-104',
      name: 'Debasish Swain',
      institute: 'Stewart School, Cuttack',
      city: 'Cuttack',
      course: '12th Arts',
      events: ['Debate'],
      contact: '+91 9876543213',
      foodPreference: 'Non-veg',
      checkedIn: false,
      foodRedeemed: false,
      roomReported: false,
      assignedRoom: 'Management Seminar Hall B'
    },
    {
      id: 'CF-105',
      name: 'Tanvi Agarwal',
      institute: 'SAI International School',
      city: 'Bhubaneswar',
      course: '12th Commerce',
      events: ['Poster Making'],
      contact: '+91 9876543214',
      foodPreference: 'Veg',
      checkedIn: false,
      foodRedeemed: false,
      roomReported: false,
      assignedRoom: 'Creative Art Studio Block C'
    },
    {
      id: 'CF-106',
      name: 'Siddharth Rout',
      institute: 'BJB Higher Secondary School',
      city: 'Bhubaneswar',
      course: '12th Science',
      events: ['Treasure Hunt'],
      contact: '+91 9876543215',
      foodPreference: 'Non-veg',
      checkedIn: true,
      checkInTime: '09:12 AM',
      foodRedeemed: false,
      roomReported: true,
      assignedRoom: 'Central Campus Quadrangle'
    }
  ]);

  // Incidents log
  const [incidents, setIncidents] = useState<{ id: string; room: string; issue: string; time: string; status: 'Open' | 'Resolved' }[]>([
    { id: 'inc-1', room: 'Auditorium A', issue: 'Podium Microphone 2 battery low during Quiz round 1', time: '10:15 AM', status: 'Resolved' },
    { id: 'inc-2', room: 'Media Studio', issue: 'Candidate CF-109 video file format requires MP4 conversion', time: '10:40 AM', status: 'Open' },
  ]);
  const [newIncidentRoom, setNewIncidentRoom] = useState('Auditorium A');
  const [newIncidentText, setNewIncidentText] = useState('');

  // Handlers
  const handleToggleCheckIn = (id: string) => {
    setAttendees(prev => prev.map(att => {
      if (att.id === id) {
        const nextState = !att.checkedIn;
        const time = nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        showToast(nextState ? `Checked in ${att.name} at ${time}` : `Reverted check-in for ${att.name}`);
        return {
          ...att,
          checkedIn: nextState,
          checkInTime: time
        };
      }
      return att;
    }));
  };

  const handleToggleFood = (id: string) => {
    setAttendees(prev => prev.map(att => {
      if (att.id === id) {
        const nextState = !att.foodRedeemed;
        const time = nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined;
        showToast(nextState ? `Issued ${att.foodPreference} Meal to ${att.name}` : `Cancelled meal token for ${att.name}`);
        return {
          ...att,
          foodRedeemed: nextState,
          foodRedeemTime: time
        };
      }
      return att;
    }));
  };

  const handleToggleRoom = (id: string) => {
    setAttendees(prev => prev.map(att => {
      if (att.id === id) {
        const nextState = !att.roomReported;
        showToast(nextState ? `Marked ${att.name} present in ${att.assignedRoom}` : `Marked ${att.name} absent from room`);
        return { ...att, roomReported: nextState };
      }
      return att;
    }));
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentText.trim()) return;
    setIncidents(prev => [
      {
        id: `inc-${Date.now()}`,
        room: newIncidentRoom,
        issue: newIncidentText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'Open'
      },
      ...prev
    ]);
    showToast(`Logged operational incident for ${newIncidentRoom}`);
    setNewIncidentText('');
  };

  const handleToggleIncidentStatus = (incId: string) => {
    setIncidents(prev => prev.map(i => {
      if (i.id === incId) {
        const next = i.status === 'Open' ? 'Resolved' : 'Open';
        showToast(`Incident #${i.id} marked as ${next}`);
        return { ...i, status: next };
      }
      return i;
    }));
  };

  const handleSimulateScan = (attendeeId: string) => {
    handleToggleCheckIn(attendeeId);
    setScannerOpen(false);
  };

  const totalAttendees = attendees.length;
  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const foodRedeemedCount = attendees.filter(a => a.foodRedeemed).length;
  const vegCount = attendees.filter(a => a.foodPreference === 'Veg').length;
  const nonVegCount = attendees.filter(a => a.foodPreference === 'Non-veg').length;

  const filteredAttendees = attendees.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFood = foodFilter === 'all' || a.foodPreference === foodFilter;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'checkedIn' ? a.checkedIn : !a.checkedIn;
    return matchesSearch && matchesFood && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-navy text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/50 flex items-center gap-3 animate-fadeIn text-xs sm:text-sm font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Volunteer Ops Header */}
      <div className="bg-gradient-to-r from-[#001F3F] to-[#0a2f57] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Volunteer & Ground Operations Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Campus Ground Coordination Desk
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Logged in as <strong>{user?.first_name || 'Volunteer Coordinator'}</strong> • Srusti Campus Ops
          </p>
        </div>

        {/* Live Counters & Camera QR Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-xs font-black rounded-2xl shadow-lg shadow-orange-500/30 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>QR Scanner</span>
          </button>

          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-lg sm:text-xl font-black text-emerald-400 block">{checkedInCount} / {totalAttendees}</span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Checked In</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-lg sm:text-xl font-black text-orange-400 block">{foodRedeemedCount} / {totalAttendees}</span>
            <span className="text-[9px] uppercase font-bold text-gray-300">Meals Done</span>
          </div>
        </div>
      </div>

      {/* Workflow Tabs (Smooth Horizontal Scroll) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'checkin'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Gate Check-In ({checkedInCount}/{totalAttendees})</span>
        </button>

        <button
          onClick={() => setActiveTab('food')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'food'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Utensils className="w-4 h-4 text-orange-500" />
          <span>Food Tokens ({foodRedeemedCount}/{totalAttendees})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-blue-500" />
          <span>Room Presence</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'incidents'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Incident Desk ({incidents.filter(i => i.status === 'Open').length} Open)</span>
        </button>
      </div>

      {/* TAB 1: GATE CHECK-IN DESK */}
      {activeTab === 'checkin' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or ID..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {(['all', 'checkedIn', 'pending'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'checkedIn' ? 'Checked In' : 'Pending Arrival'}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Institute & City</th>
                  <th className="py-3 px-4">Stream</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">{att.id}</td>
                    <td className="py-3.5 px-4">
                      <strong className="text-navy block">{att.name}</strong>
                      <span className="text-[11px] text-gray-500">{att.contact}</span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div>{att.institute}</div>
                      <span className="text-[10px] text-gray-400">{att.city}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-medium text-gray-700">
                        {att.course}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {att.checkedIn ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Checked In ({att.checkInTime})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Pending Arrival
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleCheckIn(att.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          att.checkedIn
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {att.checkedIn ? 'Revert Check-In' : 'Mark Gate Entry ✓'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredAttendees.map((att) => (
              <div key={att.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">
                      {att.id}
                    </span>
                    <h4 className="font-bold text-navy text-sm mt-1">{att.name}</h4>
                    <p className="text-[11px] text-gray-500">{att.institute}</p>
                  </div>
                  {att.checkedIn ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                      In Campus ✓
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                      Pending
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{att.course}</span>
                  <a href={`tel:${att.contact}`} className="text-blue-600 font-bold flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>Call Student</span>
                  </a>
                </div>

                <button
                  onClick={() => handleToggleCheckIn(att.id)}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    att.checkedIn
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-emerald-600 active:scale-95 text-white'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{att.checkedIn ? 'Revert Check-In' : 'Mark Gate Entry ✓'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FOOD COUNTER TOKENS */}
      {activeTab === 'food' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span>Buffet Lunch Counter Token Redemption</span>
              </h3>
              <p className="text-xs text-gray-500">
                1:00 PM – 2:30 PM • Central Dining Hall • Token Validation
              </p>
            </div>

            {/* Food Diet Filter */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {(['all', 'Veg', 'Non-veg'] as const).map(diet => (
                <button
                  key={diet}
                  onClick={() => setFoodFilter(diet)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    foodFilter === diet
                      ? 'bg-navy text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {diet === 'all' ? `All (${attendees.length})` : diet === 'Veg' ? `Veg (${vegCount})` : `Non-Veg (${nonVegCount})`}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Food Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Preference</th>
                  <th className="py-3 px-4 text-center">Token Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendees.map(att => (
                  <tr key={att.id} className="hover:bg-gray-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">{att.id}</td>
                    <td className="py-3.5 px-4 font-bold text-navy">{att.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.foodPreference === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {att.foodPreference} Pack
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {att.foodRedeemed ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Redeemed ({att.foodRedeemTime})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Unclaimed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleFood(att.id)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          att.foodRedeemed
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                        }`}
                      >
                        {att.foodRedeemed ? 'Revert Token' : 'Issue Meal Box ✓'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Food Cards */}
          <div className="md:hidden space-y-3">
            {filteredAttendees.map(att => (
              <div key={att.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-navy">{att.id}</span>
                    <h4 className="font-bold text-navy text-sm">{att.name}</h4>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                    att.foodPreference === 'Veg' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {att.foodPreference}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Status: {att.foodRedeemed ? `Redeemed at ${att.foodRedeemTime}` : 'Unclaimed'}</span>
                </div>

                <button
                  onClick={() => handleToggleFood(att.id)}
                  className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                    att.foodRedeemed
                      ? 'bg-gray-200 text-gray-700'
                      : 'bg-orange-500 active:scale-95 text-white shadow-orange-500/20'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                  <span>{att.foodRedeemed ? 'Revert Token' : 'Issue Meal Box ✓'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROOM & STAGE REPORTING */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span>Room & Stage Verification Desk</span>
            </h3>
            <p className="text-xs text-gray-500">
              Confirm participant presence inside assigned competition halls before judges commence scoring rounds.
            </p>
          </div>

          <div className="space-y-3">
            {attendees.map(att => (
              <div key={att.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded text-[10px]">{att.id}</span>
                    <strong className="text-navy text-sm">{att.name}</strong>
                    <span className="text-gray-500">({att.institute})</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    Assigned Venue: <strong className="text-navy">{att.assignedRoom}</strong> • Registered Events: {att.events.join(', ')}
                  </p>
                </div>

                <button
                  onClick={() => handleToggleRoom(att.id)}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 ${
                    att.roomReported
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white hover:bg-blue-50 text-blue-700 border border-blue-300 shadow-sm'
                  }`}
                >
                  {att.roomReported ? 'Present in Room ✓' : 'Mark In Room'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INCIDENT DESK */}
      {activeTab === 'incidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Incident Reporter Form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Log Incident / Ground Request</span>
            </h3>
            <p className="text-xs text-gray-500">
              Report equipment issues, medical assistance, or queue congestions for central marshals.
            </p>

            <form onSubmit={handleAddIncident} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                  Location / Room
                </label>
                <select
                  value={newIncidentRoom}
                  onChange={(e) => setNewIncidentRoom(e.target.value)}
                  className="w-full text-xs p-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-navy"
                >
                  <option value="Auditorium A">Main Auditorium A</option>
                  <option value="Seminar Hall B">Management Seminar Hall B</option>
                  <option value="Design Studio C">Design Studio Block C</option>
                  <option value="Dining Hall">Campus Dining Hall</option>
                  <option value="Main Gate">Main Entrance Gate</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                  Issue Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={newIncidentText}
                  onChange={(e) => setNewIncidentText(e.target.value)}
                  placeholder="e.g. Mic 2 buzz noise or extra water bottles needed in Hall B..."
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Incident Ticket</span>
              </button>
            </form>
          </div>

          {/* Active Incidents List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span>Live Operational Incidents</span>
              </div>
              <span className="text-xs font-bold text-gray-400">
                {incidents.filter(i => i.status === 'Open').length} Open Tickets
              </span>
            </h3>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div key={inc.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-navy">{inc.room}</span>
                      <span className="text-gray-400 text-[10px]">• {inc.time}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        inc.status === 'Open' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                    <p className="text-gray-600 text-[11px] mt-1">{inc.issue}</p>
                  </div>

                  <button
                    onClick={() => handleToggleIncidentStatus(inc.id)}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-navy font-bold rounded-xl border border-gray-300 shadow-sm text-xs cursor-pointer shrink-0"
                  >
                    Mark as {inc.status === 'Open' ? 'Resolved ✓' : 'Re-open'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Ground Support Hotlines Banner */}
      <div className="bg-navy-950 p-5 rounded-2xl text-white border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-orange-400">
            Emergency Ground Marshals & Medical Desk
          </h4>
          <p className="text-xs text-gray-300 mt-0.5">
            For critical crowd or electrical emergencies, contact Central Dispatch immediately.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="tel:+919937012345"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20"
          >
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chief Marshal</span>
          </a>
          <a
            href="tel:+919437198765"
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/20"
          >
            <PhoneCall className="w-3.5 h-3.5 text-red-400" />
            <span>Medical Station</span>
          </a>
        </div>
      </div>

      {/* Simulated Interactive QR Code Camera Scanner Modal */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-navy-950 border border-white/20 rounded-3xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-orange-400" />
                <h3 className="font-black text-sm">Simulated Gate QR Code Scanner</h3>
              </div>
              <button
                onClick={() => setScannerOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Viewfinder simulation */}
            <div className="relative aspect-square w-full bg-black/60 rounded-2xl border-2 border-dashed border-orange-500/60 overflow-hidden flex flex-col items-center justify-center p-6 text-center">
              {/* Animated Laser Scan Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse shadow-lg shadow-orange-500/50"></div>
              
              <QrCode className="w-24 h-24 text-white/30 animate-pulse mb-3" />
              <p className="text-xs text-gray-300 font-medium">
                Align student admit pass QR code inside the viewfinder window
              </p>
              <span className="text-[10px] text-orange-400 font-mono mt-1">CAMERA STATUS: ACTIVE (30 FPS)</span>
            </div>

            {/* Quick Demo Scan Buttons */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-400 block">Tap participant to test scan:</span>
              <div className="grid grid-cols-2 gap-2">
                {attendees.slice(0, 4).map(att => (
                  <button
                    key={att.id}
                    onClick={() => handleSimulateScan(att.id)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-orange-500 hover:text-white text-gray-200 text-xs font-bold text-left transition-colors cursor-pointer border border-white/10 truncate"
                  >
                    <span>{att.name}</span>
                    <span className="block text-[10px] text-gray-400 font-mono">{att.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setScannerOpen(false)}
              className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Close Camera Viewfinder
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
