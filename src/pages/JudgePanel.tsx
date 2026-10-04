import React, { useState, useEffect } from 'react';
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Sparkles,
  ArrowLeft,
  X
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
  const [selectedEventId, setSelectedEventId] = useState<string>('quiz');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('c-1');
  const [candidateSearch, setCandidateSearch] = useState('');
  
  // Mobile active tab view: 'roster' | 'rubric' | 'standings'
  const [mobileTab, setMobileTab] = useState<'roster' | 'rubric' | 'standings'>('roster');

  // Active rubric sliders
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [inspectMediaModal, setInspectMediaModal] = useState<string | null>(null);

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
        checkedIn: true,
        roomReported: true,
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
        roomReported: true,
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

  const selectedEvent = events.find(e => e.id === selectedEventId || e.slug === selectedEventId) || events[0];
  const candidates = 
    trackCandidates[selectedEvent?.slug || ''] || 
    trackCandidates[selectedEvent?.id || ''] || 
    trackCandidates['ev-' + (selectedEvent?.slug || '')] || 
    trackCandidates[selectedEventId] || 
    trackCandidates['ev-' + selectedEventId] || [];
  const currentCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0];
  const currentIndex = candidates.findIndex(c => c.id === currentCandidate?.id);

  // Initialize sliders when candidate changes
  useEffect(() => {
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

  const applyPreset = (percentage: number) => {
    if (!selectedEvent || currentCandidate?.scoreLocked) return;
    const updated: Record<string, number> = {};
    selectedEvent.scoring_rubric.criteria.forEach(crit => {
      updated[crit.name] = Math.round(crit.max * percentage);
    });
    setRubricScores(updated);
  };

  const handleNavigateCandidate = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentIndex > 0) {
      setSelectedCandidateId(candidates[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < candidates.length - 1) {
      setSelectedCandidateId(candidates[currentIndex + 1].id);
    }
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
    }, 500);
  };

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
    c.institute.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  const completedCount = candidates.filter(c => c.scoreLocked).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#001F3F] to-[#0c305b] p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-black uppercase tracking-wider border border-purple-500/30 flex items-center gap-1">
              <Gavel className="w-3.5 h-3.5 text-purple-400" /> Certified Judge Panel Desk
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
        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15">
          <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-1">
            Competition Track:
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              const newCandidates = trackCandidates[e.target.value] || [];
              if (newCandidates.length > 0) setSelectedCandidateId(newCandidates[0].id);
            }}
            className="w-full bg-navy-dark text-white font-bold text-xs px-3 py-2 rounded-xl border border-white/20 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer"
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
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <span className="text-sm font-black text-navy">{selectedEvent.name}</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-600 font-medium">
            Room: <strong>{selectedEvent.venue_location}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-gray-500">Track Progress:</span>
          <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-200">
            {completedCount} of {candidates.length} Scored ({candidates.length > 0 ? Math.round((completedCount / candidates.length) * 100) : 0}%)
          </span>
        </div>
      </div>

      {/* Mobile Segmented View Selector */}
      <div className="lg:hidden flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setMobileTab('roster')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'roster'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Roster ({candidates.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('rubric')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'rubric'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Rubric Score</span>
        </button>

        <button
          onClick={() => setMobileTab('standings')}
          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'standings'
              ? 'bg-navy text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Standings</span>
        </button>
      </div>

      {/* DESKTOP SPLIT-VIEW / MOBILE ADAPTIVE VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: CANDIDATE QUEUE ROSTER (5 Cols on desktop, conditioned on mobile) */}
        <div className={`lg:col-span-5 bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4 ${
          mobileTab !== 'roster' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h3 className="text-sm font-black text-navy flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-orange-500" />
              <span>Participant Roster ({candidates.length})</span>
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Click to evaluate</span>
          </div>

          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search candidate name or school..."
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
                  onClick={() => {
                    setSelectedCandidateId(cand.id);
                    setMobileTab('rubric');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500/20 shadow-sm'
                      : 'bg-gray-50 hover:bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-navy text-xs sm:text-sm">{cand.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[200px]">
                        {cand.institute}
                      </p>
                    </div>

                    {cand.scoreLocked ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center gap-1 shrink-0">
                        <Lock className="w-3 h-3 text-emerald-600" />
                        {cand.finalScore} pts
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">12th {cand.course.replace('12th ', '')}</span>
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        cand.checkedIn ? 'text-emerald-700 bg-emerald-50' : 'text-gray-400 bg-gray-100'
                      }`}>
                        {cand.checkedIn ? 'At Gate ✓' : 'Away'}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        cand.roomReported ? 'text-blue-700 bg-blue-50' : 'text-gray-400 bg-gray-100'
                      }`}>
                        {cand.roomReported ? 'In Room ✓' : 'Reported'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: RICH CANDIDATE CARD & RUBRIC ENGINE (7 Cols on desktop, conditioned on mobile) */}
        <div className={`lg:col-span-7 space-y-6 ${
          mobileTab !== 'rubric' ? 'hidden lg:block' : 'block'
        }`}>
          {currentCandidate ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-5 sm:p-8 shadow-sm space-y-6">
              
              {/* Mobile Back to Roster Button */}
              <div className="lg:hidden flex items-center justify-between pb-2 border-b border-gray-100">
                <button
                  onClick={() => setMobileTab('roster')}
                  className="flex items-center gap-1 text-xs font-bold text-navy hover:text-orange-500 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Roster List</span>
                </button>
                <span className="text-[11px] text-gray-400 font-bold">
                  {currentIndex + 1} of {candidates.length}
                </span>
              </div>

              {/* Candidate Bio Header & Navigation Chevrons */}
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
                  <h3 className="text-lg sm:text-xl font-black text-navy">{currentCandidate.name}</h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <School className="w-3.5 h-3.5 text-gray-400" />
                    <span>{currentCandidate.institute} ({currentCandidate.city})</span>
                  </p>
                </div>

                {/* Score & Candidate Chevrons */}
                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="text-right bg-navy-50 p-3 rounded-2xl border border-navy-100">
                    <span className="text-[9px] uppercase font-bold text-gray-400 block">Evaluated Score</span>
                    <span className="text-xl sm:text-2xl font-black text-navy">
                      {currentCandidate.scoreLocked ? currentCandidate.finalScore : totalCalculatedScore}
                      <span className="text-xs text-gray-400 font-normal"> / 100</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => handleNavigateCandidate('prev')}
                      disabled={currentIndex === 0}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 cursor-pointer"
                      title="Previous Candidate"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleNavigateCandidate('next')}
                      disabled={currentIndex === candidates.length - 1}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-30 cursor-pointer"
                      title="Next Candidate"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
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
                    <span className="font-bold text-navy">Candidate Media Attached</span>
                  </div>
                  <button
                    onClick={() => setInspectMediaModal(currentCandidate.submissionUrl || null)}
                    className="px-3 py-1 bg-navy text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspect Media</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Rubric Sliders Form */}
              <form onSubmit={handleScoreSubmit} className="space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-navy flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-orange-500" />
                      <span>Official Criteria Sliders</span>
                    </span>

                    {/* Presets */}
                    {!currentCandidate.scoreLocked && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold hidden sm:inline">Presets:</span>
                        <button
                          type="button"
                          onClick={() => applyPreset(0.70)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        >
                          70%
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(0.85)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 cursor-pointer"
                        >
                          85%
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPreset(0.95)}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 hover:bg-purple-200 text-purple-800 cursor-pointer"
                        >
                          95% ⭐
                        </button>
                      </div>
                    )}
                  </div>

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
                            className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
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
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center justify-between font-bold">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>Score is locked for official leaderboard sync.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleNavigateCandidate('next')}
                        disabled={currentIndex === candidates.length - 1}
                        className="text-xs text-orange-600 hover:text-orange-700 font-black cursor-pointer"
                      >
                        Next Candidate →
                      </button>
                    </div>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
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
              <p className="text-gray-400 text-sm">Select a candidate from the roster to begin scoring.</p>
            </div>
          )}
        </div>

        {/* TAB 3 ON MOBILE: ROOM STANDINGS */}
        {mobileTab === 'standings' && (
          <div className="lg:hidden bg-white rounded-3xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-navy flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Track Room Standings</span>
            </h3>
            <div className="space-y-2">
              {candidates
                .filter(c => c.scoreLocked)
                .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
                .map((c, idx) => (
                  <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-navy text-white flex items-center justify-center font-bold text-[10px]">
                        #{idx + 1}
                      </span>
                      <div>
                        <strong className="text-navy">{c.name}</strong>
                        <p className="text-[10px] text-gray-500 truncate max-w-[180px]">{c.institute}</p>
                      </div>
                    </div>
                    <span className="font-black text-navy text-sm font-mono">{c.finalScore} pts</span>
                  </div>
                ))}
            </div>
          </div>
        )}

      </div>

      {/* Media Inspection Modal */}
      {inspectMediaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h4 className="font-black text-navy text-sm flex items-center gap-2">
                <Video className="w-4 h-4 text-orange-500" />
                <span>Candidate Media Submission Inspector</span>
              </h4>
              <button
                onClick={() => setInspectMediaModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-xs text-gray-600">
                Media File Link: <strong className="text-navy font-mono text-[11px] block mt-1 truncate">{inspectMediaModal}</strong>
              </p>
              <a
                href={inspectMediaModal}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-navy text-white font-bold text-xs rounded-xl shadow hover:bg-navy-light"
              >
                <span>Open in External Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
