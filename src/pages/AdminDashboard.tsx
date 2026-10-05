import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminData } from '../hooks/useAdminData';
import { studentDataService, StudentRegistrationRecord } from '../services/studentDataService';
import { guestVolunteerService } from '../services/guestVolunteerService';
import { useNotifications } from '../hooks/useNotifications';
import { StudentQRCode } from '../components/StudentQRCode';
import { GuestCategory, GuestStatus, VolunteerStation, VolunteerShift, VolunteerAttendance, FoodPreference } from '../types';
import { 
  CheckCircle, 
  Send, 
  Download, 
  Printer,
  Users, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  BookOpen,
  X,
  Eye,
  UserPlus,
  HeartHandshake,
  Crown,
  MapPin,
  Radio,
  Clock,
  Plus,
  Trash2,
  FileSpreadsheet,
  ClipboardList,
  Key,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { stats, isLoading, error, refreshStats } = useAdminData();
  const { user, role, isStudentPortalOpen, setStudentPortalStatus } = useAuth();
  const { broadcastNotification } = useNotifications();
  const [isTogglingPortal, setIsTogglingPortal] = useState(false);
  const [portalToggleFeedback, setPortalToggleFeedback] = useState<string | null>(null);

  // Auto-sync Supabase data on mount
  useEffect(() => {
    const syncAll = async () => {
      try {
        await Promise.allSettled([
          studentDataService.syncFromSupabase(),
          guestVolunteerService.syncVolunteersFromSupabase(),
          guestVolunteerService.syncGuestsFromSupabase()
        ]);
        await refreshStats();
      } catch (e) {
        console.warn('[CROSSFIRE] Admin mount sync warning:', e);
      }
    };
    syncAll();
  }, []);

  const handleTogglePortal = async () => {
    setIsTogglingPortal(true);
    setPortalToggleFeedback(null);
    const targetState = !isStudentPortalOpen;
    try {
      const res = await setStudentPortalStatus(targetState);
      if (res.success) {
        setPortalToggleFeedback(
          targetState 
            ? 'Student Portal is now UNLOCKED! Registered students can now log in with their email and Pass ID.'
            : 'Student Portal is now LOCKED! Student registrations are active.'
        );
        setTimeout(() => setPortalToggleFeedback(null), 5000);
      } else {
        setPortalToggleFeedback(`Error updating portal state: ${res.error}`);
      }
    } catch (err: any) {
      setPortalToggleFeedback(`Failed to update portal: ${err.message}`);
    } finally {
      setIsTogglingPortal(false);
    }
  };

  // Active top-level admin tab
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'guests' | 'volunteers' | 'broadcast' | 'capacities'>('overview');

  // Student filtering & search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('all');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  
  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRegistrationRecord | null>(null);

  // Guest Management states
  const [guestSearch, setGuestSearch] = useState('');
  const [guestCategoryFilter, setGuestCategoryFilter] = useState<string>('all');
  const [isAddGuestModalOpen, setIsAddGuestModalOpen] = useState(false);
  const [newGuest, setNewGuest] = useState<{
    name: string;
    designation: string;
    organization: string;
    category: GuestCategory;
    contact_number: string;
    email: string;
    status: GuestStatus;
    escort_volunteer: string;
    arrival_time: string;
    vehicle_number: string;
    dietary_preference: FoodPreference;
    notes: string;
  }>({
    name: '',
    designation: '',
    organization: '',
    category: 'VIP Dignitary',
    contact_number: '',
    email: '',
    status: 'Confirmed',
    escort_volunteer: '',
    arrival_time: '10:00 AM',
    vehicle_number: '',
    dietary_preference: 'Veg',
    notes: ''
  });

  // Volunteer Management states
  const [volunteerSearch, setVolunteerSearch] = useState('');
  const [volunteerStationFilter, setVolunteerStationFilter] = useState<string>('all');
  const [isAddVolunteerModalOpen, setIsAddVolunteerModalOpen] = useState(false);
  const [newVolunteer, setNewVolunteer] = useState<{
    name: string;
    contact_number: string;
    email: string;
    volunteer_id: string;
    password: string;
    assigned_station: VolunteerStation;
    shift: VolunteerShift;
    attendance_status: VolunteerAttendance;
    kit_issued: boolean;
    walkie_channel: string;
    notes: string;
  }>({
    name: '',
    contact_number: '',
    email: '',
    volunteer_id: '',
    password: '',
    assigned_station: 'Gate 1 Registration & Security',
    shift: 'Full Day (08:30 AM - 05:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-1 (Main Security & Entry)',
    notes: ''
  });

  const [createdVolunteerAlert, setCreatedVolunteerAlert] = useState<{
    name: string;
    volunteer_id: string;
    email: string;
    pass: string;
    station: string;
  } | null>(null);

  const generateVolunteerPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#';
    let pass = 'CF26-';
    for (let i = 0; i < 4; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewVolunteer(prev => ({ ...prev, password: pass }));
  };

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'debate' | 'quiz' | 'judges'>('all');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'in_app'>('in_app');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await studentDataService.syncFromSupabase();
    } catch (err) {
      console.warn('Supabase sync warning:', err);
    }
    await refreshStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Toggle student confirmed/registered status
  const handleToggleStatus = (student: StudentRegistrationRecord) => {
    const newStatus = student.status === 'confirmed' ? 'registered' : 'confirmed';
    studentDataService.updateStudentStatus(student.id, { status: newStatus });
    refreshStats();
    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Toggle student check-in
  const handleToggleCheckIn = (student: StudentRegistrationRecord) => {
    const newCheckIn = student.checked_in_at ? null : new Date().toISOString();
    studentDataService.updateStudentStatus(student.id, { checked_in_at: newCheckIn });
    refreshStats();
    if (selectedStudent && selectedStudent.id === student.id) {
      setSelectedStudent(prev => prev ? { ...prev, checked_in_at: newCheckIn } : null);
    }
  };

  // Delete student registration permanently from Supabase & local cache
  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to permanently delete this student registration? This will delete the student from both the application and the Supabase database.')) {
      await studentDataService.deleteStudentAsync(studentId);
      await refreshStats();
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
    }
  };

  // Guest actions
  const handleAddGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name.trim() || !newGuest.organization.trim()) return;

    await guestVolunteerService.addGuestAsync({
      ...newGuest,
      name: newGuest.name.trim(),
      designation: newGuest.designation.trim(),
      organization: newGuest.organization.trim(),
      contact_number: newGuest.contact_number.trim(),
      email: newGuest.email.trim(),
      notes: newGuest.notes.trim()
    });

    setIsAddGuestModalOpen(false);
    setNewGuest({
      name: '',
      designation: '',
      organization: '',
      category: 'VIP Dignitary',
      contact_number: '',
      email: '',
      status: 'Confirmed',
      escort_volunteer: '',
      arrival_time: '10:00 AM',
      vehicle_number: '',
      dietary_preference: 'Veg',
      notes: ''
    });
    refreshStats();
  };

  const handleToggleGuestStatus = (guestId: string, currentStatus: GuestStatus) => {
    const nextStatus: Record<GuestStatus, GuestStatus> = {
      'Invited': 'Confirmed',
      'Confirmed': 'Arrived',
      'Arrived': 'Departed',
      'Departed': 'Confirmed',
      'Declined': 'Invited'
    };
    guestVolunteerService.updateGuestStatus(guestId, nextStatus[currentStatus]);
    refreshStats();
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (confirm('Are you sure you want to remove this dignitary from the protocol list?')) {
      await guestVolunteerService.deleteGuestAsync(guestId);
      refreshStats();
    }
  };

  // Volunteer actions
  const handleAddVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteer.name.trim() || !newVolunteer.contact_number.trim()) return;

    const count = guestVolunteerService.getAllVolunteers().length + 1;
    const finalVolId = newVolunteer.volunteer_id.trim() || `VOL-${100 + count}`;
    const finalPass = newVolunteer.password.trim() || 'volunteer123';

    const created = await guestVolunteerService.addVolunteerAsync({
      ...newVolunteer,
      name: newVolunteer.name.trim(),
      contact_number: newVolunteer.contact_number.trim(),
      email: newVolunteer.email.trim(),
      volunteer_id: finalVolId,
      password: finalPass,
      notes: newVolunteer.notes.trim()
    });

    setCreatedVolunteerAlert({
      name: created.name,
      volunteer_id: created.volunteer_id || finalVolId,
      email: created.email || 'None',
      pass: finalPass,
      station: created.assigned_station
    });

    setIsAddVolunteerModalOpen(false);
    setNewVolunteer({
      name: '',
      contact_number: '',
      email: '',
      volunteer_id: '',
      password: '',
      assigned_station: 'Gate 1 Registration & Security',
      shift: 'Full Day (08:30 AM - 05:30 PM)',
      attendance_status: 'Present / On Duty',
      kit_issued: true,
      walkie_channel: 'CH-1 (Main Security & Entry)',
      notes: ''
    });
    refreshStats();
  };

  const handleToggleVolunteerAttendance = (volId: string, currentStatus: VolunteerAttendance) => {
    const nextStatus: Record<VolunteerAttendance, VolunteerAttendance> = {
      'Present / On Duty': 'On Break',
      'On Break': 'Assigned',
      'Assigned': 'Present / On Duty',
      'Absent': 'Present / On Duty'
    };
    guestVolunteerService.updateVolunteerAttendance(volId, nextStatus[currentStatus]);
    refreshStats();
  };

  const handleToggleKit = (volId: string) => {
    guestVolunteerService.toggleVolunteerKit(volId);
    refreshStats();
  };

  const handleDeleteVolunteer = async (volId: string) => {
    if (confirm('Are you sure you want to remove this volunteer assignment?')) {
      await guestVolunteerService.deleteVolunteerAsync(volId);
      refreshStats();
    }
  };

  // Broadcast send
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    broadcastNotification({
      type: broadcastTarget === 'debate' ? 'debate_topic' : 'announcement',
      title: broadcastTitle.trim() || `Announcement for ${broadcastTarget.toUpperCase()}`,
      message: broadcastMessage.trim(),
      channel: broadcastChannel
    });

    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastTitle('');
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 2500);
  };

  // Filtered Students list
  const filteredStudents = useMemo(() => {
    if (!stats?.allStudents) return [];
    return stats.allStudents.filter(student => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        student.first_name.toLowerCase().includes(term) ||
        (student.last_name && student.last_name.toLowerCase().includes(term)) ||
        student.email.toLowerCase().includes(term) ||
        student.contact_number.includes(term) ||
        student.institute_name.toLowerCase().includes(term) ||
        student.city_town.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term);

      const matchesTrack = selectedTrackFilter === 'all' || 
        student.selected_competitions.some(c => c.toLowerCase().includes(selectedTrackFilter.toLowerCase()));

      const matchesStream = selectedStreamFilter === 'all' || 
        student.course_stream === selectedStreamFilter;

      const matchesStatus = selectedStatusFilter === 'all' || 
        student.status === selectedStatusFilter;

      return matchesSearch && matchesTrack && matchesStream && matchesStatus;
    });
  }, [stats?.allStudents, searchTerm, selectedTrackFilter, selectedStreamFilter, selectedStatusFilter]);

  // Filtered Guests list
  const filteredGuests = useMemo(() => {
    if (!stats?.guests) return [];
    return stats.guests.filter(g => {
      const term = guestSearch.toLowerCase().trim();
      const matchesSearch = !term ||
        g.name.toLowerCase().includes(term) ||
        g.organization.toLowerCase().includes(term) ||
        g.designation.toLowerCase().includes(term) ||
        g.contact_number.includes(term) ||
        g.email.toLowerCase().includes(term);

      const matchesCategory = guestCategoryFilter === 'all' || g.category === guestCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [stats?.guests, guestSearch, guestCategoryFilter]);

  // Filtered Volunteers list
  const filteredVolunteers = useMemo(() => {
    if (!stats?.volunteers) return [];
    return stats.volunteers.filter(v => {
      const term = volunteerSearch.toLowerCase().trim();
      const matchesSearch = !term ||
        v.name.toLowerCase().includes(term) ||
        v.contact_number.includes(term) ||
        v.email.toLowerCase().includes(term) ||
        v.assigned_station.toLowerCase().includes(term) ||
        (v.walkie_channel && v.walkie_channel.toLowerCase().includes(term));

      const matchesStation = volunteerStationFilter === 'all' || v.assigned_station === volunteerStationFilter;
      return matchesSearch && matchesStation;
    });
  }, [stats?.volunteers, volunteerSearch, volunteerStationFilter]);

  // Download Guest CSV
  const handleDownloadGuestCSV = () => {
    const guests = stats?.guests || [];
    const lines = [
      '\uFEFF"Guest ID","Name","Category","Designation","Organization","Contact","Email","Status","Arrival Time","Vehicle No","Dietary","Escort Volunteer","Notes"'
    ];
    guests.forEach(g => {
      lines.push([
        g.id,
        g.name,
        g.category,
        g.designation,
        g.organization,
        g.contact_number,
        g.email,
        g.status,
        g.arrival_time || 'N/A',
        g.vehicle_number || 'N/A',
        g.dietary_preference,
        g.escort_volunteer || 'Unassigned',
        g.notes || ''
      ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CrossFire_2026_VIP_Guest_Protocol_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download Volunteer CSV
  const handleDownloadVolunteerCSV = () => {
    const volunteers = stats?.volunteers || [];
    const lines = [
      '\uFEFF"Volunteer ID","Name","Contact","Email","Assigned Station","Duty Shift","Attendance Status","Kit Issued","Walkie Channel","Notes"'
    ];
    volunteers.forEach(v => {
      lines.push([
        v.id,
        v.name,
        v.contact_number,
        v.email,
        v.assigned_station,
        v.shift,
        v.attendance_status,
        v.kit_issued ? 'YES' : 'NO',
        v.walkie_channel || 'N/A',
        v.notes || ''
      ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `CrossFire_2026_Volunteer_Deployment_Roster.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Admin Control Center...</p>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl m-8 border border-red-100 max-w-xl mx-auto">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <h2 className="text-lg font-bold mb-1">Failed to load Dashboard</h2>
        <p className="text-sm">{error || 'Unknown error occurred'}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold hover:bg-navy-light"
        >
          Try Again
        </button>
      </div>
    );
  }

  const kpis = [
    { 
      label: 'Registered Students', 
      value: stats?.totalUsers || 0, 
      trend: 'Verified Student Profiles', 
      color: 'text-navy', 
      bg: 'bg-navy-50' 
    },
    { 
      label: 'Competition Slots', 
      value: stats?.totalRegistrations || 0, 
      trend: 'Total Event Signups', 
      color: 'text-purple-700', 
      bg: 'bg-purple-50' 
    },
    { 
      label: 'Gate Checked-In', 
      value: stats?.checkedInCount || 0, 
      trend: `${Math.round(((stats?.checkedInCount || 0) / (stats?.totalUsers || 1)) * 100)}% Present on Campus`, 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'VIP Guests & Jury', 
      value: stats?.guestMetrics.total || 0, 
      trend: `${stats?.guestMetrics.confirmed || 0} Confirmed / ${stats?.guestMetrics.arrived || 0} Arrived`, 
      color: 'text-amber-700', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Volunteer Crew', 
      value: stats?.volunteerMetrics.total || 0, 
      trend: `${stats?.volunteerMetrics.onDuty || 0} On Duty / ${stats?.volunteerMetrics.kitsIssued || 0} Kits Issued`, 
      color: 'text-orange-700', 
      bg: 'bg-orange-50' 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Production Control Center
              </span>
              {role === 'super_admin' || user?.email === 'trueinspire@gmail.com' || user?.email === 'chandanmahapatra2400@gmail.com' ? (
                <span className="px-3 py-1 bg-purple-600/90 text-purple-100 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-purple-400/40">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>Super Admin (Tech Team &amp; DB Master)</span>
                </span>
              ) : (
                <span className="px-3 py-1 bg-blue-600/90 text-blue-100 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-blue-400/40">
                  <ShieldCheck className="w-3 h-3 text-blue-200" />
                  <span>College Admin (Srusti Official)</span>
                </span>
              )}
              <span className="text-xs text-gray-300 font-bold hidden sm:inline">
                Srusti Academy of Graduate Studies
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              CrossFire 2026 Admin Headquarters
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Master control console for student registrations, VIP guest protocol, volunteer crew deployment, emergency broadcasts, and live database sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => studentDataService.printOfficialReportWithLogo()}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              title="Print official student master roster with Srusti header"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              <span>Master Roster (PDF)</span>
            </button>

            <button
              onClick={() => studentDataService.printDeskCheckInSheet()}
              className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-white/20"
              title="Print gate check-in desk verification sheet"
            >
              <ClipboardList className="w-4 h-4 text-emerald-400" />
              <span>Desk Check-In (PDF)</span>
            </button>

            <button
              onClick={() => studentDataService.downloadExcel()}
              className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
              title="Export all student registrations to Excel spreadsheet (.xls)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={() => studentDataService.downloadCSV()}
              className="px-3.5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
              title="Export all student registrations to CSV"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="Sync with Supabase and refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">{kpi.label}</span>
            <div className="my-2">
              <span className={`text-2xl sm:text-3xl font-black ${kpi.color}`}>{kpi.value}</span>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 truncate block">{kpi.trend}</span>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'overview' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Overview & Tracks</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'students' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students ({stats?.totalUsers || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('guests')}
          className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'guests' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          <span>VIP Guests ({stats?.guestMetrics.total || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('volunteers')}
          className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'volunteers' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <HeartHandshake className="w-4 h-4 text-orange-500" />
          <span>Volunteers ({stats?.volunteerMetrics.total || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 min-w-[120px] py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'broadcast' ? 'bg-navy text-white shadow-md' : 'text-gray-500 hover:text-navy hover:bg-gray-50'
          }`}
        >
          <Send className="w-4 h-4 text-emerald-500" />
          <span>Broadcast Alerts</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW & EVENT CAPACITIES */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* MASTER STUDENT PORTAL ACCESS CONTROLLER */}
          <div className={`rounded-3xl p-6 sm:p-7 border shadow-lg transition-all ${
            isStudentPortalOpen 
              ? 'bg-gradient-to-br from-emerald-950/90 via-navy to-emerald-900 text-white border-emerald-500/40' 
              : 'bg-gradient-to-br from-amber-950/80 via-navy to-navy-dark text-white border-amber-500/30'
          }`}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow ${
                    isStudentPortalOpen 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-amber-500 text-navy-dark font-black'
                  }`}>
                    {isStudentPortalOpen ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        <span>STUDENT PORTAL LIVE • LOGIN UNLOCKED</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>REGISTRATION ACTIVE • PORTAL LOGIN LOCKED</span>
                      </>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-300">
                    Synced with Supabase <code className="text-orange-300 bg-white/10 px-1.5 py-0.5 rounded font-mono text-[10px]">system_settings.student_portal_open</code>
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isStudentPortalOpen ? 'Candidate Access Portal is Live & Unlocked' : 'Public Student Registration is Currently Active'}
                </h3>

                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                  {isStudentPortalOpen ? (
                    <>
                      Registrations are closed and the candidate portal is <strong>OPEN</strong>. Registered students can now log in using their <strong>Registered Email</strong> and <strong>Pass ID</strong> (e.g. <span className="font-mono text-orange-300 font-bold">CF26-1001</span>) to access their official digital pass, track schedule, and gate check-in barcode.
                    </>
                  ) : (
                    <>
                      Public student registration is active. Candidates can submit their registration forms on the site. Candidate portal login is <strong>temporarily locked</strong> to prevent early tampering. When registration officially concludes, click the button below to grant all registered students immediate portal login access.
                    </>
                  )}
                </p>

                {portalToggleFeedback && (
                  <div className="p-3 rounded-xl bg-white/15 border border-white/20 text-xs font-bold text-white flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{portalToggleFeedback}</span>
                  </div>
                )}
              </div>

              {/* Action Toggle Button */}
              <div className="shrink-0 flex flex-col items-start lg:items-end gap-2">
                <button
                  onClick={handleTogglePortal}
                  disabled={isTogglingPortal}
                  className={`px-6 py-4 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-xl flex items-center gap-2.5 cursor-pointer disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98] ${
                    isStudentPortalOpen
                      ? 'bg-amber-500 hover:bg-amber-600 text-navy-dark'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                  title={isStudentPortalOpen ? 'Lock student portal and reopen registration' : 'Close registration and unlock student portal for logins'}
                >
                  {isTogglingPortal ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating Database...</span>
                    </>
                  ) : isStudentPortalOpen ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Lock Portal &amp; Reopen Registration</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Close Registration &amp; Unlock Student Portal</span>
                    </>
                  )}
                </button>
                <span className="text-[10px] text-gray-400 font-medium">
                  {role === 'super_admin' ? 'Super Admin Override Authority' : 'College Executive Authority'}
                </span>
              </div>
            </div>
          </div>

          {/* 6 Event Tracks Capacities */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-navy">Competition Tracks & Seat Allocations</h3>
                <p className="text-xs text-gray-500">Live participant slot registration limits across Group A & Group B events.</p>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                ₹50,000 Total Prize Pool
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {stats?.eventsStats.map((ev) => {
                const pct = Math.min(100, Math.round((ev.registered / (ev.capacity || 1)) * 100));
                return (
                  <div key={ev.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black uppercase text-gray-400 block">{ev.group}</span>
                        <strong className="text-sm font-black text-navy">{ev.name}</strong>
                      </div>
                      <span className="text-xs font-mono font-bold text-navy bg-white px-2 py-0.5 rounded border border-gray-200">
                        {ev.registered} / {ev.capacity} Slots
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                      <span>{pct}% Capacity Filled</span>
                      <span>{ev.capacity - ev.registered} Available</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Academic Stream Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">+2 Science</span>
                <span className="text-2xl font-black text-navy mt-1 block">{stats?.streamCounts['12th Science'] || 0} Students</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">CBSE / CHSE</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">+2 Commerce</span>
                <span className="text-2xl font-black text-purple-700 mt-1 block">{stats?.streamCounts['12th Commerce'] || 0} Students</span>
              </div>
              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg">Management Track</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">+2 Arts</span>
                <span className="text-2xl font-black text-orange-700 mt-1 block">{stats?.streamCounts['12th Arts'] || 0} Students</span>
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg">Humanities & Media</span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: STUDENT REGISTRATIONS DIRECTORY */}
      {/* ============================================================== */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="relative w-full lg:w-96">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Pass ID, Student Name, Mobile or School..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <select
                value={selectedTrackFilter}
                onChange={(e) => setSelectedTrackFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy"
              >
                <option value="all">All 6 Competition Tracks</option>
                <option value="quiz">Quiz</option>
                <option value="debate">Debate</option>
                <option value="poster">Poster Making</option>
                <option value="treasure">Treasure Hunt</option>
                <option value="ramp">Ramp Walk</option>
                <option value="reels">Reels</option>
              </select>

              <select
                value={selectedStreamFilter}
                onChange={(e) => setSelectedStreamFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy"
              >
                <option value="all">All Course Streams</option>
                <option value="12th Science">12th Science</option>
                <option value="12th Commerce">12th Commerce</option>
                <option value="12th Arts">12th Arts</option>
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="registered">Registered</option>
              </select>
            </div>
          </div>

          {/* Students Sub-bar with Counts & Direct Exports */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-gray-100">
            <span className="text-xs font-bold text-gray-500">
              Showing <strong className="text-navy">{filteredStudents.length}</strong> of <strong className="text-navy">{stats?.totalUsers || 0}</strong> registered candidates
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => studentDataService.printOfficialReportWithLogo()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-navy font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-orange-500" />
                <span>Master Roster (PDF)</span>
              </button>
              <button
                onClick={() => studentDataService.printDeskCheckInSheet()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-navy font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                <span>Desk Check-In (PDF)</span>
              </button>
              <button
                onClick={() => studentDataService.downloadExcel()}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>
              <button
                onClick={() => studentDataService.downloadCSV()}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-orange-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Pass ID & Student</th>
                  <th className="py-3 px-4">Institution & City</th>
                  <th className="py-3 px-4">Stream & Board</th>
                  <th className="py-3 px-4">Selected Competitions</th>
                  <th className="py-3 px-4">Meal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                      No student records found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[10px]">
                            {s.id}
                          </span>
                          {s.is_overflow && (
                            <span 
                              className="font-bold text-[9px] text-amber-800 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1"
                              title="Registered after track capacity reached - needs seating/slot review"
                            >
                              ⚠️ OVERFLOW
                            </span>
                          )}
                          <div>
                            <strong className="text-navy font-bold block">{s.first_name} {s.last_name || ''}</strong>
                            <span className="text-[11px] text-gray-500">{s.contact_number}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-800 font-medium block">{s.institute_name}</span>
                        <span className="text-[11px] text-gray-400">{s.city_town}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-700 font-semibold block">{s.course_stream}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{s.board || 'CBSE'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {s.selected_competitions.map((comp, i) => (
                            <span key={i} className="text-[10px] font-bold text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                              {comp}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          s.food_preference === 'Veg' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-orange-700 bg-orange-50 border border-orange-200'
                        }`}>
                          {s.food_preference}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            s.status === 'confirmed' 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {s.status.toUpperCase()}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudent(s)}
                            className="p-1.5 text-navy hover:bg-navy/10 rounded-lg transition-colors cursor-pointer"
                            title="View student pass & details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleCheckIn(s)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              s.checked_in_at ? 'text-emerald-600 hover:bg-emerald-50' : 'text-gray-400 hover:bg-gray-100'
                            }`}
                            title={s.checked_in_at ? 'Checked-in (Click to revert)' : 'Check-in student'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GUEST & VIP DIGNITARY MANAGEMENT */}
      {/* ============================================================== */}
      {activeTab === 'guests' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>VIP Dignitary & Jury Protocol Console</span>
              </h3>
              <p className="text-xs text-gray-500">Track arrivals, escort volunteers, vehicle passes, and hospitality for Chief Guests.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadGuestCSV}
                className="px-3.5 py-2 bg-navy/10 hover:bg-navy/20 text-navy font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Guest List</span>
              </button>

              <button
                onClick={() => setIsAddGuestModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add VIP Guest / Jury</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={guestSearch}
                onChange={(e) => setGuestSearch(e.target.value)}
                placeholder="Search VIP name, org or phone..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={guestCategoryFilter}
              onChange={(e) => setGuestCategoryFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy w-full sm:w-auto"
            >
              <option value="all">All VIP Categories</option>
              <option value="Chief Guest">Chief Guest</option>
              <option value="Guest of Honour">Guest of Honour</option>
              <option value="Judge">Judge / Jury</option>
              <option value="Keynote Speaker">Keynote Speaker</option>
              <option value="VIP Dignitary">VIP Dignitary</option>
            </select>
          </div>

          {/* Guest Cards / Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Dignitary Name & Role</th>
                  <th className="py-3 px-4">Category & Organization</th>
                  <th className="py-3 px-4">Arrival & Parking Permit</th>
                  <th className="py-3 px-4">Escort Volunteer</th>
                  <th className="py-3 px-4 text-center">Protocol Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                      No VIP guests found. Click "Add VIP Guest" above to add dignitaries.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((g) => (
                    <tr key={g.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <strong className="text-navy font-bold text-sm block">{g.name}</strong>
                        <span className="text-[11px] text-gray-500">{g.designation}</span>
                        <span className="text-[10px] text-gray-400 block">{g.contact_number}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-navy block">{g.organization}</span>
                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded mt-0.5 ${
                          g.category === 'Chief Guest' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          g.category === 'Guest of Honour' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                          g.category === 'Judge' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {g.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-gray-700 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{g.arrival_time || '10:00 AM'}</span>
                        </div>
                        {g.vehicle_number && (
                          <span className="text-[10px] font-mono text-gray-500 block">
                            🚗 {g.vehicle_number}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-navy font-medium block">
                          {g.escort_volunteer || 'Unassigned'}
                        </span>
                        <span className="text-[10px] text-gray-400">Diet: {g.dietary_preference}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleGuestStatus(g.id, g.status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                            g.status === 'Arrived' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            g.status === 'Confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                            g.status === 'Departed' ? 'bg-gray-100 text-gray-600' :
                            'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {g.status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteGuest(g.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove guest"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: VOLUNTEER CREW DEPLOYMENT */}
      {/* ============================================================== */}
      {activeTab === 'volunteers' && (
        <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-5">
          {/* Volunteer Created Credential Alert */}
          {createdVolunteerAlert && (
            <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black shrink-0">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-emerald-950 text-sm">
                    Volunteer Credentials Created & Live in Portal
                  </h4>
                  <p className="text-xs text-emerald-800">
                    <strong>{createdVolunteerAlert.name}</strong> can now log in at the Staff portal using:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-mono text-xs font-bold text-emerald-900">
                      ID: <span className="text-orange-600">{createdVolunteerAlert.volunteer_id}</span>
                    </span>
                    <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 font-mono text-xs font-bold text-emerald-900">
                      Password: <span className="text-navy">{createdVolunteerAlert.pass}</span>
                    </span>
                    <span className="bg-emerald-100/60 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800">
                      Station: {createdVolunteerAlert.station}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCreatedVolunteerAlert(null)}
                className="self-end sm:self-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-orange-500" />
                <span>Student Volunteer & Ground Ops Staff Directory</span>
              </h3>
              <p className="text-xs text-gray-500">Manage station assignments, login credentials, duty shifts, walkie-talkie channels, and kit distribution.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleDownloadVolunteerCSV}
                className="px-3.5 py-2 bg-navy/10 hover:bg-navy/20 text-navy font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Crew List</span>
              </button>

              <button
                onClick={() => setIsAddVolunteerModalOpen(true)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Volunteer</span>
              </button>
            </div>
          </div>

          {/* Search & Station Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={volunteerSearch}
                onChange={(e) => setVolunteerSearch(e.target.value)}
                placeholder="Search volunteer name or walkie channel..."
                className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <select
              value={volunteerStationFilter}
              onChange={(e) => setVolunteerStationFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy w-full sm:w-auto"
            >
              <option value="all">All Duty Stations</option>
              <option value="Gate 1 Registration & Security">Gate 1 Registration</option>
              <option value="Auditorium A (Quiz)">Auditorium A (Quiz)</option>
              <option value="Amphitheatre (Ramp Walk)">Amphitheatre (Ramp Walk)</option>
              <option value="Hall B (Debate)">Hall B (Debate)</option>
              <option value="Art Studio Block C (Poster)">Art Studio (Poster)</option>
              <option value="Central Quad (Treasure Hunt)">Central Quad (Treasure)</option>
              <option value="Media Lab (Reels)">Media Lab (Reels)</option>
              <option value="Food & Dining Courtyard">Food Courtyard</option>
              <option value="VIP & Guest Escort Protocol">VIP Escort Protocol</option>
            </select>
          </div>

          {/* Volunteers Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-y border-gray-100">
                <tr>
                  <th className="py-3 px-4">Volunteer ID & Name</th>
                  <th className="py-3 px-4">Portal Login</th>
                  <th className="py-3 px-4">Assigned Station</th>
                  <th className="py-3 px-4">Duty Shift & Walkie</th>
                  <th className="py-3 px-4 text-center">Kit Issued</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-medium">
                      No volunteers found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredVolunteers.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-mono font-bold text-[11px] border border-orange-200">
                            {v.volunteer_id || 'VOL-100'}
                          </span>
                          <strong className="text-navy font-bold text-sm">{v.name}</strong>
                        </div>
                        <span className="text-[11px] text-gray-500 block">{v.contact_number}</span>
                        <span className="text-[10px] text-gray-400 block">{v.email || 'No institutional email'}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 w-fit">
                            <Key className="w-3 h-3 text-orange-500" />
                            <span>{v.password || 'volunteer123'}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">✓ Portal Ready</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-navy bg-navy-50 px-2.5 py-1 rounded-lg border border-navy-100">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          <span>{v.assigned_station}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-gray-700 font-semibold block">{v.shift}</span>
                        {v.walkie_channel && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded mt-0.5">
                            <Radio className="w-3 h-3" />
                            <span>{v.walkie_channel}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleKit(v.id)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            v.kit_issued ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {v.kit_issued ? 'Kit Issued ✓' : 'Not Issued'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleVolunteerAttendance(v.id, v.attendance_status)}
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                            v.attendance_status === 'Present / On Duty' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                            v.attendance_status === 'On Break' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            v.attendance_status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {v.attendance_status}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteVolunteer(v.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove volunteer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: BROADCAST NOTIFICATIONS */}
      {/* ============================================================== */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              <span>Broadcast Official Announcement</span>
            </h3>
            <p className="text-xs text-gray-500">
              Send instant push notices, WhatsApp updates, or debate topics directly to registered delegates and volunteers.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Target Audience</label>
                  <select
                    value={broadcastTarget}
                    onChange={(e) => setBroadcastTarget(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy"
                  >
                    <option value="all">All Registered Students (State-wide)</option>
                    <option value="debate">Debate Competitors Only (Topic Release)</option>
                    <option value="quiz">Quiz Teams Only</option>
                    <option value="judges">Jury Evaluators & Volunteers</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Delivery Channel</label>
                  <select
                    value={broadcastChannel}
                    onChange={(e) => setBroadcastChannel(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-navy"
                  >
                    <option value="in_app">In-App Notification Bar</option>
                    <option value="whatsapp">WhatsApp Direct Notice</option>
                    <option value="sms">SMS Blast</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Title / Subject</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Official Debate Topic Announced • Round 1 Starting"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 block mb-1 uppercase">Message Body</label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  placeholder="Type official notification message here..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-medium text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {broadcastSent && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
                    <CheckCircle className="w-4 h-4" />
                    <span>Broadcast successfully delivered!</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmit Broadcast</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-4">
            <h3 className="text-base font-black text-navy">Emergency Protocols</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200">
                <strong className="text-amber-900 block font-bold">Debate Topic Release Policy:</strong>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Debate topic will be transmitted at 09:30 AM on event morning. 15 minutes preparation window.
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200">
                <strong className="text-blue-900 block font-bold">Reels Studio Upload:</strong>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Reels videos must be filmed inside Srusti Campus and submitted by 02:30 PM.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD VIP GUEST */}
      {/* ============================================================== */}
      {isAddGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span>Add VIP Guest / Jury Member</span>
              </h3>
              <button onClick={() => setIsAddGuestModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddGuestSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Dignitary Name *</label>
                  <input
                    type="text"
                    required
                    value={newGuest.name}
                    onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                    placeholder="e.g. Prof. Saroj Choudhury"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Category *</label>
                  <select
                    value={newGuest.category}
                    onChange={(e) => setNewGuest({ ...newGuest, category: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-bold"
                  >
                    <option value="Chief Guest">Chief Guest</option>
                    <option value="Guest of Honour">Guest of Honour</option>
                    <option value="Judge">Judge / Jury</option>
                    <option value="Keynote Speaker">Keynote Speaker</option>
                    <option value="VIP Dignitary">VIP Dignitary</option>
                    <option value="Special Invitee">Special Invitee</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Designation</label>
                  <input
                    type="text"
                    value={newGuest.designation}
                    onChange={(e) => setNewGuest({ ...newGuest, designation: e.target.value })}
                    placeholder="e.g. Vice Chancellor / General Manager"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Organization *</label>
                  <input
                    type="text"
                    required
                    value={newGuest.organization}
                    onChange={(e) => setNewGuest({ ...newGuest, organization: e.target.value })}
                    placeholder="e.g. Utkal University / TCS"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={newGuest.contact_number}
                    onChange={(e) => setNewGuest({ ...newGuest, contact_number: e.target.value })}
                    placeholder="+91 9437012345"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    placeholder="vip@organization.in"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Arrival Time</label>
                  <input
                    type="text"
                    value={newGuest.arrival_time}
                    onChange={(e) => setNewGuest({ ...newGuest, arrival_time: e.target.value })}
                    placeholder="09:30 AM"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Vehicle No</label>
                  <input
                    type="text"
                    value={newGuest.vehicle_number}
                    onChange={(e) => setNewGuest({ ...newGuest, vehicle_number: e.target.value })}
                    placeholder="OD 02 AA 1001"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Dietary</label>
                  <select
                    value={newGuest.dietary_preference}
                    onChange={(e) => setNewGuest({ ...newGuest, dietary_preference: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-veg">Non-veg</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-500 block mb-1">Escort Volunteer Assigned</label>
                <input
                  type="text"
                  value={newGuest.escort_volunteer}
                  onChange={(e) => setNewGuest({ ...newGuest, escort_volunteer: e.target.value })}
                  placeholder="e.g. Subhashree Mohapatra"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                />
              </div>

              <div>
                <label className="font-bold text-gray-500 block mb-1">Protocol Notes</label>
                <textarea
                  value={newGuest.notes}
                  onChange={(e) => setNewGuest({ ...newGuest, notes: e.target.value })}
                  rows={2}
                  placeholder="Inaugural address speaker, special memento presentation..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-navy"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddGuestModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow"
                >
                  Save VIP Dignitary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD VOLUNTEER */}
      {/* ============================================================== */}
      {isAddVolunteerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                <span>Add Volunteer Crew Member</span>
              </h3>
              <button onClick={() => setIsAddVolunteerModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVolunteerSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-gray-500 block mb-1">Volunteer Full Name *</label>
                <input
                  type="text"
                  required
                  value={newVolunteer.name}
                  onChange={(e) => setNewVolunteer({ ...newVolunteer, name: e.target.value })}
                  placeholder="e.g. Subhashree Mohapatra"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={newVolunteer.contact_number}
                    onChange={(e) => setNewVolunteer({ ...newVolunteer, contact_number: e.target.value })}
                    placeholder="+91 9437198765"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    value={newVolunteer.email}
                    onChange={(e) => setNewVolunteer({ ...newVolunteer, email: e.target.value })}
                    placeholder="volunteer@srusti.edu.in"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  />
                </div>
              </div>

              {/* Portal Login Credentials Section */}
              <div className="bg-orange-50/70 border border-orange-200/80 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-orange-950 flex items-center gap-1.5 text-xs">
                    <Key className="w-3.5 h-3.5 text-orange-600" />
                    <span>Portal Sign-In Credentials</span>
                  </span>
                  <button
                    type="button"
                    onClick={generateVolunteerPassword}
                    className="text-[10px] font-bold text-orange-700 hover:text-orange-900 bg-white px-2 py-0.5 rounded-lg border border-orange-200 cursor-pointer shadow-xs"
                  >
                    Auto-Gen Password
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="font-bold text-gray-500 block mb-1 text-[11px]">Volunteer Login ID</label>
                    <input
                      type="text"
                      value={newVolunteer.volunteer_id}
                      onChange={(e) => setNewVolunteer({ ...newVolunteer, volunteer_id: e.target.value })}
                      placeholder="e.g. VOL-107"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-navy font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-500 block mb-1 text-[11px]">Login Password</label>
                    <input
                      type="text"
                      value={newVolunteer.password}
                      onChange={(e) => setNewVolunteer({ ...newVolunteer, password: e.target.value })}
                      placeholder="e.g. volunteer123"
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-navy font-mono font-bold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-tight">
                  Volunteer will sign in at Ground Ops Hub using this ID (or their email) and password.
                </p>
              </div>

              <div>
                <label className="font-bold text-gray-500 block mb-1">Assigned Duty Station *</label>
                <select
                  value={newVolunteer.assigned_station}
                  onChange={(e) => setNewVolunteer({ ...newVolunteer, assigned_station: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-bold"
                >
                  <option value="Gate 1 Registration & Security">Gate 1 Registration & Security</option>
                  <option value="Auditorium A (Quiz)">Auditorium A (Quiz)</option>
                  <option value="Amphitheatre (Ramp Walk)">Amphitheatre (Ramp Walk)</option>
                  <option value="Hall B (Debate)">Hall B (Debate)</option>
                  <option value="Art Studio Block C (Poster)">Art Studio Block C (Poster)</option>
                  <option value="Central Quad (Treasure Hunt)">Central Quad (Treasure Hunt)</option>
                  <option value="Media Lab (Reels)">Media Lab (Reels)</option>
                  <option value="Food & Dining Courtyard">Food & Dining Courtyard</option>
                  <option value="VIP & Guest Escort Protocol">VIP & Guest Escort Protocol</option>
                  <option value="Technical & Audio/Visual Control">Technical & Audio/Visual Control</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Shift</label>
                  <select
                    value={newVolunteer.shift}
                    onChange={(e) => setNewVolunteer({ ...newVolunteer, shift: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy"
                  >
                    <option value="Full Day (08:30 AM - 05:30 PM)">Full Day (08:30 AM - 05:30 PM)</option>
                    <option value="Morning Shift (08:30 AM - 01:30 PM)">Morning Shift (08:30 AM - 01:30 PM)</option>
                    <option value="Afternoon Shift (01:00 PM - 05:30 PM)">Afternoon Shift (01:00 PM - 05:30 PM)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-500 block mb-1">Walkie Channel</label>
                  <input
                    type="text"
                    value={newVolunteer.walkie_channel}
                    onChange={(e) => setNewVolunteer({ ...newVolunteer, walkie_channel: e.target.value })}
                    placeholder="CH-1 (Main Security)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-navy font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="kitIssuedCheckbox"
                  checked={newVolunteer.kit_issued}
                  onChange={(e) => setNewVolunteer({ ...newVolunteer, kit_issued: e.target.checked })}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="kitIssuedCheckbox" className="font-bold text-gray-700">
                  Volunteer T-Shirt & Identity Kit Issued
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVolunteerModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow"
                >
                  Save Volunteer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: STUDENT ADMIT PASS & QR DETAIL */}
      {/* ============================================================== */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 max-h-[90vh] flex flex-col">
            <div className="px-5 py-3.5 bg-navy text-white flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400">
                Candidate Master Record • {selectedStudent.id}
              </span>
              <button onClick={() => setSelectedStudent(null)} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-center py-2">
                <StudentQRCode
                  studentId={selectedStudent.id}
                  name={`${selectedStudent.first_name} ${selectedStudent.last_name || ''}`.trim()}
                  institute={selectedStudent.institute_name}
                  events={selectedStudent.selected_competitions}
                  foodPreference={selectedStudent.food_preference}
                  size={150}
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Student Name:</span>
                  <strong className="text-navy">{selectedStudent.first_name} {selectedStudent.last_name || ''}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Institution / College:</span>
                  <strong className="text-navy">{selectedStudent.institute_name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Contact / WhatsApp:</span>
                  <strong className="text-navy">{selectedStudent.contact_number}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Class & Stream:</span>
                  <strong className="text-navy">{selectedStudent.course_stream} ({selectedStudent.board || 'CBSE'})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Food Preference:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {selectedStudent.food_preference}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Gate Check-in:</span>
                  <span className={`font-bold px-2 py-0.5 rounded ${
                    selectedStudent.checked_in_at ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {selectedStudent.checked_in_at ? `Checked in at ${new Date(selectedStudent.checked_in_at).toLocaleTimeString()}` : 'Pending Entry'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-gray-400">Registered Events:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.selected_competitions.map((c, i) => (
                    <span key={i} className="text-xs font-bold text-navy bg-navy-50 px-3 py-1 rounded-xl border border-navy-100">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleCheckIn(selectedStudent)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    selectedStudent.checked_in_at ? 'bg-red-50 text-red-600' : 'bg-navy text-white'
                  }`}
                >
                  {selectedStudent.checked_in_at ? 'Undo Check-In' : 'Perform Check-In'}
                </button>

                <button
                  onClick={() => handleToggleStatus(selectedStudent)}
                  className={`px-4 py-2 rounded-xl font-bold ${
                    selectedStudent.status === 'confirmed' 
                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {selectedStudent.status === 'confirmed' ? 'Revert to Registered' : 'Confirm Registration'}
                </button>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 rounded-xl"
              >
                Close Pass
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
