import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LeaderboardEntry } from '../types';
import { studentDataService, REGISTRATION_EVENT_KEY } from '../services/studentDataService';
import { useAuth } from '../context/AuthContext';

export const useLeaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setIsLoading(true);
    try {
      // 1. First try Supabase get_leaderboard RPC if configured
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.rpc('get_leaderboard');
          if (!error && data && data.length > 0) {
            const mapped: LeaderboardEntry[] = data.map((d: any, idx: number) => ({
              rank: Number(d.rank) || (idx + 1),
              user_id: d.user_id || `u-${idx}`,
              participant_name: d.participant_name,
              school_name: d.school_name,
              board: d.board,
              events_count: Number(d.events_count) || 1,
              total_score: Number(d.total_score) || 0,
              is_current_user: user ? d.is_current_user || (d.participant_name?.toLowerCase().includes(user.first_name?.toLowerCase())) : false,
              trend: 'same' as const
            }));
            setLeaderboard(mapped);
            setIsLoading(false);
            return;
          }
        } catch (rpcErr) {
          console.warn('[CROSSFIRE] get_leaderboard RPC notice:', rpcErr);
        }
      }

      // 2. Real calculated leaderboard from all stored student registrations
      const computed = studentDataService.getComputedLeaderboard();
      if (computed.length > 0) {
        const withCurrentUser = computed.map(entry => ({
          ...entry,
          is_current_user: user ? (entry.user_id === user.id || entry.participant_name.toLowerCase().includes(user.first_name.toLowerCase())) : false
        }));
        setLeaderboard(withCurrentUser);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error('[CROSSFIRE] Error fetching leaderboard:', err);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Listen to real-time registration / score updates
    const handleUpdate = () => {
      fetchLeaderboard();
    };

    window.addEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
    return () => {
      window.removeEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
    };
  }, [user]);

  return { leaderboard, isLoading, refreshLeaderboard: fetchLeaderboard };
};
