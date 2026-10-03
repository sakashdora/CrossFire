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
  Send
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

  // Sample attendee master roster
  const [attendees, setAttendees] = useState<VolunteerAttendee[]>([
    {
      id: 'CF-101',
      name: 'Akash Pattnaik',
      institute: 'DAV Public School, Chandrasekharpur',
      city: 'Bhubaneswar',
      course: '12th Science',
      events: ['Intelect Odyssey (Quiz)', "Glam 'n' Dazzle (Ramp Walk)"],
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
      events: ['Intelect Odyssey (Quiz)'],
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
      events: ["Glam 'n' Dazzle (Ramp Walk)"],
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
      events: ['Spontanity Erena (Extempore/Debate)'],
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
      events: ['Spectrum on Canvas (Poster Making)'],
      contact: '+91 9876543214',
      foodPreference: 'Veg',
      checkedIn: false,
      foodRedeemed: false,
      roomReported: false,
      assignedRoom: 'Design Studio Block C'
    },
    {
      id: 'CF-106',
      name: 'Siddharth Rout',
      institute: 'BJB Higher Secondary School',
      city: 'Bhubaneswar',
      course: '12th Science',
      events: ['Hidden Horizon (Treasure Hunt)'],
      contact: '+91 9876543215',
      foodPreference: 'Non-veg',
      checkedIn: true,
      checkInTime: '09:12 AM',
      foodRedeemed: false,
      roomReported: true,
      assignedRoom: 'Campus Quadrangle'
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
        return {
          ...att,
          checkedIn: nextState,
          checkInTime: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return att;
    }));
  };

  const handleToggleFood = (id: string) => {
    setAttendees(prev => prev.map(att => {
      if (att.id === id) {
        const nextState = !att.foodRedeemed;
        return {
          ...att,
          foodRedeemed: nextState,
          foodRedeemTime: nextState ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return att;
    }));
  };

  const handleToggleRoom = (id: string) => {
    setAttendees(prev => prev.map(att => {
      if (att.id === id) {
        return { ...att, roomReported: !att.roomReported };
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
    setNewIncidentText('');
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
    return matchesSearch && matchesFood;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Volunteer Ops Header */}
      <div className="bg-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Volunteer & Ground Operations Hub
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Campus Ground Coordination Desk
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Logged in as <strong>{user?.first_name || 'Volunteer Coordinator'}</strong> • Srusti Campus Ops
          </p>
        </div>

        {/* Live Counters */}
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-xl font-black text-emerald-400 block">{checkedInCount} / {totalAttendees}</span>
            <span className="text-[10px] uppercase font-bold text-gray-300">Checked-In</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-center">
            <span className="text-xl font-black text-orange-400 block">{foodRedeemedCount} / {totalAttendees}</span>
            <span className="text-[10px] uppercase font-bold text-gray-300">Meals Claimed</span>
          </div>
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'food'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Utensils className="w-4 h-4 text-orange-500" />
          <span>Food Counter Tokens (Veg: {vegCount}, Non-Veg: {nonVegCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <MapPin className="w-4 h-4 text-blue-500" />
          <span>Room & Stage Reporting</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by student name or institute..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
              />
            </div>

            <button
              onClick={() => alert('Simulated QR Code Camera Active: Point phone camera to student pass to auto-mark check-in.')}
              className="w-full sm:w-auto px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl shadow flex items-center justify-center gap-2 hover:bg-navy-light"
            >
              <QrCode className="w-4 h-4 text-orange-400" />
              <span>Simulate QR Camera Scan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
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
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1">
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
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                          att.checkedIn
                            ? 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        {att.checkedIn ? 'Undo Check-in' : 'Mark Arrived ✓'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FOOD COUNTER TOKENS */}
      {activeTab === 'food' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Utensils className="w-5 h-5 text-orange-500" />
                <span>Catering & Food Token Desk</span>
              </h3>
              <p className="text-xs text-gray-500">
                Verify student preference and click to mark their meal as claimed.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Filter Preference:</span>
              {(['all', 'Veg', 'Non-veg'] as const).map(pref => (
                <button
                  key={pref}
                  onClick={() => setFoodFilter(pref)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    foodFilter === pref
                      ? 'bg-navy text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {pref === 'all' ? 'All (6)' : pref}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
                  <th className="py-3 px-4">Pass ID</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Dietary Preference</th>
                  <th className="py-3 px-4 text-center">Campus Gate Check-in</th>
                  <th className="py-3 px-4 text-center">Food Token Status</th>
                  <th className="py-3 px-4 text-right">Counter Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendees.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-50/80">
                    <td className="py-3.5 px-4 font-mono font-bold text-navy">{att.id}</td>
                    <td className="py-3.5 px-4 font-bold text-navy">{att.name}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        att.foodPreference === 'Veg'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-orange-50 text-orange-800 border border-orange-200'
                      }`}>
                        {att.foodPreference === 'Veg' ? '🥗 Vegetarian' : '🍗 Non-Vegetarian'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        att.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {att.checkedIn ? 'At Campus ✓' : 'Not Arrived'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {att.foodRedeemed ? (
                        <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Redeemed ({att.foodRedeemTime || '1:15 PM'})
                        </span>
                      ) : (
                        <span className="text-gray-400 font-medium">Unredeemed</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleToggleFood(att.id)}
                        disabled={!att.checkedIn}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors disabled:opacity-40 ${
                          att.foodRedeemed
                            ? 'bg-gray-100 text-gray-500 hover:text-red-600'
                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                        }`}
                      >
                        {att.foodRedeemed ? 'Revoke Token' : 'Redeem Meal'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ROOM & STAGE REPORTING */}
      {activeTab === 'rooms' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span>Venue Room Stage Reporting</span>
            </h3>
            <p className="text-xs text-gray-500">
              Mark whether the candidate/team has entered the competition room so judges know they are in position.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendees.map((att) => (
              <div key={att.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    {att.assignedRoom}
                  </span>
                  <h4 className="font-bold text-navy text-sm mt-0.5">{att.name}</h4>
                  <span className="text-[11px] text-gray-500">{att.events.join(', ')}</span>
                </div>

                <button
                  onClick={() => handleToggleRoom(att.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    att.roomReported
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {att.roomReported ? 'In Room ✓' : 'Mark Reported'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: INCIDENT DESK */}
      {activeTab === 'incidents' && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Campus Incident & Audio/Visual Helpdesk</span>
            </h3>
            <p className="text-xs text-gray-500">
              Log technical faults, missing team members, or equipment requests for instant escalation to Admin.
            </p>
          </div>

          {/* New Incident Form */}
          <form onSubmit={handleAddIncident} className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Venue Room</label>
                <select
                  value={newIncidentRoom}
                  onChange={(e) => setNewIncidentRoom(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white"
                >
                  <option value="Auditorium A">Auditorium A (Quiz)</option>
                  <option value="Open Air Stage">Open Air Stage (Ramp Walk)</option>
                  <option value="Media Studio">Media Studio (Reels)</option>
                  <option value="Hall B">Management Hall B (Debate)</option>
                  <option value="Block C">Design Studio Block C (Poster)</option>
                  <option value="Campus Grounds">Campus Grounds (Treasure Hunt)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-gray-700 uppercase mb-1">Issue Description</label>
                <input
                  type="text"
                  required
                  value={newIncidentText}
                  onChange={(e) => setNewIncidentText(e.target.value)}
                  placeholder="e.g. Projector screen flicker, candidate needs water, buzzer 3 replacement"
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transmit Ticket to Admin Desk</span>
            </button>
          </form>

          {/* Incident Log List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Live Incident Feed</h4>
            {incidents.map((inc) => (
              <div key={inc.id} className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">{inc.room}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 font-mono text-[11px]">{inc.time}</span>
                  </div>
                  <p className="text-gray-700 mt-1">{inc.issue}</p>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  inc.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {inc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
