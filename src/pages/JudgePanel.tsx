import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { 
  Gavel, 
  Lock, 
  Sliders, 
  Send, 
  School, 
  Search, 
  ExternalLink, 
  UserCheck, 
  Video, 
  Palette,
  CheckCircle2
} from 'lucide-react';

interface CandidateEvaluation {
  id: string;
  name: string;
  institute: string;
  city: string;
  course: string;
  board: string;
  members?: string[];
  submissionUrl?: string;
  checkedIn: boolean;
  roomReported: boolean;
  scoreLocked?: boolean;
  finalScore?: number;
  comments?: string;
}

export const JudgePanel: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-quiz');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('c-1');
  const [candidateSearch, setCandidateSearch] = useState('');

  // Active rubric sliders
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Candidates database per track
  const [trackCandidates, setTrackCandidates] = useState<Record<string, CandidateEvaluation[]>>({
    'ev-quiz': [
      {
        id: 'c-1',
        name: 'Akash Pattnaik & Priya Sahoo',
        institute: 'DAV Public School, Chandrasekharpur',
        city: 'Bhubaneswar',
        course: '12th Science',
        board: 'CBSE',
        members: ['Akash Pattnaik (Lead)', 'Priya Sahoo (Roll 14)'],
        checkedIn: true,
        roomReported: true,
        scoreLocked: false
      },
      {
        id: 'c-2',
        name: 'Rohan Mohanty & Ayush Dash',
        institute: 'Buxi Jagabandhu English Medium School',
        city: 'Bhubaneswar',
        course: '12th Science',
        board: 'CBSE',
        members: ['Rohan Mohanty (Lead)', 'Ayush Dash (Roll 22)'],
        checkedIn: true,
        roomReported: true,
        scoreLocked: true,
        finalScore: 92.0,
        comments: 'Excellent buzzer reflex during Round 3 bonus question.'
      },
      {
        id: 'c-3',
        name: 'Debasish Swain & Alok Behera',
        institute: 'Stewart School, Cuttack',
        city: 'Cuttack',
        course: '12th Arts',
        board: 'ICSE',
        members: ['Debasish Swain', 'Alok Behera'],
        checkedIn: false,
        roomReported: false,
        scoreLocked: false
      }
    ],
    'ev-debate': [
      {
        id: 'c-4',
        name: 'Tanvi Agarwal',
        institute: 'SAI International School',
        city: 'Bhubaneswar',
        course: '12th Commerce',
        board: 'CBSE',
        checkedIn: true,
        roomReported: true,
        scoreLocked: false
      },
      {
        id: 'c-5',
        name: 'Priyanka Tripathy',
        institute: 'KIIT International School',
        city: 'Bhubaneswar',
        course: '12th Science',
        board: 'CBSE',
        checkedIn: true,
        roomReported: true,
        scoreLocked: true,
        finalScore: 88.0,
        comments: 'Solid argumentation on technology governance.'
      }
    ],
    'ev-reels': [
      {
        id: 'c-6',
        name: 'Akash Pattnaik',
        institute: 'DAV Public School, Chandrasekharpur',
        city: 'Bhubaneswar',
        course: '12th Science',
        board: 'CBSE',
        submissionUrl: 'https://youtube.com/shorts/srusti-crossfire-cinematic',
        checkedIn: true,
        roomReported: true,
        scoreLocked: false
      }
    ],
    'ev-poster': [
      {
        id: 'c-7',
        name: 'Tanvi Agarwal',
        institute: 'SAI International School',
        city: 'Bhubaneswar',
        course: '12th Commerce',
        board: 'CBSE',
        submissionUrl: 'https://drive.google.com/file/d/poster-digital-artwork-srusti',
        checkedIn: true,
        roomReported: false,
        scoreLocked: false
      }
    ],
    'ev-ramp-walk': [
      {
        id: 'c-8',
        name: 'Ananya Dash',
        institute: 'Mothers Public School',
        city: 'Bhubaneswar',
        course: '12th Commerce',
        board: 'CBSE',
        checkedIn: true,
        roomReported: true,
        scoreLocked: true,
        finalScore: 94.5,
        comments: 'Exquisite poise and confident stage walk.'
      }
    ],
    'ev-treasure-hunt': [
      {
        id: 'c-9',
        name: 'Siddharth Rout & Team',
        institute: 'BJB Higher Secondary School',
        city: 'Bhubaneswar',
        course: '12th Science',
        board: 'CHSE',
        members: ['Siddharth Rout', 'Bikash Jena', 'Sourav Ray'],
        checkedIn: true,
        roomReported: true,
        scoreLocked: false
      }
    ]
  });

  const selectedEvent = events.find(e => e.id === selectedEventId) || events[0];
  const candidates = trackCandidates[selectedEventId] || [];
  const currentCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];

  // Initialize sliders when candidate changes
  React.useEffect(() => {
    if (selectedEvent && currentCandidate) {
      if (currentCandidate.scoreLocked) {
        setComments(currentCandidate.comments || '');
      } else {
        const initial: Record<string, number> = {};
        selectedEvent.scoring_rubric.criteria.forEach(crit => {
          initial[crit.name] = Math.round(crit.max * 0.80);
        });
        setRubricScores(initial);
        setComments('');
      }
      setSubmittedSuccess(false);
    }
  }, [selectedCandidateId, selectedEventId]);

  const totalCalculatedScore = Object.values(rubricScores).reduce((acc, val) => acc + (val || 0), 0);

  const handleSliderChange = (criterionName: string, val: number) => {
    setRubricScores(prev => ({ ...prev, [criterionName]: val }));
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCandidate) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setTrackCandidates(prev => {
        const list = [...(prev[selectedEventId] || [])];
        const idx = list.findIndex(c => c.id === currentCandidate.id);
        if (idx !== -1) {
          list[idx] = {
            ...list[idx],
            scoreLocked: true,
            finalScore: totalCalculatedScore,
            comments: comments.trim()
          };
        }
        return { ...prev, [selectedEventId]: list };
      });

      setIsSubmitting(false);
      setSubmittedSuccess(true);
    }, 600);
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.institute.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const completedCount = candidates.filter(c => c.scoreLocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header */}
      <div className="bg-navy p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30 flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5" /> Certified Judge Panel Desk
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            Participant Evaluation & Rubric Engine
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Evaluator: <strong>{user?.first_name || 'Dr. Meera Senapati'}</strong> • Real-time Scoring Console
          </p>
        </div>

        {/* Assigned Track Selector */}
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
          <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">
            Select Competition Track:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const newCandidates = trackCandidates[e.target.value] || [];
              if (newCandidates.length > 0) setSelectedCandidateId(newCandidates[0].id);
            }}
            className="bg-navy-dark text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
          >
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.group})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Progress Metric Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-black text-navy">{selectedEvent.name}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-600 font-medium">
            Room: <strong>{selectedEvent.venue_location}</strong>
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="text-gray-500">Evaluation Progress:</span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
            {completedCount} of {candidates.length} Scored ({candidates.length > 0 ? Math.round((completedCount / candidates.length) * 100) : 0}%)
          </span>
        </div>
      </div>

      {/* SPLIT-VIEW EVALUATION QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: CANDIDATE QUEUE ROSTER (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-black text-navy flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <span>Participant Roster ({candidates.length})</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Click candidate to score</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search candidate name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy"
            />
          </div>

          {/* Candidate Card List */}
          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredCandidates.map((cand) => {
              const isSelected = cand.id === currentCandidate?.id;

              return (
                <div
                  key={cand.id}
                  onClick={() => setSelectedCandidateId(cand.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-50/70 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                      : 'bg-gray-50 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-navy text-xs sm:text-sm">{cand.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[220px]">
                        {cand.institute}
                      </p>
                    </div>

                    {cand.scoreLocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        {cand.finalScore} pts
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">{cand.course}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        cand.checkedIn ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                      }`}>
                        {cand.checkedIn ? 'At Gate ✓' : 'Away'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        cand.roomReported ? 'text-blue-700 bg-blue-50' : 'text-gray-400 bg-gray-100'
                      }`}>
                        {cand.roomReported ? 'In Room ✓' : 'Not in room'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: RICH CANDIDATE CARD & RUBRIC ENGINE (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {currentCandidate ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Candidate Bio Header */}
              <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                      Dossier: {currentCandidate.id}
                    </span>
                    {currentCandidate.scoreLocked && (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Lock className="w-3 h-3 text-emerald-600" /> Locked & Finalized
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-navy">{currentCandidate.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <School className="w-3.5 h-3.5 text-gray-400" />
                    <span>{currentCandidate.institute} ({currentCandidate.city})</span>
                  </p>
                </div>

                <div className="text-right self-start sm:self-auto bg-navy-50 p-3 rounded-2xl border border-navy-100">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Evaluated Score</span>
                  <span className="text-2xl font-black text-navy">
                    {currentCandidate.scoreLocked ? currentCandidate.finalScore : totalCalculatedScore}
                    <span className="text-xs text-gray-400 font-normal"> / 100</span>
                  </span>
                </div>
              </div>

              {/* Team Roster / Submission Links */}
              {currentCandidate.members && currentCandidate.members.length > 0 && (
                <div className="p-3.5 bg-gray-50 rounded-2xl text-xs space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 block">Team Roster:</span>
                  <div className="flex flex-wrap gap-2">
                    {currentCandidate.members.map((m, i) => (
                      <span key={i} className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-navy font-semibold">
                        • {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentCandidate.submissionUrl && (
                <div className="p-3.5 bg-orange-50/60 border border-orange-100 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {selectedEvent.slug === 'reels' ? <Video className="w-4 h-4 text-orange-500" /> : <Palette className="w-4 h-4 text-orange-500" />}
                    <span className="font-bold text-navy">Candidate Media Submission Attached</span>
                  </div>
                  <a
                    href={currentCandidate.submissionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 bg-navy text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <span>Inspect Media</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Rubric Sliders Form */}
              <form onSubmit={handleScoreSubmit} className="space-y-5">
                <div className="space-y-4">
                  <span className="text-xs font-black uppercase tracking-wider text-navy block flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-orange-500" />
                    <span>Official Criteria Sliders</span>
                  </span>

                  {selectedEvent.scoring_rubric.criteria.map((crit, idx) => {
                    const currentValue = rubricScores[crit.name] ?? Math.round(crit.max * 0.80);

                    return (
                      <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <strong className="text-navy">{crit.name}</strong>
                            {crit.description && (
                              <p className="text-[11px] text-gray-500">{crit.description}</p>
                            )}
                          </div>
                          <span className="text-sm font-black text-navy bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-sm">
                            {currentValue} / {crit.max} pts
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-1">
                          <span className="text-xs text-gray-400 font-bold">0</span>
                          <input
                            type="range"
                            min="0"
                            max={crit.max}
                            step="1"
                            disabled={currentCandidate.scoreLocked}
                            value={currentValue}
                            onChange={(e) => handleSliderChange(crit.name, Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                          />
                          <span className="text-xs text-gray-400 font-bold">{crit.max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Judge Remarks Textarea */}
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Evaluator Feedback & Performance Notes
                  </label>
                  <textarea
                    rows={3}
                    disabled={currentCandidate.scoreLocked}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter stage remarks or points justification..."
                    className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy disabled:bg-gray-100"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  {submittedSuccess && (
                    <div className="mb-3 p-3 bg-emerald-100 border border-emerald-300 rounded-2xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>Score successfully recorded and locked for this candidate!</span>
                    </div>
                  )}
                  {currentCandidate.scoreLocked ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 font-bold">
                      <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>This candidate evaluation has been submitted and locked for official leaderboard broadcast.</span>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Submit & Lock Score ({totalCalculatedScore} Points)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

              </form>

            </div>
          ) : (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 text-center">
              <p className="text-gray-400 text-sm">Select a candidate from the left roster to begin scoring.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
