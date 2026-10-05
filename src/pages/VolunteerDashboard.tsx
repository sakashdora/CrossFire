import React, { useState, useEffect, useMemo } from 'react';
import { studentDataService, StudentRegistrationRecord, REGISTRATION_EVENT_KEY } from '../services/studentDataService';
import { LiveQRScanner } from '../components/LiveQRScanner';
import { 
  CheckCircle, 
  Search, 
  Utensils, 
  MapPin, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  Camera, 
  X, 
  ShieldCheck, 
  Sparkles 
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

const ROOM_MAP: Record<string, string> = {
  'quiz': 'Auditorium A (Quiz)',
  'debate': 'Management Seminar Hall B (Debate)',
  'poster-making': 'Creative Art Studio Block C (Poster)',
  'treasure-hunt': 'Central Campus Quadrangle (Treasure)',
  'ramp-walk': 'Open Air Amphitheatre (Ramp Walk)',
  'reels': 'Media Lab & Studio Block (Reels)'
};

export const VolunteerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checkin' | 'food' | 'rooms' | 'incidents'>('checkin');
  const [searchQuery, setSearchQuery] = useState('');
  const [foodFilter, setFoodFilter] = useState<'all' | 'Veg' | 'Non-veg'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checkedIn' | 'pending'>('all');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Scanned / Selected student verification card
  const [scannedStudent, setScannedStudent] = useState<StudentRegistrationRecord | null>(null);

  // Incidents log state
  const [incidents, setIncidents] = useState<{ id: string; room: string; issue: string; time: string; status: 'Open' | 'Resolved' }[]>([
    { id: 'inc-1', room: 'Auditorium A', issue: 'Podium Microphone 2 battery low during Quiz round 1', time: '10:15 AM', status: 'Resolved' },
    { id: 'inc-2', room: 'Media Studio', issue: 'Candidate video file format requires MP4 conversion assistance', time: '10:40 AM', status: 'Open' },
  ]);
  const [newIncidentRoom, setNewIncidentRoom] = useState('Auditorium A');
  const [newIncidentIssue, setNewIncidentIssue] = useState('');

  // Load real student registrations from studentDataService
  const [studentsList, setStudentsList] = useState<StudentRegistrationRecord[]>(() => studentDataService.getAllStudents());

  const refreshData = () => {
    const list = studentDataService.getAllStudents();
    setStudentsList(list);
  };

  useEffect(() => {
    refreshData();
    window.addEventListener(REGISTRATION_EVENT_KEY, refreshData);
    return () => {
      window.removeEventListener(REGISTRATION_EVENT_KEY, refreshData);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Convert StudentRegistrationRecord to VolunteerAttendee format
  const attendees: VolunteerAttendee[] = useMemo(() => {
    return studentsList.map(s => {
      const primaryComp = s.selected_competitions[0]?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'quiz';
      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name || ''}`.trim(),
        institute: s.institute_name,
        city: s.city_town,
        course: s.course_stream,
        events: s.selected_competitions,
        contact: s.contact_number,
        foodPreference: s.food_preference,
        checkedIn: Boolean(s.checked_in_at),
        checkInTime: s.checked_in_at ? new Date(s.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        foodRedeemed: Boolean(s.food_redeemed_at),
        foodRedeemTime: s.food_redeemed_at ? new Date(s.food_redeemed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        roomReported: Boolean(s.room_reported && Object.values(s.room_reported).some(Boolean)),
        assignedRoom: ROOM_MAP[primaryComp] || 'Auditorium A'
      };
    });
  }, [studentsList]);

  // Handle Check-in toggle
  const handleToggleCheckIn = (attendeeId: string) => {
    const student = studentDataService.findStudentByIdOrContact(attendeeId);
    if (!student) return;

    const newCheckIn = student.checked_in_at ? null : new Date().toISOString();
    studentDataService.updateStudentStatus(student.id, { checked_in_at: newCheckIn });
    refreshData();

    const freshCheckIn = studentDataService.findStudentByIdOrContact(student.id);
    if (scannedStudent && scannedStudent.id === student.id && freshCheckIn) {
      setScannedStudent(freshCheckIn);
    }

    showToast(newCheckIn ? `Checked in: ${student.first_name} ${student.last_name}` : `Check-in reverted for ${student.first_name}`);
  };

  // Handle Food Token toggle
  const handleToggleFood = (attendeeId: string) => {
    const student = studentDataService.findStudentByIdOrContact(attendeeId);
    if (!student) return;

    if (!student.checked_in_at && !student.food_redeemed_at) {
      showToast('Student must be checked in at the gate before redeeming a meal.');
      return;
    }

    const newRedeemed = student.food_redeemed_at ? null : new Date().toISOString();
    studentDataService.updateStudentStatus(student.id, { food_redeemed_at: newRedeemed });
    refreshData();

    const freshFood = studentDataService.findStudentByIdOrContact(student.id);
    if (scannedStudent && scannedStudent.id === student.id && freshFood) {
      setScannedStudent(freshFood);
    }

    showToast(newRedeemed ? `Meal token redeemed for ${student.first_name} (${student.food_preference})` : `Meal token reverted for ${student.first_name}`);
  };

  // Handle Room Reported toggle
  const handleToggleRoom = (attendeeId: string) => {
    const student = studentDataService.findStudentByIdOrContact(attendeeId);
    if (!student) return;

    const currentStatus = Boolean(student.room_reported && Object.values(student.room_reported).some(Boolean));
    const newStatus = !currentStatus;
    
    // Set for all student's events
    const updatedRoom: Record<string, boolean> = {};
    student.selected_competitions.forEach(c => {
      const slug = c.toLowerCase().replace(/[^a-z0-9]/g, '-');
      updatedRoom[slug] = newStatus;
    });

    studentDataService.updateStudentStatus(student.id, { room_reported: updatedRoom });
    refreshData();

    const freshRoom = studentDataService.findStudentByIdOrContact(student.id);
    if (scannedStudent && scannedStudent.id === student.id && freshRoom) {
      setScannedStudent(freshRoom);
    }

    showToast(newStatus ? `${student.first_name} marked present in event room.` : `Room status cleared for ${student.first_name}`);
  };

  // Handle Scanned QR Code payload
  const handleScanSuccess = (decodedText: string) => {
    setScannerOpen(false);
    let matchedStudent: StudentRegistrationRecord | undefined;

    // Try parsing as JSON token
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.pass_id) {
        matchedStudent = studentDataService.findStudentByIdOrContact(parsed.pass_id);
      }
    } catch {
      // Raw string query (e.g. CF26-1001 or email)
      matchedStudent = studentDataService.findStudentByIdOrContact(decodedText);
    }

    if (matchedStudent) {
      setScannedStudent(matchedStudent);
      showToast(`Scanned verified pass: ${matchedStudent.first_name} ${matchedStudent.last_name}`);
    } else {
      showToast(`Unrecognized QR code or student pass: "${decodedText.substring(0, 30)}..."`);
    }
  };

  // Handle quick search verify
  const handleQuickSearchVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const matched = studentDataService.findStudentByIdOrContact(searchQuery);
    if (matched) {
      setScannedStudent(matched);
      showToast(`Found delegate: ${matched.first_name} ${matched.last_name}`);
    } else {
      showToast(`No student found matching "${searchQuery}"`);
    }
  };

  // Handle incident submit
  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentIssue.trim()) return;

    const newInc = {
      id: `inc-${Date.now()}`,
      room: newIncidentRoom,
      issue: newIncidentIssue.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'Open' as const
    };

    setIncidents([newInc, ...incidents]);
    setNewIncidentIssue('');
    showToast('Incident reported to Central Operations Desk.');
  };

  // Toggle incident status
  const handleToggleIncidentStatus = (id: string) => {
    setIncidents(incidents.map(inc => inc.id === id ? { ...inc, status: inc.status === 'Open' ? 'Resolved' : 'Open' } : inc));
    showToast('Incident status updated.');
  };

  // Filtered Attendees list
  const filteredAttendees = useMemo(() => {
    return attendees.filter(att => {
      const term = searchQuery.toLowerCase().trim();
      const matchesSearch = !term ||
        att.name.toLowerCase().includes(term) ||
        att.id.toLowerCase().includes(term) ||
        att.institute.toLowerCase().includes(term) ||
        att.contact.includes(term) ||
        att.city.toLowerCase().includes(term);

      const matchesFood = foodFilter === 'all' || att.foodPreference === foodFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'checkedIn' ? att.checkedIn : !att.checkedIn);

      return matchesSearch && matchesFood && matchesStatus;
    });
  }, [attendees, searchQuery, foodFilter, statusFilter]);

  const checkedInCount = attendees.filter(a => a.checkedIn).length;
  const foodRedeemedCount = attendees.filter(a => a.foodRedeemed).length;
  const roomReportedCount = attendees.filter(a => a.roomReported).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-navy text-white px-5 py-3 rounded-2xl shadow-2xl border border-orange-500/40 text-xs font-bold flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Ground Ops Portal
              </span>
              <span className="text-xs text-gray-300 font-bold">
                Srusti Campus Operations
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Volunteer & Gate Coordinator Console
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Real-time gate pass verification, camera QR scanning, student kit tracking, and meal token redemption.
            </p>
          </div>

          {/* Live Scanner Action */}
          <button
            onClick={() => setScannerOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          >
            <Camera className="w-5 h-5 animate-pulse" />
            <span>Open Camera QR Scanner</span>
          </button>
        </div>
      </div>

      {/* KPI Counters Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-navy shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Expected</span>
            <span className="text-xl sm:text-2xl font-black text-navy">{attendees.length} Students</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Gate Checked-In</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-700">{checkedInCount} ({Math.round((checkedInCount / (attendees.length || 1)) * 100)}%)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Meals Redeemed</span>
            <span className="text-xl sm:text-2xl font-black text-purple-800">{foodRedeemedCount} / {checkedInCount}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">In Event Rooms</span>
            <span className="text-xl sm:text-2xl font-black text-orange-700">{roomReportedCount} Reported</span>
          </div>
        </div>
      </div>

      {/* Scanned Student Immediate Verification Banner */}
      {scannedStudent && (
        <div className="bg-white rounded-3xl p-6 border-2 border-orange-500 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fadeIn">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                  {scannedStudent.id}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +2 Verified Student
                </span>
              </div>
              <h2 className="text-xl font-black text-navy mt-1">
                {scannedStudent.first_name} {scannedStudent.last_name}
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                {scannedStudent.institute_name} • {scannedStudent.course_stream} ({scannedStudent.board || 'CBSE'}) • {scannedStudent.city_town}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {scannedStudent.selected_competitions.map((c, i) => (
                  <span key={i} className="text-[10px] font-black text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                    {c}
                  </span>
                ))}
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  Food: {scannedStudent.food_preference}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => handleToggleCheckIn(scannedStudent.id)}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow ${
                scannedStudent.checked_in_at 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-navy text-white hover:bg-navy-light'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{scannedStudent.checked_in_at ? 'Gate Checked-In ✓' : 'Perform Gate Check-In'}</span>
            </button>

            <button
              onClick={() => handleToggleFood(scannedStudent.id)}
              className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow ${
                scannedStudent.food_redeemed_at 
                  ? 'bg-purple-700 text-white hover:bg-purple-800' 
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>{scannedStudent.food_redeemed_at ? 'Meal Redeemed ✓' : 'Redeem Lunch Token'}</span>
            </button>

            <button
              onClick={() => setScannedStudent(null)}
              className="p-2.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100"
              title="Dismiss banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('checkin')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'checkin' 
              ? 'bg-navy text-white shadow-md' 
              : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Gate Check-In ({checkedInCount}/{attendees.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('food')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'food' 
              ? 'bg-navy text-white shadow-md' 
              : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Food Hall ({foodRedeemedCount}/{checkedInCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'rooms' 
              ? 'bg-navy text-white shadow-md' 
              : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Room Reporting ({roomReportedCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('incidents')}
          className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'incidents' 
              ? 'bg-navy text-white shadow-md' 
              : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Ground Incidents ({incidents.filter(i => i.status === 'Open').length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab !== 'incidents' ? (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5">
          {/* Filter and Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleQuickSearchVerify} className="relative w-full md:w-96 flex gap-2">
              <div className="relative flex-grow">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Pass ID, Name, Phone or School..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light cursor-pointer shrink-0"
              >
                Verify
              </button>
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy focus:outline-none"
              >
                <option value="all">All Gate Statuses</option>
                <option value="checkedIn">Checked-In Only</option>
                <option value="pending">Pending Check-in</option>
              </select>

              {activeTab === 'food' && (
                <select
                  value={foodFilter}
                  onChange={(e) => setFoodFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy focus:outline-none"
                >
                  <option value="all">All Meals (Veg & Non-Veg)</option>
                  <option value="Veg">Veg Only</option>
                  <option value="Non-veg">Non-Veg Only</option>
                </select>
              )}
            </div>
          </div>

          {/* Table of Candidates */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Pass ID & Student</th>
                  <th className="py-3 px-4">Institution & City</th>
                  <th className="py-3 px-4">Selected Competitions</th>
                  <th className="py-3 px-4">Meal Option</th>
                  <th className="py-3 px-4 text-center">
                    {activeTab === 'checkin' ? 'Gate Check-In' : activeTab === 'food' ? 'Food Redemption' : 'Room Reported'}
                  </th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAttendees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                      No delegates found matching the current search query.
                    </td>
                  </tr>
                ) : (
                  filteredAttendees.map((att) => (
                    <tr key={att.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px]">
                            {att.id}
                          </span>
                          <div>
                            <strong className="text-navy font-bold block">{att.name}</strong>
                            <span className="text-[11px] text-gray-500">{att.contact}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-800 font-medium block">{att.institute}</span>
                        <span className="text-[11px] text-gray-400">{att.course} • {att.city}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {att.events.map((ev, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                              {ev}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          att.foodPreference === 'Veg' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-orange-700 bg-orange-50 border border-orange-200'
                        }`}>
                          {att.foodPreference}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {activeTab === 'checkin' ? (
                          att.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{att.checkInTime || 'Checked-in'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                              Pending Gate Entry
                            </span>
                          )
                        ) : activeTab === 'food' ? (
                          att.foodRedeemed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{att.foodRedeemTime || 'Redeemed'}</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                              Voucher Active
                            </span>
                          )
                        ) : (
                          att.roomReported ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-700 bg-orange-100 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>In Room</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                              Not in Room
                            </span>
                          )
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {activeTab === 'checkin' && (
                          <button
                            onClick={() => handleToggleCheckIn(att.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              att.checkedIn 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-navy text-white hover:bg-navy-light'
                            }`}
                          >
                            {att.checkedIn ? 'Undo Check-In' : 'Check In'}
                          </button>
                        )}
                        {activeTab === 'food' && (
                          <button
                            onClick={() => handleToggleFood(att.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              att.foodRedeemed 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {att.foodRedeemed ? 'Revoke Token' : 'Redeem Food'}
                          </button>
                        )}
                        {activeTab === 'rooms' && (
                          <button
                            onClick={() => handleToggleRoom(att.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                              att.roomReported 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {att.roomReported ? 'Clear Room' : 'Mark In Room'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Incidents Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Incident Form */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-base font-black text-navy">Report Ground Incident</h3>
            </div>
            <form onSubmit={handleReportIncident} className="space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Location / Venue</label>
                <select
                  value={newIncidentRoom}
                  onChange={(e) => setNewIncidentRoom(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-navy"
                >
                  <option value="Auditorium A">Auditorium A (Quiz)</option>
                  <option value="Seminar Hall B">Seminar Hall B (Debate)</option>
                  <option value="Art Studio Block C">Art Studio Block C (Poster)</option>
                  <option value="Open Air Amphitheatre">Open Air Amphitheatre (Ramp Walk)</option>
                  <option value="Media Lab Studio">Media Lab & Studio Block (Reels)</option>
                  <option value="Central Quadrangle">Central Campus Quadrangle (Treasure)</option>
                  <option value="Dining Courtyard">Dining Courtyard (Food)</option>
                  <option value="Gate 1 Security">Gate 1 Security & Entrance</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Incident Details</label>
                <textarea
                  value={newIncidentIssue}
                  onChange={(e) => setNewIncidentIssue(e.target.value)}
                  rows={3}
                  placeholder="Describe technical issue, medical emergency, or equipment shortage..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Send Alert to Admin Desk
              </button>
            </form>
          </div>

          {/* Incidents List */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-navy">Live Ground Alerts</h3>
              <span className="text-xs font-bold text-gray-400 font-mono">
                {incidents.filter(i => i.status === 'Open').length} Open Issues
              </span>
            </div>

            <div className="space-y-3">
              {incidents.map((inc) => (
                <div 
                  key={inc.id} 
                  className={`p-4 rounded-2xl border flex items-start justify-between gap-4 transition-all ${
                    inc.status === 'Open' ? 'bg-orange-50/50 border-orange-200' : 'bg-gray-50 border-gray-200 opacity-75'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        inc.status === 'Open' ? 'bg-orange-500 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {inc.status}
                      </span>
                      <strong className="text-xs font-bold text-navy">{inc.room}</strong>
                      <span className="text-[10px] text-gray-400">{inc.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 font-medium mt-1">{inc.issue}</p>
                  </div>

                  <button
                    onClick={() => handleToggleIncidentStatus(inc.id)}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-navy font-bold text-xs rounded-xl shadow-sm cursor-pointer shrink-0"
                  >
                    {inc.status === 'Open' ? 'Mark Resolved' : 'Reopen'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera QR Scanner Modal */}
      {scannerOpen && (
        <LiveQRScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setScannerOpen(false)}
        />
      )}

    </div>
  );
};
