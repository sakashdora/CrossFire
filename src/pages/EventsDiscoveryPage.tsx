import React, { useState } from 'react';
import { EventItem, Registration } from '../types';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { 
  Trophy, 
  Sparkles, 
  Brain, 
  Video, 
  MessageSquareQuote, 
  Palette, 
  Compass, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  X
} from 'lucide-react';

interface EventsDiscoveryPageProps {
  userRegistrations: Registration[];
  onRegisterEvent: (eventId: string, teamName?: string, members?: any[]) => Promise<boolean>;
  openAuthModal: (mode: 'login' | 'register') => void;
}

export const EventsDiscoveryPage: React.FC<EventsDiscoveryPageProps> = ({
  userRegistrations,
  onRegisterEvent,
  openAuthModal,
}) => {
  const { user } = useAuth();
  const { events } = useEvents();
  const [filter, setFilter] = useState<'all' | 'solo' | 'team'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teammate1, setTeammate1] = useState('');
  const [teammate2, setTeammate2] = useState('');
  const [registrationError, setRegistrationError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const registeredEventIds = new Set(userRegistrations.map(r => r.event_id));
  const registrationCount = userRegistrations.length;
  const isLimitReached = registrationCount >= 2;

  const filteredEvents = events.filter(event => {
    if (filter === 'solo') return event.event_type === 'solo';
    if (filter === 'team') return event.event_type === 'team';
    return true;
  });

  const getEventIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain': return <Brain className="w-5 h-5 text-orange-500" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-orange-500" />;
      case 'Video': return <Video className="w-5 h-5 text-orange-500" />;
      case 'MessageSquareQuote': return <MessageSquareQuote className="w-5 h-5 text-orange-500" />;
      case 'Palette': return <Palette className="w-5 h-5 text-orange-500" />;
      case 'Compass': return <Compass className="w-5 h-5 text-orange-500" />;
      default: return <Trophy className="w-5 h-5 text-orange-500" />;
    }
  };

  const handleRegisterConfirm = async () => {
    if (!selectedEvent) return;
    if (!user) {
      openAuthModal('login');
      return;
    }

    setRegistrationError(null);
    if (isLimitReached) {
      setRegistrationError('Registration limit reached: A student may register for a maximum of 2 events.');
      return;
    }

    setIsRegistering(true);
    try {
      const members = [];
      if (teammate1.trim()) members.push({ name: teammate1.trim() });
      if (teammate2.trim()) members.push({ name: teammate2.trim() });

      const success = await onRegisterEvent(
        selectedEvent.id, 
        teamName.trim() || `${user.first_name}'s Team`, 
        members
      );

      if (success) {
        setSelectedEvent(null);
        setTeamName('');
        setTeammate1('');
        setTeammate2('');
      } else {
        setRegistrationError('Unable to complete registration. Please ensure your eligibility.');
      }
    } catch (err: any) {
      setRegistrationError(err.message || 'Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header & Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy">
            Competitive Events Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Discover guidelines, prize breakdowns, and evaluation rubrics for all 6 official tracks.
          </p>
        </div>

        {/* Limit Tracker Badge */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                Registration Quota
              </span>
              <span className={`text-sm font-black ${isLimitReached ? 'text-amber-600' : 'text-navy'}`}>
                {registrationCount} of 2 Events Registered
              </span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              isLimitReached ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {registrationCount}/2
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'all' 
              ? 'bg-navy text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All 6 Events
        </button>
        <button
          onClick={() => setFilter('solo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'solo' 
              ? 'bg-navy text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Solo Events (4)
        </button>
        <button
          onClick={() => setFilter('team')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === 'team' 
              ? 'bg-navy text-white shadow-sm' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Team Battles (2)
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => {
          const isRegistered = registeredEventIds.has(event.id);

          return (
            <div
              key={event.id}
              className={`bg-white rounded-2xl border ${
                isRegistered ? 'border-emerald-300 ring-2 ring-emerald-500/10' : 'border-gray-200'
              } p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    {getEventIcon(event.event_icon)}
                  </div>
                  {isRegistered ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Registered
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                      {event.event_type === 'solo' ? 'Solo' : `Team of ${event.team_size}`}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-navy">{event.name}</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  {event.description}
                </p>

                {/* Rubric Peek */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Evaluation Weights:
                  </span>
                  <div className="space-y-1">
                    {event.scoring_rubric.criteria.map((crit, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs text-gray-600">
                        <span>{crit.name}</span>
                        <span className="font-semibold text-navy">{crit.weight}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Logistics */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Nov 15, 2026 • 09:30 AM onwards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{event.venue_location}</span>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Prize Pool</span>
                  <span className="text-navy font-black text-sm">₹{event.prize_pool.toLocaleString('en-IN')}</span>
                </div>

                {isRegistered ? (
                  <button
                    disabled
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-default"
                  >
                    Enrolled ✓
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md hover:shadow-orange-500/25 transition-all flex items-center gap-1.5"
                  >
                    <span>Register Track</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Registration & Detailed Rule Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            
            <div className="bg-navy text-white px-6 py-5 rounded-t-2xl relative">
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                  {getEventIcon(selectedEvent.event_icon)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedEvent.name}</h3>
                  <p className="text-xs text-orange-400 font-medium">
                    {selectedEvent.event_type === 'solo' ? 'Individual Registration' : `Team Event (${selectedEvent.team_size} members)`}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Limit notification */}
              {isLimitReached && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span>
                    You have already registered for the maximum allowed 2 events. You must withdraw from an existing event in your dashboard to register for this track.
                  </span>
                </div>
              )}

              {registrationError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{registrationError}</span>
                </div>
              )}

              {/* Event Details Overview */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Event Brief
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {/* Rubric Breakdown */}
              <div className="p-4 bg-navy-50 rounded-xl border border-navy-100">
                <h4 className="text-xs font-bold text-navy mb-2 flex items-center justify-between">
                  <span>Official Scoring Rubric:</span>
                  <span className="text-[10px] text-gray-500">Max Score: 100 pts</span>
                </h4>
                <div className="space-y-2">
                  {selectedEvent.scoring_rubric.criteria.map((crit, idx) => (
                    <div key={idx} className="text-xs bg-white p-2.5 rounded-lg border border-navy-100/60">
                      <div className="flex items-center justify-between font-bold text-navy">
                        <span>{crit.name}</span>
                        <span className="text-orange-600">{crit.weight} Pts ({crit.weight}%)</span>
                      </div>
                      {crit.description && (
                        <p className="text-[11px] text-gray-500 mt-0.5">{crit.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Form if Team Event */}
              {selectedEvent.event_type === 'team' && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                    Team Composition ({selectedEvent.team_size} Members Total)
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Srusti Titans"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Teammate 1 Name & Roll No *
                    </label>
                    <input
                      type="text"
                      value={teammate1}
                      onChange={(e) => setTeammate1(e.target.value)}
                      placeholder="e.g. Pritam Jena (Roll 24)"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
                    />
                  </div>

                  {selectedEvent.team_size === 3 && (
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Teammate 2 Name & Roll No *
                      </label>
                      <input
                        type="text"
                        value={teammate2}
                        onChange={(e) => setTeammate2(e.target.value)}
                        placeholder="e.g. Rahul Mishra (Roll 31)"
                        className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation CTA */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isLimitReached || isRegistering}
                  onClick={handleRegisterConfirm}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {isRegistering ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Confirm Event Entry</span>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
