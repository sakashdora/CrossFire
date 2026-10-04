import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LeaderboardEntry } from '../types';
import { INITIAL_LEADERBOARD } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isSupabaseConfigured) {
        setLeaderboard(INITIAL_LEADERBOARD);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Fetch all users and their scores
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, school_name, board');
          
        if (usersError) throw usersError;

        const { data: regs, error: regsError } = await supabase
          .from('registrations')
          .select('user_id, score')
          .not('score', 'is', null);

        if (regsError) throw regsError;

        const userScores: Record<string, { total: number, count: number }> = {};
        
        regs.forEach(reg => {
          if (!userScores[reg.user_id]) {
            userScores[reg.user_id] = { total: 0, count: 0 };
          }
          userScores[reg.user_id].total += Number(reg.score) || 0;
          userScores[reg.user_id].count += 1;
        });

        const newLeaderboard: LeaderboardEntry[] = users
          .filter(u => userScores[u.id])
          .map(u => ({
            rank: 0,
            user_id: u.id,
            participant_name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            school_name: u.school_name || 'N/A',
            board: u.board as any,
            events_count: userScores[u.id].count,
            total_score: userScores[u.id].total,
            is_current_user: user?.id === u.id,
            trend: 'same' as const
          }))
          .sort((a, b) => b.total_score - a.total_score)
          .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

        setLeaderboard(newLeaderboard);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setLeaderboard(INITIAL_LEADERBOARD); // fallback
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  return { leaderboard, isLoading };
};
