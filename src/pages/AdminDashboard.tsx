import React, { useState, useMemo } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { studentDataService, StudentRegistrationRecord } from '../services/studentDataService';
import { 
  ShieldCheck, 
  CheckCircle, 
  Send, 
  Download, 
  Printer,
  Users, 
  CalendarDays, 
  FileSpreadsheet, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Mail, 
  MessageCircle, 
  BookOpen,
  X,
  Eye,
  Award
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { stats, isLoading, error, refreshStats } = useAdminData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState('all');
  const [selectedStreamFilter, setSelectedStreamFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  
  // Selected student for detail modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRegistrationRecord | null>(null);

  // Broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'debate' | 'quiz' | 'judges'>('all');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'in_app'>('whatsapp');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshStats();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Toggle student confirmed/registered status
  const handleToggleStatus = (student: StudentRegistrationRecord) => {
    const newStatus = student.status === 'confirmed' ? 'registered' : 'confirmed';
    studentDataService.updateStudentStatus(student.id, { status: newStatus });
    refreshStats();
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

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 2500);
  };

  // Filtered students list
  const filteredStudents = useMemo(() => {
    if (!stats?.allStudents) return [];
    return stats.allStudents.filter(student => {
      // Search filter
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        student.first_name.toLowerCase().includes(term) ||
        (student.last_name && student.last_name.toLowerCase().includes(term)) ||
        student.email.toLowerCase().includes(term) ||
        student.contact_number.includes(term) ||
        student.institute_name.toLowerCase().includes(term) ||
        student.city_town.toLowerCase().includes(term) ||
        student.id.toLowerCase().includes(term);

      // Track filter
      const matchesTrack = selectedTrackFilter === 'all' || 
        student.selected_competitions.some(c => c.toLowerCase().includes(selectedTrackFilter.toLowerCase()));

      // Stream filter
      const matchesStream = selectedStreamFilter === 'all' || 
        student.course_stream === selectedStreamFilter;

      // Status filter
      const matchesStatus = selectedStatusFilter === 'all' || 
        student.status === selectedStatusFilter;

      return matchesSearch && matchesTrack && matchesStream && matchesStatus;
    });
  }, [stats?.allStudents, searchTerm, selectedTrackFilter, selectedStreamFilter, selectedStatusFilter]);

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
      label: "Today's Signups", 
      value: stats?.todayRegistrations || 0, 
      trend: 'New Today', 
      color: 'text-emerald-700', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Checked-in at Gate', 
      value: stats?.checkedInCount || 0, 
      trend: 'On-Campus Verified', 
      color: 'text-orange-600', 
      bg: 'bg-orange-50' 
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden border border-navy-light/40">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Control Center
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Live Real-Time
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <span>Operations & Master Roster</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
            Srusti Academy of Graduate Studies • State-Level +2 Talent Hunt Student Directory & Event Operations
          </p>
        </div>

        {/* Action Buttons: CSV & Official Print Roster with Logo */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleRefresh}
            title="Refresh Live Data"
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 hover:border-white/20"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => studentDataService.downloadCSV()}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition-all border border-white/20 hover:scale-105 active:scale-95"
            title="Download CSV with CrossFire Logo URL & Full Records"
          >
            <Download className="w-4 h-4 text-orange-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => studentDataService.printOfficialReportWithLogo()}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            title="Open printable official document with CrossFire Logo & Srusti Academy Header"
          >
            <Printer className="w-4 h-4" />
            <span>Download Official Roster (Logo)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2 hover:border-gray-300 transition-all hover:shadow-md">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              {kpi.label}
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${kpi.color}`}>
              {kpi.value}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${kpi.bg} ${kpi.color} inline-block`}>
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Stream Distribution & Track Capacity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stream Breakdown */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-sm font-black text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-orange-500" /> Stream Distribution
          </h2>
          <div className="space-y-4">
            {Object.entries(stats?.streamCounts || {}).map(([stream, count]) => {
              const total = stats?.totalUsers || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={stream}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-700">{stream}</span>
                    <span className="text-navy">{count} students ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        stream.includes('Science') ? 'bg-blue-500' :
                        stream.includes('Commerce') ? 'bg-purple-500' : 'bg-orange-500'
                      }`} 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Track Capacity Saturation */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-orange-500" /> Event Capacity & Saturation Tracker
            </h2>
            <span className="text-xs text-gray-500">6 Competition Tracks</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {stats?.eventsStats.map((event, idx) => {
              const pct = Math.min(Math.round((event.registered / event.capacity) * 100), 100);
              const isFull = event.registered >= event.capacity;
              return (
                <div key={idx} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/70 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-1.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">{event.group}</span>
                      <h4 className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{event.name}</h4>
                    </div>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {isFull ? 'FULL' : 'OPEN'}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-xs font-bold text-gray-600 mb-1">
                    <span>{event.registered} slots</span>
                    <span className="text-[10px] text-gray-400">Cap: {event.capacity}</span>
                  </div>

                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Student Records Section */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Toolbar: Search & Filters */}
        <div className="p-5 sm:p-6 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-navy flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-orange-500" />
                <span>Student Master Roster ({filteredStudents.length})</span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time synchronized participant database with contact & competition details
              </p>
            </div>

            {/* Quick Export from Table Toolbar */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => studentDataService.downloadCSV()}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-gray-500" />
                <span>Download CSV</span>
              </button>
              <button
                onClick={() => studentDataService.printOfficialReportWithLogo()}
                className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-orange-500" />
                <span>Print Document</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, school, phone..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Track Filter */}
            <div>
              <select
                value={selectedTrackFilter}
                onChange={(e) => setSelectedTrackFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
              >
                <option value="all">All Competitions (6)</option>
                <option value="Quiz">Quiz</option>
                <option value="Debate">Debate</option>
                <option value="Poster Making">Poster Making</option>
                <option value="Treasure Hunt">Treasure Hunt</option>
                <option value="Ramp Walk">Ramp Walk</option>
                <option value="Reels">Reels</option>
              </select>
            </div>

            {/* Stream Filter */}
            <div>
              <select
                value={selectedStreamFilter}
                onChange={(e) => setSelectedStreamFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
              >
                <option value="all">All Streams</option>
                <option value="12th Science">12th Science</option>
                <option value="12th Commerce">12th Commerce</option>
                <option value="12th Arts">12th Arts</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="confirmed">Confirmed</option>
                <option value="registered">Registered (Pending Review)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Records Table */}
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3.5">Pass ID</th>
                <th className="px-4 py-3.5">Student Details</th>
                <th className="px-4 py-3.5">Contact Info</th>
                <th className="px-4 py-3.5">Institution & Stream</th>
                <th className="px-4 py-3.5">Registered Tracks</th>
                <th className="px-4 py-3.5">Food</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    <p className="font-semibold text-sm">No student registrations found matching your filters.</p>
                    <p className="text-xs text-gray-400 mt-1">Try clearing your search query or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const regDate = new Date(student.created_at).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  });
                  const isCheckedIn = Boolean(student.checked_in_at);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Pass ID */}
                      <td className="px-4 py-3.5 font-black text-navy whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-navy-50 text-navy font-mono text-[11px] border border-navy-100">
                          {student.id}
                        </span>
                      </td>

                      {/* Student Details */}
                      <td className="px-4 py-3.5 min-w-[160px]">
                        <div className="font-bold text-gray-900 text-xs">
                          {student.first_name} {student.last_name}
                        </div>
                        <div className="text-[11px] text-gray-500 truncate max-w-[180px]">
                          {student.city_town}
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3.5 min-w-[180px]">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${student.email}`} className="truncate max-w-[150px] hover:text-navy hover:underline">
                            {student.email}
                          </a>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[11px] text-gray-500 font-mono">{student.contact_number}</span>
                          <a
                            href={`https://wa.me/${(student.whatsapp_number || student.contact_number).replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200"
                            title="Open WhatsApp Chat"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>WA</span>
                          </a>
                        </div>
                      </td>

                      {/* Institution & Stream */}
                      <td className="px-4 py-3.5 min-w-[180px]">
                        <div className="font-semibold text-gray-800 text-[11px] truncate max-w-[190px]" title={student.institute_name}>
                          {student.institute_name}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {student.course_stream} • {student.board || 'CBSE'}
                        </div>
                      </td>

                      {/* Registered Tracks */}
                      <td className="px-4 py-3.5 min-w-[180px]">
                        <div className="flex flex-wrap gap-1">
                          {student.selected_competitions.map((comp, i) => (
                            <span 
                              key={i} 
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 whitespace-nowrap"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Food */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          student.food_preference === 'Veg' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {student.food_preference}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap text-[11px]">
                        {regDate}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleToggleStatus(student)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                            student.status === 'confirmed' 
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          }`}
                          title="Click to toggle status"
                        >
                          {student.status}
                        </button>
                        {isCheckedIn && (
                          <span className="block text-[9px] font-bold text-emerald-600 mt-0.5">
                            Gate Checked-In
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="p-1.5 text-navy hover:text-orange-600 bg-gray-100 hover:bg-orange-50 rounded-lg transition-colors"
                          title="View Full Profile Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Broadcast Center & Ground Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mass Broadcast Center */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              <span>CrossFire Mass Broadcast Gateway</span>
            </h3>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200">
              WhatsApp & In-App Alerts
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Dispatch official schedule updates, debate topics, or venue instructions to all registered participants or specific cohorts.
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-hidden">
              <button 
                type="button" 
                onClick={() => setBroadcastChannel('whatsapp')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'whatsapp' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                WhatsApp Gateway
              </button>
              <button 
                type="button" 
                onClick={() => setBroadcastChannel('sms')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'sms' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                SMS Gateway
              </button>
              <button 
                type="button" 
                onClick={() => setBroadcastChannel('in_app')} 
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'in_app' ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                In-App Priority Alert
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button 
                type="button" 
                onClick={() => setBroadcastTarget('all')} 
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'all' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                All Attendees ({stats?.totalUsers})
              </button>
              <button 
                type="button" 
                onClick={() => setBroadcastTarget('debate')} 
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'debate' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                Debate Cohort
              </button>
              <button 
                type="button" 
                onClick={() => setBroadcastTarget('quiz')} 
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'quiz' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                Quiz Finalists
              </button>
              <button 
                type="button" 
                onClick={() => setBroadcastTarget('judges')} 
                className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'judges' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                All Judges (Staff)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Broadcast Message</label>
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none h-24 outline-none"
                placeholder="e.g. NOTICE: Debate preliminary topic released. Report to Seminar Hall B at 1:15 PM sharp with ID badges."
                required
              />
            </div>

            <button 
              type="submit"
              disabled={broadcastSent || !broadcastMessage.trim()}
              className={`w-full py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${broadcastSent ? 'bg-emerald-500 text-white' : 'bg-navy hover:bg-navy-light text-white'}`}
            >
              {broadcastSent ? (
                <><CheckCircle className="w-4 h-4" /> Message Delivered Successfully</>
              ) : (
                <><Send className="w-4 h-4" /> Transmit Official Broadcast</>
              )}
            </button>
          </form>
        </div>

        {/* Live Feed & Campus Coordination */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Recent Activity Stream
          </h3>

          <div className="space-y-3">
            {stats?.recentRegistrations.slice(0, 5).map((student, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-black text-xs flex items-center justify-center shrink-0">
                  {student.first_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {student.first_name} {student.last_name}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono">{student.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{student.institute_name}</p>
                  <p className="text-[10px] text-orange-600 font-semibold mt-0.5">
                    {student.selected_competitions.join(' • ')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <div className="bg-blue-50/70 rounded-2xl p-3 border border-blue-100 text-[11px] text-blue-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-blue-800">
                <Award className="w-3.5 h-3.5 text-blue-600" /> Srusti Academy Registration Desk
              </span>
              <p className="text-blue-700/90 text-[10px] leading-relaxed">
                Organizers: Mr. N.R. Swain (+91-7008671339) & Mr. A. Meher (+91-8455090984).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="bg-navy text-white p-6 relative">
              <button 
                onClick={() => setSelectedStudent(null)}
                className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-mono font-bold uppercase tracking-wider border border-orange-500/30">
                {selectedStudent.id}
              </span>
              <h3 className="text-xl font-black text-white mt-2">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </h3>
              <p className="text-xs text-gray-300">{selectedStudent.institute_name}</p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Email</span>
                  <a href={`mailto:${selectedStudent.email}`} className="font-semibold text-navy hover:underline break-all">
                    {selectedStudent.email}
                  </a>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Phone Number</span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold font-mono text-gray-800">{selectedStudent.contact_number}</span>
                    <a
                      href={`https://wa.me/${selectedStudent.whatsapp_number.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">City / Town</span>
                  <span className="font-semibold text-gray-800">{selectedStudent.city_town}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Course Stream</span>
                  <span className="font-semibold text-gray-800">{selectedStudent.course_stream}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Board</span>
                  <span className="font-semibold text-gray-800">{selectedStudent.board || 'CBSE'}</span>
                </div>
              </div>

              {/* Selected Tracks */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-2">Registered Competition Tracks</span>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.selected_competitions.map((track, i) => (
                    <span key={i} className="px-3 py-1 rounded-xl text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                      🏆 {track}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferences & Registration Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Food Preference</span>
                  <span className="font-bold text-gray-800">{selectedStudent.food_preference}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <span className="text-[10px] font-bold uppercase text-gray-400 block mb-0.5">Registered On</span>
                  <span className="font-semibold text-gray-800">
                    {new Date(selectedStudent.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Quick Actions in Modal */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => handleToggleCheckIn(selectedStudent)}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all flex items-center justify-center gap-1.5 ${
                    selectedStudent.checked_in_at 
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                      : 'bg-navy text-white hover:bg-navy-light'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{selectedStudent.checked_in_at ? 'Gate Verified (Check-in Done)' : 'Mark Campus Check-in'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
