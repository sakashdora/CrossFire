import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INITIAL_EVENTS } from '../data/mockData';
import { 
  Gavel, 
  CheckCircle, 
  Lock, 
  Sliders, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  School
} from 'lucide-react';

interface ParticipantEvaluation {
  id: string;
  name: string;
  school: string;
  board: string;
  members?: string[];
  submissionLink?: string;
  scoreLocked?: boolean;
  finalScore?: number;
}

export const JudgePanel: React.FC = () => {
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-quiz');
  const [currentParticipantIndex, setCurrentParticipantIndex] = useState(0);

  // Active rubric sliders state
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Sample participants per event
  const [eventParticipants, setEventParticipants] = useState<Record<string, ParticipantEvaluation[]>>({
    'ev-quiz': [
      { id: 'p-1', name: 'Buxi Titans', school: 'Buxi Jagabandhu English Medium School', board: 'CBSE', members: ['Rohan Mohanty', 'Ayush Dash'] },
      { id: 'p-2', name: 'DAV Scholars', school: 'DAV Public School, Chandrasekharpur', board: 'CBSE', members: ['Aarav Pattnaik', 'Priya Sahoo'] },
      { id: 'p-3', name: 'Stewart Quizzers', school: 'Stewart School, Cuttack', board: 'ICSE', members: ['Debasish Swain', 'Alok Behera'] },
    ],
    'ev-ramp-walk': [
      { id: 'p-4', name: 'Ananya Dash', school: 'Mothers Public School', board: 'CBSE' },
      { id: 'p-5', name: 'Siddharth Rout', school: 'BJB Higher Secondary School', board: 'CHSE' },
    ],
    'ev-debate': [
      { id: 'p-6', name: 'Tanvi Agarwal', school: 'SAI International School', board: 'CBSE' },
      { id: 'p-7', name: 'Priyanka Tripathy', school: 'KIIT International School', board: 'CBSE' },
    ],
  });

  const selectedEvent = INITIAL_EVENTS.find(e => e.id === selectedEventId) || INITIAL_EVENTS[0];
  const participants = eventParticipants[selectedEventId] || [];
  const currentParticipant = participants[currentParticipantIndex];

  // Initialize sliders when participant or event changes
  React.useEffect(() => {
    if (selectedEvent) {
      const initial: Record<string, number> = {};
      selectedEvent.scoring_rubric.criteria.forEach(crit => {
        initial[crit.name] = Math.round(crit.max * 0.75); // Default to 75%
      });
      setRubricScores(initial);
      setComments('');
      setSubmittedSuccess(false);
    }
  }, [selectedEventId, currentParticipantIndex]);

  const totalCalculatedScore = Object.values(rubricScores).reduce((acc, val) => acc + (val || 0), 0);

  const handleSliderChange = (criterionName: string, val: number) => {
    setRubricScores(prev => ({
      ...prev,
      [criterionName]: val
    }));
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentParticipant) return;

    setIsSubmitting(true);
    setTimeout(() => {
      // Mark current participant as locked
      setEventParticipants(prev => {
        const list = [...(prev[selectedEventId] || [])];
        list[currentParticipantIndex] = {
          ...list[currentParticipantIndex],
          scoreLocked: true,
          finalScore: totalCalculatedScore
        };
        return { ...prev, [selectedEventId]: list };
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  const completedCount = participants.filter(p => p.scoreLocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Judge Header */}
      <div className="bg-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider border border-purple-500/30 flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5" /> Official Judge Interface
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Evaluation & Real-Time Scoring Engine
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Logged in as <strong>{user?.first_name || 'Dr. Judge'}</strong> • Certified Evaluator
          </p>
        </div>

        {/* Assigned Event Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">
            Select Assigned Track:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setCurrentParticipantIndex(0);
            }}
            className="bg-navy-dark text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
          >
            {INITIAL_EVENTS.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress & Queue Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <span className="text-xs font-bold text-navy block">
            {selectedEvent.name} Evaluation Queue
          </span>
          <span className="text-xs text-gray-500">
            Participant {currentParticipantIndex + 1} of {participants.length} • {completedCount} of {participants.length} Finalized
          </span>
        </div>

        {/* Navigation Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentParticipantIndex(prev => Math.max(0, prev - 1))}
            disabled={currentParticipantIndex === 0}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-30 text-navy font-bold text-xs flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
          
          <button
            onClick={() => setCurrentParticipantIndex(prev => Math.min(participants.length - 1, prev + 1))}
            disabled={currentParticipantIndex >= participants.length - 1}
            className="p-2 rounded-xl border border-gray-200 hover:bg-gray-100 disabled:opacity-30 text-navy font-bold text-xs flex items-center gap-1"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scoring Form Area */}
      {currentParticipant ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Participant Meta Details */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Candidate Profile
                </span>
                {currentParticipant.scoreLocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Under Scoring
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-xl font-black text-navy">{currentParticipant.name}</h3>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <School className="w-3.5 h-3.5 text-gray-400" />
                  {currentParticipant.school}
                </p>
                <span className="inline-block mt-2 text-[10px] font-bold uppercase px-2 py-0.5 bg-navy-50 text-navy rounded-full">
                  {currentParticipant.board} Board
                </span>
              </div>

              {currentParticipant.members && currentParticipant.members.length > 0 && (
                <div className="pt-3 border-t border-gray-100 text-xs">
                  <span className="font-bold text-gray-500 block mb-1">Roster Members:</span>
                  <ul className="space-y-1">
                    {currentParticipant.members.map((m, i) => (
                      <li key={i} className="text-gray-700 bg-gray-50 px-2 py-1 rounded">
                        • {m}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Score Card Preview */}
            <div className="bg-gradient-to-br from-navy to-navy-dark text-white rounded-2xl p-6 shadow-md text-center space-y-2">
              <span className="text-xs uppercase font-bold text-orange-400 tracking-wider">
                Total Evaluated Score
              </span>
              <div className="text-5xl font-black text-white">
                {currentParticipant.scoreLocked ? currentParticipant.finalScore : totalCalculatedScore}
                <span className="text-base text-gray-400 font-normal"> / 100</span>
              </div>
              <p className="text-[11px] text-gray-300">
                Calculated in real-time across official rubric criteria
              </p>
            </div>
          </div>

          {/* Right 2 Columns: Rubric Sliders & Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-black text-navy flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-orange-500" />
                    <span>Scoring Rubric Breakdown</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Adjust criteria sliders. Total points will lock upon submission.
                  </p>
                </div>
              </div>

              {submittedSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Score Saved & Locked!</strong> The candidate's standing has been dispatched to the live leaderboard.
                  </span>
                </div>
              )}

              <form onSubmit={handleScoreSubmit} className="space-y-6">
                {selectedEvent.scoring_rubric.criteria.map((crit, idx) => {
                  const currentValue = rubricScores[crit.name] ?? Math.round(crit.max * 0.75);

                  return (
                    <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-navy uppercase tracking-wider">
                            {crit.name}
                          </label>
                          {crit.description && (
                            <p className="text-[11px] text-gray-500">{crit.description}</p>
                          )}
                        </div>
                        <span className="text-sm font-black text-navy bg-white px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                          {currentValue} / {crit.max} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-xs text-gray-400 font-bold">0</span>
                        <input
                          type="range"
                          min="0"
                          max={crit.max}
                          step="1"
                          disabled={currentParticipant.scoreLocked}
                          value={currentValue}
                          onChange={(e) => handleSliderChange(crit.name, Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        />
                        <span className="text-xs text-gray-400 font-bold">{crit.max}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Judge Remarks */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Evaluator Comments & Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    disabled={currentParticipant.scoreLocked}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter observations on stage presence, argumentation sharpness, or technical nuance..."
                    className="w-full p-3 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy disabled:bg-gray-100"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex items-center justify-between border-t border-gray-100">
                  {currentParticipant.scoreLocked ? (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Lock className="w-4 h-4 text-emerald-600" />
                      <span>This score was submitted and locked for audit integrity.</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit & Lock Score ({totalCalculatedScore} pts)</span>
                        </>
                      )}
                    </button>
                  )}

                  {currentParticipantIndex < participants.length - 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentParticipantIndex(prev => prev + 1)}
                      className="px-4 py-2 text-xs font-bold text-navy hover:bg-gray-100 rounded-xl flex items-center gap-1"
                    >
                      <span>Next Candidate</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>

            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
          <p className="text-gray-500 text-sm">No participants registered in this event track yet.</p>
        </div>
      )}

    </div>
  );
};
