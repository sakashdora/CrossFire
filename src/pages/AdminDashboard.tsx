import React, { useState } from 'react';
import { useAdminData } from '../hooks/useAdminData';
import { supabase } from '../lib/supabase';
import { 
  ShieldCheck, 
  CheckCircle, 
  Send, 
  Download, 
  Users,
  CalendarDays,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { stats, isLoading, error } = useAdminData();
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'debate' | 'quiz' | 'judges'>('all');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'in_app'>('whatsapp');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Loading Admin Data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl m-8 border border-red-100">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-400" />
        <h2 className="text-lg font-bold mb-1">Failed to load Dashboard</h2>
        <p className="text-sm">{error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Users', value: stats.totalUsers, trend: 'Registered Accounts', color: 'text-navy', bg: 'bg-navy-50' },
    { label: 'Total Registrations', value: stats.totalRegistrations, trend: 'Event Signups', color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: "Today's Signups", value: stats.todayRegistrations, trend: 'New Today', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Active Events', value: stats.eventsStats.length, trend: 'Currently Running', color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastMessage('');
      setBroadcastSent(false);
    }, 2500);
  };

  const handleExportCSV = async () => {
    try {
      const { data, error } = await supabase.from('registrations').select(`
        id,
        created_at,
        status,
        users ( first_name, last_name, email, contact_number, institute_name, course_stream ),
        events ( name )
      `);
      
      if (error || !data) throw error;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Registration ID,Date,Student Name,Email,Phone,Institute,Course,Event,Status\n";
      
      data.forEach(row => {
        const u = row.users as any;
        const e = row.events as any;
        const date = new Date(row.created_at).toLocaleDateString();
        const line = `"${row.id}","${date}","${u?.first_name} ${u?.last_name}","${u?.email}","${u?.contact_number}","${u?.institute_name}","${u?.course_stream}","${e?.name}","${row.status}"`;
        csvContent += line + "\n";
      });
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `CrossFire_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Export failed. Ensure you have admin privileges.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Super Admin Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Operations & Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Real-time management for Srusti Academy Talent Hunt
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="self-start md:self-auto px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Export Master Roster (CSV)</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2 hover:border-gray-300 transition-colors">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              {kpi.label}
            </span>
            <div className={`text-2xl sm:text-3xl font-black ${kpi.color}`}>
              {kpi.value}
            </div>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${kpi.bg} ${kpi.color} inline-block`}>
              {kpi.trend}
            </span>
          </div>
        ))}
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Events Oversight & Registrations */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-navy flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-orange-500" /> Event Capacity & Status
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-6 py-4">Event Track</th>
                    <th className="px-6 py-4">Registrations</th>
                    <th className="px-6 py-4">Capacity</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-medium">
                  {stats.eventsStats.map((event, idx) => {
                    const percent = (event.registered / event.capacity) * 100;
                    const statusColor = percent >= 100 ? 'text-red-600 bg-red-50 border-red-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';
                    const statusText = percent >= 100 ? 'Full' : 'Open';
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-gray-900">{event.name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{event.registered}</span>
                            <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full ${percent >= 100 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${Math.min(percent, 100)}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{event.capacity} Max</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Detailed Registration Data Table */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-navy flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" /> Recent Registrations Table
              </h2>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-500 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Event</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stats.recentRegistrations.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No registrations found</td></tr>
                  ) : (
                    stats.recentRegistrations.map((reg, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-900">{reg.users?.first_name} {reg.users?.last_name}</td>
                        <td className="px-4 py-3 text-gray-500 truncate max-w-[150px]">{reg.users?.email}</td>
                        <td className="px-4 py-3 text-gray-700">{reg.events?.name}</td>
                        <td className="px-4 py-3 text-gray-400">{new Date(reg.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${reg.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                            {reg.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Operations & Broadcast */}
        <div className="space-y-6">
          
          {/* Recent Signups Feed */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-black text-navy flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-emerald-500" /> Live Signups Feed
            </h2>
            <div className="space-y-3">
              {stats.recentRegistrations.slice(0, 5).length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recent signups.</p>
              ) : (
                stats.recentRegistrations.slice(0, 5).map((reg, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {reg.users?.first_name?.[0] || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">{reg.users?.first_name} {reg.users?.last_name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{reg.events?.name}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap mt-1">
                      {new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Mass Broadcasting (WhatsApp/SMS) */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              <span>Mass Broadcaster</span>
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Send an emergency broadcast or schedule update to targeted cohorts. Overrides "Do Not Disturb" settings.
            </p>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl overflow-hidden">
                <button type="button" onClick={() => setBroadcastChannel('whatsapp')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'whatsapp' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>WhatsApp</button>
                <button type="button" onClick={() => setBroadcastChannel('sms')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'sms' ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>SMS Gateway</button>
                <button type="button" onClick={() => setBroadcastChannel('in_app')} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${broadcastChannel === 'in_app' ? 'bg-purple-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>In-App Alert</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setBroadcastTarget('all')} className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'all' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>All Attendees</button>
                <button type="button" onClick={() => setBroadcastTarget('debate')} className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'debate' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Debate Track</button>
                <button type="button" onClick={() => setBroadcastTarget('quiz')} className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'quiz' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>Quiz Track</button>
                <button type="button" onClick={() => setBroadcastTarget('judges')} className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors border ${broadcastTarget === 'judges' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>All Judges</button>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Message Payload</label>
                <textarea 
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none h-24"
                  placeholder="e.g. EMERGENCY: Ramp Walk venue shifted to Main Auditorium A..."
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={broadcastSent || !broadcastMessage.trim()}
                className={`w-full py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 ${broadcastSent ? 'bg-emerald-500 text-white' : 'bg-navy hover:bg-navy-light text-white'}`}
              >
                {broadcastSent ? (
                  <><CheckCircle className="w-4 h-4" /> Delivered to Gateway</>
                ) : (
                  <><Send className="w-4 h-4" /> Transmit Broadcast</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
