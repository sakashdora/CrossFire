import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface AdminStats {
  totalUsers: number;
  totalRegistrations: number;
  todayRegistrations: number;
  eventsStats: { id: string, name: string, capacity: number, registered: number }[];
  recentRegistrations: any[];
}

export function useAdminData() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();

  useEffect(() => {
    if (role !== 'admin') return;

    async function fetchStats() {
      setIsLoading(true);
      try {
        // 1. Total users
        const { count: totalUsers, error: uErr } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });
        
        // 2. Total registrations
        const { count: totalRegistrations, error: rErr } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true });
          
        // 3. Today's registrations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count: todayRegistrations, error: trErr } = await supabase
          .from('registrations')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today.toISOString());
          
        // 4. Events stats
        const { data: events, error: eErr } = await supabase
          .from('events')
          .select('id, name, max_participants, current_participants');

        // 5. Recent registrations
        const { data: recent, error: recErr } = await supabase
          .from('registrations')
          .select(`
            id,
            created_at,
            status,
            users ( id, first_name, last_name, email ),
            events ( id, name )
          `)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (uErr || rErr || eErr) {
          throw new Error('Failed to fetch admin stats');
        }

        setStats({
          totalUsers: totalUsers || 0,
          totalRegistrations: totalRegistrations || 0,
          todayRegistrations: todayRegistrations || 0,
          eventsStats: (events || []).map(e => ({
            id: e.id,
            name: e.name,
            capacity: e.max_participants,
            registered: e.current_participants
          })),
          recentRegistrations: recent || []
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [role]);

  return { stats, isLoading, error };
}
