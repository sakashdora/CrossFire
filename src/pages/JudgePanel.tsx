import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../context/EventsContext';
import { studentDataService, StudentRegistrationRecord, REGISTRATION_EVENT_KEY } from '../services/studentDataService';
import { 
  Gavel, 
  Lock, 
  Send, 
  Search, 
  ExternalLink, 
  Video, 
  Trophy
} from 'lucide-react';

interface CandidateEvaluation {
  id: string;
  studentId: string;
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
  rubricScores?: Record<string, number>;
  comments?: string;
}

export const JudgePanel: React.FC = () => {
  const { user } = useAuth();
  const { events } = useEvents();
  
  // Selected competition track slug
  const [selectedEventSlug, setSelectedEventSlug] = useState<string>('quiz');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');
  const [candidateSearch, setCandidateSearch] = useState('');
  
  // Mobile active tab: 'roster' | 'rubric' | 'standings'
  const [mobileTab, setMobileTab] = useState<'roster' | 'rubric' | 'standings'>('roster');

  // Rubric sliders state
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real student list from studentDataService
  const [allStudents, setAllStudents] = useState<StudentRegistrationRecord[]>(() => studentDataService.getAllStudents());

  const refreshStudents = () => {
    setAllStudents(studentDataService.getAllStudents());
  };

  useEffect(() => {
    refreshStudents();
    window.addEventListener(REGISTRATION_EVENT_KEY, refreshStudents);
    return () => {
      window.removeEventListener(REGISTRATION_EVENT_KEY, refreshStudents);
    };
  }, []);

  // Find active event metadata
  const activeEvent = useMemo(() => {
    return events.find(e => e.slug === selectedEventSlug || e.id === selectedEventSlug) || events[0];
  }, [events, selectedEventSlug]);

  // Candidates for selected track
  const candidatesForTrack: CandidateEvaluation[] = useMemo(() => {
    if (!activeEvent) return [];
    const eventName = activeEvent.name.toLowerCase();
    const eventSlug = activeEvent.slug.toLowerCase();

    return allStudents
      .filter(s => s.selected_competitions.some(c => 
        c.toLowerCase() === eventName || 
        c.toLowerCase().includes(eventName) || 
        eventName.includes(c.toLowerCase()) ||
        c.toLowerCase().replace(/[^a-z0-9]/g, '-') === eventSlug
      ))
      .map(s => {
        const scoreInfo = s.scores?.[eventSlug];
        const mediaUrl = s.media_urls?.[eventSlug];
        const isReported = Boolean(s.room_reported?.[eventSlug] || (s.room_reported && Object.values(s.room_reported).some(Boolean)));

        return {
          id: s.id,
          studentId: s.id,
          name: `${s.first_name} ${s.last_name || ''}`.trim(),
          institute: s.institute_name,
          city: s.city_town,
          course: s.course_stream,
          board: s.board || 'CBSE',
          submissionUrl: mediaUrl,
          checkedIn: Boolean(s.checked_in_at),
          roomReported: isReported,
          scoreLocked: Boolean(scoreInfo?.locked),
          finalScore: scoreInfo?.total,
          rubricScores: scoreInfo?.rubric,
          comments: scoreInfo?.comments
        };
      });
  }, [allStudents, activeEvent]);

  // Selected candidate object
  const activeCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = candidatesForTrack.find(c => c.id === selectedCandidateId);
      if (found) return found;
    }
    return candidatesForTrack[0] || null;
  }, [candidatesForTrack, selectedCandidateId]);

  // Update selectedCandidateId if current is not in list
  useEffect(() => {
    if (candidatesForTrack.length > 0 && (!selectedCandidateId || !candidatesForTrack.some(c => c.id === selectedCandidateId))) {
      setSelectedCandidateId(candidatesForTrack[0].id);
    }
  }, [candidatesForTrack, selectedCandidateId]);

  // Load candidate rubric values when candidate changes
  useEffect(() => {
    if (activeCandidate && activeEvent) {
      if (activeCandidate.rubricScores) {
        setRubricScores(activeCandidate.rubricScores);
        setComments(activeCandidate.comments || '');
      } else {
        // Initialize with standard mid-scores
        const initialScores: Record<string, number> = {};
        activeEvent.scoring_rubric.criteria.forEach(crit => {
          initialScores[crit.name] = Math.round(crit.max * 0.75);
        });
        setRubricScores(initialScores);
        setComments('');
      }
    }
  }, [activeCandidate?.id, activeEvent?.slug]);

  // Calculate live total score
  const totalScore = useMemo(() => {
    return Object.values(rubricScores).reduce((sum, val) => sum + (Number(val) || 0), 0);
  }, [rubricScores]);

  // Handle rubric score slider change
  const handleScoreChange = (criterionName: string, value: number) => {
    if (activeCandidate?.scoreLocked) return;
    setRubricScores(prev => ({
      ...prev,
      [criterionName]: value
    }));
  };

  // Submit and lock score
  const handleSubmitEvaluation = () => {
    if (!activeCandidate || !activeEvent) return;
    setIsSubmitting(true);

    try {
      studentDataService.recordScore(
        activeCandidate.studentId,
        activeEvent.slug,
        rubricScores,
        totalScore,
        comments
      );

      refreshStudents();
      setTimeout(() => {
        setIsSubmitting(false);
        // Advance to next unscored candidate if available
        const unscored = candidatesForTrack.find(c => !c.scoreLocked && c.id !== activeCandidate.id);
        if (unscored) {
          setSelectedCandidateId(unscored.id);
        }
      }, 800);
    } catch (e) {
      console.error('[CROSSFIRE] Error saving score:', e);
      setIsSubmitting(false);
    }
  };

  // Search filtered candidates
  const filteredCandidates = useMemo(() => {
    return candidatesForTrack.filter(c => {
      const term = candidateSearch.toLowerCase().trim();
      return !term || 
        c.name.toLowerCase().includes(term) ||
        c.institute.toLowerCase().includes(term) ||
        c.id.toLowerCase().includes(term);
    });
  }, [candidatesForTrack, candidateSearch]);

  // Track standings
  const trackStandings = useMemo(() => {
    return [...candidatesForTrack]
      .filter(c => typeof c.finalScore === 'number')
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [candidatesForTrack]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy via-navy-light to-navy rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
                Official Jury Panel
              </span>
              <span className="text-xs text-gray-300 font-bold">
                Jury Evaluator: {user?.first_name || 'Dr. Meera'} {user?.last_name || 'Senapati'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Candidate Evaluation & Scoring Portal
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-2xl">
              Evaluate real-time performances against official SAGS rubric criteria. Finalized scores lock automatically and update the State Leaderboard.
            </p>
          </div>

          {/* Event Track Selector */}
          <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex items-center gap-2 shrink-0">
            <Gavel className="w-5 h-5 text-orange-400 ml-2" />
            <select
              value={selectedEventSlug}
              onChange={(e) => {
                setSelectedEventSlug(e.target.value);
                setMobileTab('roster');
              }}
              className="bg-navy text-white text-xs font-bold py-2 px-3 rounded-xl border border-white/20 focus:outline-none cursor-pointer"
            >
              {events.map((ev) => (
                <option key={ev.slug} value={ev.slug}>
                  {ev.name} ({ev.group})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="lg:hidden flex border-b border-gray-200 bg-white rounded-2xl p-1 shadow-sm">
        <button
          onClick={() => setMobileTab('roster')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'roster' ? 'bg-navy text-white' : 'text-gray-500'
          }`}
        >
          <span>1. Candidates ({candidatesForTrack.length})</span>
        </button>
        <button
          onClick={() => setMobileTab('rubric')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'rubric' ? 'bg-navy text-white' : 'text-gray-500'
          }`}
        >
          <span>2. Rubric Scoring</span>
        </button>
        <button
          onClick={() => setMobileTab('standings')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
            mobileTab === 'standings' ? 'bg-navy text-white' : 'text-gray-500'
          }`}
        >
          <span>3. Live Standings</span>
        </button>
      </div>

      {/* Main 3-Column Work Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* COLUMN 1: Candidate Track Roster (4 Cols) */}
        <div className={`lg:col-span-4 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm space-y-4 ${
          mobileTab !== 'roster' ? 'hidden lg:block' : ''
        }`}>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
              <span>{activeEvent?.name} Competitors</span>
              <span className="text-[10px] font-bold bg-navy-50 text-navy px-2 py-0.5 rounded-full">
                {candidatesForTrack.length}
              </span>
            </h2>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search candidate name or pass ID..."
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-navy placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:bg-white"
            />
          </div>

          {/* Candidate List Cards */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredCandidates.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No registered competitors found for this event track.
              </div>
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = activeCandidate?.id === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => {
                      setSelectedCandidateId(cand.id);
                      setMobileTab('rubric');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected 
                        ? 'bg-navy text-white border-navy shadow-md scale-[1.01]' 
                        : 'bg-gray-50/60 hover:bg-gray-100/80 border-gray-200 text-navy'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                            isSelected ? 'bg-white/20 text-orange-300' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {cand.id}
                          </span>
                          <strong className="text-xs font-bold truncate block">{cand.name}</strong>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          {cand.institute}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {cand.scoreLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md">
                            <Lock className="w-2.5 h-2.5" />
                            <span>{cand.finalScore} pts</span>
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            Unscored
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10 text-[10px]">
                      <span className={isSelected ? 'text-gray-300' : 'text-gray-400'}>
                        {cand.course} ({cand.board})
                      </span>
                      {cand.submissionUrl && (
                        <span className={`flex items-center gap-1 font-bold ${isSelected ? 'text-orange-300' : 'text-orange-600'}`}>
                          <Video className="w-3 h-3" />
                          <span>Media Attached</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMN 2: Rubric Scoring Sliders (5 Cols) */}
        <div className={`lg:col-span-5 bg-white rounded-3xl p-6 border border-gray-200/80 shadow-sm space-y-6 ${
          mobileTab !== 'rubric' ? 'hidden lg:block' : ''
        }`}>
          {activeCandidate ? (
            <>
              {/* Active Candidate Header */}
              <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                    {activeCandidate.id}
                  </span>
                  {activeCandidate.scoreLocked && (
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Score Locked & Published</span>
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-navy mt-1">
                  {activeCandidate.name}
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {activeCandidate.institute} • {activeCandidate.city}
                </p>

                {/* Media Link inspection if present */}
                {activeCandidate.submissionUrl && (
                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-orange-600 shrink-0" />
                      <span className="text-xs font-bold text-navy truncate max-w-[200px]">
                        Submission: {activeCandidate.submissionUrl}
                      </span>
                    </div>
                    <a
                      href={activeCandidate.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-black hover:bg-orange-600 transition-colors flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open Link</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Rubric Criteria Sliders */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Official Rubric Criteria</span>
                  <span className="text-orange-600 font-bold">Max 100 Pts</span>
                </h3>

                {activeEvent?.scoring_rubric.criteria.map((crit) => {
                  const val = rubricScores[crit.name] ?? Math.round(crit.max * 0.75);
                  const isLocked = activeCandidate.scoreLocked;

                  return (
                    <div key={crit.name} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <div>
                          <strong className="text-navy font-bold">{crit.name}</strong>
                          {crit.description && (
                            <p className="text-[10px] text-gray-500">{crit.description}</p>
                          )}
                        </div>
                        <span className="font-mono font-black text-sm text-navy bg-white px-2 py-0.5 rounded-lg border border-gray-200">
                          {val} / {crit.max}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0}
                        max={crit.max}
                        step={1}
                        value={val}
                        disabled={isLocked}
                        onChange={(e) => handleScoreChange(crit.name, Number(e.target.value))}
                        className="w-full accent-orange-500 cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block">
                  Judge Feedback & Qualitative Remarks
                </label>
                <textarea
                  value={comments}
                  disabled={activeCandidate.scoreLocked}
                  onChange={(e) => setComments(e.target.value)}
                  rows={2}
                  placeholder="Note specific strengths, speech delivery, buzzer reflexes, or styling..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs text-navy focus:outline-none focus:border-orange-500 focus:bg-white disabled:opacity-50"
                />
              </div>

              {/* Total Score & Submit Action */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Evaluation</span>
                  <span className="text-2xl font-black text-navy">{totalScore} <span className="text-xs font-normal text-gray-400">/ 100</span></span>
                </div>

                {!activeCandidate.scoreLocked ? (
                  <button
                    onClick={handleSubmitEvaluation}
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Locking Score...' : 'Submit & Lock Score'}</span>
                  </button>
                ) : (
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-600 block">Score Finalized</span>
                    <span className="text-[10px] text-gray-400">Contact Admin to revise</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-gray-400 text-xs">
              Select a candidate from the left roster to begin rubric evaluation.
            </div>
          )}
        </div>

        {/* COLUMN 3: Track Standings & Event Info (3 Cols) */}
        <div className={`lg:col-span-3 bg-white rounded-3xl p-5 border border-gray-200/80 shadow-sm space-y-5 ${
          mobileTab !== 'standings' ? 'hidden lg:block' : ''
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-navy uppercase tracking-wider flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-orange-500" />
              <span>{activeEvent?.name} Standings</span>
            </h3>
            <span className="text-[10px] text-gray-400 font-mono">
              {trackStandings.length} Scored
            </span>
          </div>

          <div className="space-y-2">
            {trackStandings.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-xs">
                No finalized scores submitted yet for {activeEvent?.name}.
              </div>
            ) : (
              trackStandings.map((st, idx) => (
                <div 
                  key={st.id} 
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
                    idx === 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${
                      idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <strong className="text-navy truncate block font-bold text-[11px]">{st.name}</strong>
                      <span className="text-[10px] text-gray-400 truncate block">{st.institute}</span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-navy text-xs shrink-0">
                    {st.finalScore} pts
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Event Rules & Prize Pool Box */}
          <div className="p-4 rounded-2xl bg-navy-50/60 border border-navy-100 text-xs space-y-2">
            <span className="text-[10px] font-black uppercase text-navy/70 block">
              {activeEvent?.name} Prize Pool
            </span>
            <div className="text-lg font-black text-navy font-mono">
              ₹{activeEvent?.prize_pool?.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-gray-500">
              Format: {activeEvent?.event_type === 'solo' ? 'Individual' : `Team of ${activeEvent?.team_size}`} • Venue: {activeEvent?.venue_location}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
