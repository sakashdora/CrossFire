import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { 
  Trophy, 
  Search, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Sparkles,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { leaderboard } = useLeaderboard();
  const [searchQuery, setSearchQuery] = useState('');
  const [boardFilter, setBoardFilter] = useState<'all' | 'CBSE' | 'ICSE' | 'CHSE'>('all');

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const filteredEntries = leaderboard.filter((entry) => {
    const matchesSearch = 
      entry.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.school_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBoard = boardFilter === 'all' || entry.board === boardFilter;
    return matchesSearch && matchesBoard;
  });

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Real-Time Scoring Broadcast
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-navy flex items-center gap-2">
            <Trophy className="w-7 h-7 text-orange-500" />
            <span>CrossFire 2026 Live Leaderboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            State-level aggregated scores across preliminary heats and campus finals at Srusti Academy.
          </p>
        </div>

        <button
          onClick={triggerConfetti}
          className="self-start md:self-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all hover:scale-105"
        >
          <Sparkles className="w-4 h-4" />
          <span>Celebrate Champions 🎉</span>
        </button>
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        {/* 2nd Place */}
        {top3[1] && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between order-2 md:order-1 text-center relative overflow-hidden">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-3 shadow-inner">
              🥈
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">
              2nd Place • Runner-Up
            </span>
            <h3 className="text-base font-bold text-navy truncate">{top3[1].participant_name}</h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{top3[1].school_name}</p>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="text-2xl font-black text-navy">{top3[1].total_score}</span>
              <span className="text-xs text-gray-500 block">Total Points</span>
            </div>
          </div>
        )}

        {/* 1st Place (Gold Champion) */}
        {top3[0] && (
          <div className="bg-gradient-to-b from-amber-50 to-white rounded-3xl border-2 border-amber-300 p-6 sm:p-8 shadow-xl flex flex-col justify-between order-1 md:order-2 text-center relative overflow-hidden -translate-y-2">
            <div className="absolute top-0 left-0 right-0 bg-amber-400 text-navy font-black text-[10px] uppercase py-1 tracking-widest">
              State Champion Lead
            </div>
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-300 text-white rounded-full flex items-center justify-center font-black text-3xl mx-auto mt-2 mb-3 shadow-md">
              🥇
            </div>
            <span className="text-xs font-black text-amber-700 uppercase tracking-widest block mb-1">
              1st Place • ₹6,000 + Gold Trophy
            </span>
            <h3 className="text-lg font-black text-navy truncate">{top3[0].participant_name}</h3>
            <p className="text-xs text-gray-600 truncate mt-0.5 font-medium">{top3[0].school_name}</p>
            <div className="mt-4 pt-4 border-t border-amber-200">
              <span className="text-3xl font-black text-navy">{top3[0].total_score}</span>
              <span className="text-xs text-gray-500 block">Total Points</span>
            </div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between order-3 text-center relative overflow-hidden">
            <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-full flex items-center justify-center font-black text-xl mx-auto mb-3 shadow-inner">
              🥉
            </div>
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block mb-1">
              3rd Place • 2nd Runner-Up
            </span>
            <h3 className="text-base font-bold text-navy truncate">{top3[2].participant_name}</h3>
            <p className="text-xs text-gray-500 truncate mt-0.5">{top3[2].school_name}</p>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <span className="text-2xl font-black text-navy">{top3[2].total_score}</span>
              <span className="text-xs text-gray-500 block">Total Points</span>
            </div>
          </div>
        )}

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student or school..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy focus:border-navy"
          />
        </div>

        {/* Board Filter */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Board:
          </span>
          {(['all', 'CBSE', 'ICSE', 'CHSE'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBoardFilter(b)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                boardFilter === b
                  ? 'bg-navy text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {b.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-navy-50 text-navy font-black text-xs uppercase tracking-wider border-b border-navy-100">
                <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                <th className="py-3.5 px-4 w-12 text-center">Trend</th>
                <th className="py-3.5 px-4">Participant / Team</th>
                <th className="py-3.5 px-4">School & Council</th>
                <th className="py-3.5 px-4 text-center">Events</th>
                <th className="py-3.5 px-4 text-right">Aggregated Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">
                    No leaderboard scores found. Standings will populate live as jury evaluations are submitted.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                const isCurrent = entry.is_current_user || (user && entry.user_id === user.id);

                return (
                  <tr
                    key={entry.rank}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-orange-100/80 font-bold border-l-4 border-l-orange-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-black">
                      {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : `#${entry.rank}`}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {entry.trend === 'up' && <ArrowUp className="w-3.5 h-3.5 text-emerald-600 inline" />}
                      {entry.trend === 'down' && <ArrowDown className="w-3.5 h-3.5 text-red-500 inline" />}
                      {entry.trend === 'same' && <Minus className="w-3.5 h-3.5 text-gray-400 inline" />}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-navy text-xs sm:text-sm">
                          {entry.participant_name}
                        </span>
                        {isCurrent && (
                          <span className="bg-orange-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-xs">{entry.school_name}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                          {entry.board}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center text-gray-500 font-semibold">
                      {entry.events_count}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className="text-sm sm:text-base font-black text-navy font-mono">
                        {entry.total_score}
                      </span>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
