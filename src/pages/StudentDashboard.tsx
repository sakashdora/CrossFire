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
  Sparkles 
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
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* SECTION 1: DIGITAL EVENT PASS & QUICK ID */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy-dark rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Student Dossier */}
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-orange-400 text-[10px] font-black uppercase tracking-wider border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Competitor Badge • CrossFire 2026</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-white">
              {user?.first_name} {user?.last_name || 'Competitor'}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-gray-300">
              <span className="flex items-center gap-1">
                <School className="w-4 h-4 text-orange-400" />
                {user?.institute_name || user?.school_name || 'DAV Public School'}
              </span>
              <span>•</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-white font-bold">
                {user?.course_stream || '12th Science'}
              </span>
              <span>•</span>
              <span>City: {user?.city_town || 'Bhubaneswar'}</span>
            </div>

            {/* Food token and Check-in indicators */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                <span>{user?.food_preference || 'Veg'} Lunch Token Active</span>
              </span>

              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pass ID: CF-2026-{user?.first_name?.slice(0, 3).toUpperCase() || 'STD'}</span>
              </span>
            </div>
          </div>

          {/* QR Code Pass Box */}
          <div className="bg-white text-navy p-5 rounded-2xl shadow-xl flex flex-col items-center text-center min-w-[200px]">
            <div className="w-28 h-28 bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center justify-center relative">
              {/* Simulated QR Code Pattern */}
              <div className="grid grid-cols-4 gap-1 w-full h-full p-1 opacity-90">
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-orange-500 rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-transparent"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-orange-500 rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-transparent"></div>
                <div className="bg-navy rounded-sm"></div>
                <div className="bg-navy rounded-sm"></div>
              </div>
            </div>
            <span className="text-[10px] uppercase font-black text-gray-400 tracking-wider mt-2 block">
              Scan at Gate & Meal Counter
            </span>
          </div>

        </div>
      </div>

      {/* SECTION 2: REGISTERED EVENTS & ROOM GUIDE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-navy flex items-center gap-2">
              <Compass className="w-6 h-6 text-orange-500" />
              <span>Event Details, Venues & Reporting Rooms</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live schedule, room numbers, and judge evaluation status for your chosen tracks.
            </p>
          </div>

          {userRegistrations.length < 2 && (
            <button
              onClick={() => setCurrentView('events')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Another Track ({userRegistrations.length}/2)</span>
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
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow"
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
                  className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                          Track #{index + 1} • {event?.group || 'Group A'}
                        </span>
                        <h3 className="text-lg font-black text-navy mt-1">{event?.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{event?.description}</p>
                      </div>

                      {reg.score !== undefined && reg.score !== null ? (
                        <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-right flex-shrink-0">
                          <span className="text-[10px] text-emerald-700 font-bold uppercase block">Official Score</span>
                          <span className="text-lg font-black text-emerald-800">{reg.score} / 100</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                          Awaiting Call
                        </span>
                      )}
                    </div>

                    {/* Room & Venue Assignment Card */}
                    <div className="p-4 rounded-2xl bg-navy-50/80 border border-navy-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-bold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500" />
                          Assigned Stage & Room:
                        </span>
                        <span className="text-navy font-black text-xs sm:text-sm">
                          {event?.venue_location}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-navy-100/60">
                        <span className="text-gray-500 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-orange-500" />
                          Reporting Time:
                        </span>
                        <span className="text-navy font-bold">
                          Nov 15, 2026 • 09:15 AM
                        </span>
                      </div>
                    </div>

                    {/* Media Upload Area for Reels / Poster */}
                    {isMediaRequired && (
                      <div className="p-3.5 rounded-2xl bg-orange-50/60 border border-orange-100 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <strong className="text-navy block">
                            {event?.slug === 'reels' ? 'Reel Video Link' : 'Digital Artwork Scan'}
                          </strong>
                          <span className="text-[11px] text-gray-500">
                            {reg.media_url ? `✓ Uploaded: ${reg.media_url}` : 'Submission deadline: Nov 14, 06:00 PM'}
                          </span>
                        </div>

                        <button
                          onClick={() => setMediaModalRegId(reg.id)}
                          className="px-3 py-1.5 bg-navy hover:bg-navy-light text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 flex-shrink-0"
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
                      Format: <strong>{event?.event_type === 'solo' ? 'Individual' : `Team of ${event?.team_size}`}</strong>
                    </span>

                    <button
                      onClick={() => {
                        if (confirm('Withdraw from this event? Your slot will be released.')) {
                          onWithdrawEvent(reg.id);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1 hover:underline"
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

      {/* SECTION 3: CAMPUS TIMELINE & NOTIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Srusti Campus Schedule */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-black text-navy flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span>Campus Event Schedule • Nov 15, 2026</span>
          </h3>

          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-gray-700">08:30 AM - 09:30 AM</span>
              <span className="text-gray-500">Campus Entry & QR Badge Scanning at Gate 1</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-navy">09:30 AM - 11:30 AM</span>
              <span className="text-orange-600 font-bold">Intelect Odyssey (Quiz) — Auditorium A</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-navy">11:30 AM - 01:00 PM</span>
              <span className="text-navy font-bold">Glam 'n' Dazzle (Ramp Walk) — Amphitheatre</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-emerald-700">01:00 PM - 02:00 PM</span>
              <span className="text-emerald-700 font-bold">Complimentary Lunch at Dining Courtyard</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-navy">02:00 PM - 03:30 PM</span>
              <span className="text-navy font-bold">Spontanity Erena & Spectrum on Canvas</span>
            </div>
            <div className="py-2.5 flex items-center justify-between">
              <span className="font-bold text-orange-600">03:30 PM - 04:30 PM</span>
              <span className="text-orange-600 font-black">Grand Trophy Presentation & Cash Distribution</span>
            </div>
          </div>
        </div>

        {/* Live Notifications */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-black text-navy flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-500" />
            <span>Campus Announcements</span>
          </h3>

          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-3.5 rounded-2xl bg-navy-50/60 border border-navy-100 text-xs">
                <span className="font-bold text-navy block">{n.title}</span>
                <p className="text-gray-600 mt-1 text-[11px] leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Media Upload Modal */}
      {mediaModalRegId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200">
            <h3 className="text-lg font-black text-navy">Upload Competition Media</h3>
            <p className="text-xs text-gray-500">
              Paste the public URL (YouTube Unlisted, Instagram Reel, Google Drive link) for evaluation:
            </p>

            {uploadSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
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
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
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
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition-colors"
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
