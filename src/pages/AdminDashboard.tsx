import React, { useState } from 'react';
import { INITIAL_EVENTS } from '../data/mockData';
import { 
  ShieldCheck, 
  CheckCircle, 
  Send, 
  Download, 
  Gavel
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'debate' | 'quiz' | 'judges'>('all');
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'in_app'>('whatsapp');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);

  const kpis = [
    { label: 'Total Registrations', value: '245 / 300', trend: '81.6% capacity', color: 'text-navy', bg: 'bg-navy-50' },
    { label: "Today's Venue Check-in", value: '184', trend: 'QR Checked', color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Scoring Completed', value: '4 of 6 Tracks', trend: 'In Progress', color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Prize Budget Active', value: '₹81,000', trend: 'Allocated', color: 'text-purple-700', bg: 'bg-purple-50' },
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

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,ID,Student Name,Email,School,Board,Events Registered,Total Score\n"
      + "1,Rohan Mohanty,rohan@example.com,Buxi Jagabandhu,CBSE,2,188.5\n"
      + "2,Ananya Dash,ananya@example.com,Mothers Public,CBSE,2,184.0\n"
      + "3,Aarav Pattnaik,student@srusti.edu.in,DAV Chandrasekharpur,CBSE,2,179.5\n";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "CrossFire_2026_Registrations.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Admin Header */}
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
            Real-time management for Srusti Academy Talent Hunt • November 15, 2026
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
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2">
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
        
        {/* Left 2 Cols: Events & Judge Oversight Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-black text-navy flex items-center gap-2">
                <Gavel className="w-5 h-5 text-orange-500" />
                <span>Track Logistics & Judge Assignment Status</span>
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100">
                    <th className="py-3 px-3">Event Name</th>
                    <th className="py-3 px-3 text-center">Format</th>
                    <th className="py-3 px-3 text-center">Registrations</th>
                    <th className="py-3 px-3">Assigned Judge</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {INITIAL_EVENTS.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50/80">
                      <td className="py-3 px-3 font-bold text-navy">
                        {event.name}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-500">
                        {event.event_type === 'solo' ? 'Solo' : `Team (${event.team_size})`}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-navy">
                        {event.current_participants} / {event.max_participants}
                      </td>
                      <td className="py-3 px-3 text-gray-700">
                        Dr. M. Senapati & Panel
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Ready ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stream Demographics Breakdown (Google Form Data) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
              <span>+2 Stream Demographics & Participation Ratios</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-900">12th Science</span>
                  <span className="text-xs font-black text-blue-700 bg-blue-200/60 px-2 py-0.5 rounded-full">58.0%</span>
                </div>
                <div className="text-2xl font-black text-blue-950">142 Students</div>
                <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '58%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-purple-900">12th Commerce</span>
                  <span className="text-xs font-black text-purple-700 bg-purple-200/60 px-2 py-0.5 rounded-full">27.7%</span>
                </div>
                <div className="text-2xl font-black text-purple-950">68 Students</div>
                <div className="w-full bg-purple-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: '27.7%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-amber-900">12th Arts</span>
                  <span className="text-xs font-black text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">14.3%</span>
                </div>
                <div className="text-2xl font-black text-amber-950">35 Students</div>
                <div className="w-full bg-amber-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-amber-600 h-full rounded-full" style={{ width: '14.3%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Super Admin Dispute & Judge Score Unlock Control */}
          <div className="bg-white rounded-2xl border border-orange-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-navy flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-orange-100 text-orange-600">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <span>Judge Dispute Desk & Score Unlock Authority</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Super Admin override power to unlock evaluated candidate scores if judging errors or appeals occur.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">Rohan Mohanty & Ayush Dash</span>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">BJB English Medium</span>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Track: Intelect Odyssey (Quiz) • Locked Score: <strong className="text-navy">92.0 Pts</strong> (Dr. M. Senapati)
                  </p>
                </div>
                <button
                  onClick={() => alert("Score for Rohan Mohanty & Ayush Dash unlocked. Judge Dr. M. Senapati may now revise the rubric.")}
                  className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 font-bold rounded-lg shadow-sm transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Unlock for Revision</span>
                </button>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-navy">Ananya Dash</span>
                    <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Mothers Public School</span>
                  </div>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    Track: Glam 'n' Dazzle (Ramp Walk) • Locked Score: <strong className="text-navy">94.5 Pts</strong> (Prof. A. Ray)
                  </p>
                </div>
                <button
                  onClick={() => alert("Score for Ananya Dash unlocked. Judge Prof. A. Ray may now revise the rubric.")}
                  className="px-3 py-1.5 bg-white hover:bg-orange-50 text-orange-600 border border-orange-300 font-bold rounded-lg shadow-sm transition-all text-xs flex items-center justify-center gap-1.5"
                >
                  <span>Unlock for Revision</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Instant Broadcast Console */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-base font-black text-navy flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-500" />
              <span>Instant Broadcast Desk</span>
            </h3>
            <p className="text-xs text-gray-500">
              Transmit urgent debate topics, schedule changes, or score announcements via Twilio WhatsApp / SMS / App notifications.
            </p>

            {broadcastSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Message broadcasted successfully to all target recipients!</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-3">
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
                  <option value="debate">War of Words Debate Finalists</option>
                  <option value="quiz">Brain Buzz Quiz Teams</option>
                  <option value="judges">Evaluation Judges Panel</option>
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
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                      broadcastChannel === 'whatsapp' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastChannel('sms')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                      broadcastChannel === 'sms' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => setBroadcastChannel('in_app')}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-colors ${
                      broadcastChannel === 'in_app' ? 'bg-navy text-white border-navy' : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    In-App
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                  Announcement / Topic Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Debate Topic for Semi-Finals: 'Is Artificial Intelligence empowering or diluting human critical thinking?' Preparation starts now."
                  className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Broadcast</span>
              </button>
            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
