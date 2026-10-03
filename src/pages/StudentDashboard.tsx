import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Registration } from '../types';
import { INITIAL_LEADERBOARD, INITIAL_NOTIFICATIONS } from '../data/mockData';
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
  Video,
  Palette
} from 'lucide-react';

interface StudentDashboardProps {
  userRegistrations: Registration[];
  onWithdrawEvent: (registrationId: string) => void;
  onSubmitMedia: (registrationId: string, url: string) => void;
  setCurrentView: (view: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  userRegistrations,
  onWithdrawEvent,
  onSubmitMedia,
  setCurrentView,
}) => {
  const { user } = useAuth();
  const [mediaModalRegId, setMediaModalRegId] = useState<string | null>(null);
  const [mediaLink, setMediaLink] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const notifications = INITIAL_NOTIFICATIONS;
  const leaderboard = INITIAL_LEADERBOARD.slice(0, 5);

  const handleMediaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaModalRegId || !mediaLink.trim()) return;

    onSubmitMedia(mediaModalRegId, mediaLink.trim());
    setUploadSuccess(true);
    setTimeout(() => {
      setMediaModalRegId(null);
      setMediaLink('');
      setUploadSuccess(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-orange-500/30">
              Student Competitor Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white">
            Welcome, {user?.first_name || 'Champion'}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl">
            Srusti Campus is ready for your showdown on November 15, 2026. Track your registered events, live scores, and announcements right here.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-center min-w-[130px]">
            <span className="text-2xl font-black text-orange-400 block">
              {userRegistrations.length}/2
            </span>
            <span className="text-[11px] text-gray-300 font-medium">Events Registered</span>
          </div>

          {userRegistrations.length < 2 && (
            <button
              onClick={() => setCurrentView('events')}
              className="px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Events (Left 2 cols) & Sidebar (Right 1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Registered Events */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-navy flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              <span>Your Enrolled Tracks (Max 2)</span>
            </h2>
            <span className="text-xs font-semibold text-gray-500">
              {userRegistrations.length} Active Enrollment(s)
            </span>
          </div>

          {userRegistrations.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-8 sm:p-12 text-center space-y-4">
              <div className="w-14 h-14 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">No Events Registered Yet</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  You are eligible to participate in up to 2 competitive events. Explore the 6 tracks and lock in your participation before registration closes!
                </p>
              </div>
              <button
                onClick={() => setCurrentView('events')}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Browse & Register Tracks
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userRegistrations.map((reg) => {
                const event = reg.event;
                const isMediaRequired = event?.slug === 'reels' || event?.slug === 'poster-making';

                return (
                  <div
                    key={reg.id}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                            {event?.event_type === 'solo' ? 'Individual' : `Team: ${reg.team_name || 'Team'}`}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-xs text-gray-500 font-medium">Nov 15, 2026</span>
                        </div>
                        <h3 className="text-lg font-bold text-navy mt-0.5">{event?.name || 'CrossFire Event'}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        {reg.score !== undefined && reg.score !== null ? (
                          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right">
                            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Official Score</span>
                            <span className="text-base font-black text-emerald-800">{reg.score} / 100</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5" />
                            Awaiting Evaluation
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team members list if team event */}
                    {reg.team_members && reg.team_members.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded-xl text-xs">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                          Team Lineup:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-navy font-semibold">
                            ★ {user?.first_name} (Lead)
                          </span>
                          {reg.team_members.map((m, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                              {m.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Media Submission Status */}
                    {isMediaRequired && (
                      <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-navy block flex items-center gap-1.5">
                            {event?.slug === 'reels' ? <Video className="w-4 h-4 text-orange-500" /> : <Palette className="w-4 h-4 text-orange-500" />}
                            {event?.slug === 'reels' ? 'Reels Video Upload (<50MB)' : 'Poster Digital Artwork'}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            {reg.media_url ? (
                              <span className="text-emerald-700 font-medium">✓ Uploaded: {reg.media_url}</span>
                            ) : (
                              'Submission deadline: Nov 14, 06:00 PM'
                            )}
                          </span>
                        </div>

                        <button
                          onClick={() => setMediaModalRegId(reg.id)}
                          className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{reg.media_url ? 'Replace File' : 'Upload Submission'}</span>
                        </button>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between text-xs pt-2">
                      <span className="text-gray-500">
                        Venue: <strong>{event?.venue_location}</strong>
                      </span>

                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to withdraw from this event? Your slot will be freed.')) {
                            onWithdrawEvent(reg.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Withdraw Entry</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Srusti Event Schedule Cheat Sheet */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
              Nov 15, 2026 Campus Timeline
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="font-semibold text-gray-700">08:30 AM - 09:30 AM</span>
                <span className="text-gray-500">Campus Check-in & Badge Distribution</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-semibold text-gray-700">09:30 AM - 11:30 AM</span>
                <span className="text-orange-600 font-bold">Quiz Preliminary & Stage Finals</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-semibold text-gray-700">11:30 AM - 01:00 PM</span>
                <span className="text-navy font-bold">Glam Walk Runway Show</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-semibold text-gray-700">01:30 PM - 03:00 PM</span>
                <span className="text-navy font-bold">Debate & Poster Final Judgement</span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="font-semibold text-gray-700">03:30 PM - 04:30 PM</span>
                <span className="text-emerald-700 font-bold">Grand Prize Distribution Ceremony</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar (Profile + Live Leaderboard + Notifications) */}
        <div className="space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-lg shadow-md">
                {user?.first_name?.[0] || 'S'}
              </div>
              <div>
                <h3 className="font-bold text-navy text-sm">{user?.first_name} {user?.last_name}</h3>
                <span className="text-xs text-gray-500 block">{user?.email}</span>
                <span className="inline-block mt-0.5 text-[10px] font-bold uppercase px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                  {user?.board} Board Student
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-xs space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{user?.school_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>DOB: {user?.date_of_birth}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Parental Consent on Record</span>
              </div>
            </div>
          </div>

          {/* Mini Leaderboard Widget */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-500" />
                <span>Live Standings</span>
              </h3>
              <button
                onClick={() => setCurrentView('leaderboard')}
                className="text-[11px] font-bold text-orange-600 hover:underline"
              >
                Full Board ▶
              </button>
            </div>

            <div className="space-y-1.5">
              {leaderboard.map((item) => (
                <div
                  key={item.rank}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    item.is_current_user 
                      ? 'bg-orange-100/70 border border-orange-300 font-bold text-navy' 
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-5 text-center font-black ${
                      item.rank === 1 ? 'text-amber-500' : item.rank === 2 ? 'text-slate-400' : 'text-amber-700'
                    }`}>
                      {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                    </span>
                    <span className="truncate">{item.participant_name}</span>
                  </div>
                  <span className="font-black text-navy ml-2">{item.total_score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications Widget */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-navy flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-orange-500" />
              <span>Campus Alerts</span>
            </h3>
            <div className="space-y-2.5">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-navy-50/50 border border-navy-100/50 text-xs">
                  <p className="font-bold text-navy">{notif.title}</p>
                  <p className="text-[11px] text-gray-600 mt-0.5">{notif.message}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Media Upload Modal */}
      {mediaModalRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <h3 className="text-lg font-bold text-navy">Submit Media File / Link</h3>
            <p className="text-xs text-gray-600">
              Paste the public Google Drive, YouTube Unlisted, Instagram Reel, or Supabase Storage link for your submission:
            </p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Media link saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleMediaSubmit} className="space-y-3">
              <input
                type="url"
                required
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMediaModalRegId(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                >
                  Confirm Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
