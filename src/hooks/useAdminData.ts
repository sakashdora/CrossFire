import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { studentDataService, StudentRegistrationRecord, REGISTRATION_EVENT_KEY } from '../services/studentDataService';

export interface AdminStats {
  totalUsers: number;
  totalRegistrations: number;
  todayRegistrations: number;
  checkedInCount: number;
  streamCounts: Record<string, number>;
  eventsStats: { id: string; name: string; capacity: number; registered: number; group?: string }[];
  recentRegistrations: StudentRegistrationRecord[];
  allStudents: StudentRegistrationRecord[];
}

export function useAdminData() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get base metrics & student list from studentDataService
      const localMetrics = studentDataService.getMetrics();
      const allStudents = studentDataService.getAllStudents();

      let finalStats: AdminStats = {
        totalUsers: localMetrics.totalUsers,
        totalRegistrations: localMetrics.totalRegistrations,
        todayRegistrations: localMetrics.todayRegistrations,
        checkedInCount: localMetrics.checkedInCount,
        streamCounts: localMetrics.streamCounts,
        eventsStats: localMetrics.eventsStats,
        recentRegistrations: localMetrics.recentRegistrations,
        allStudents: allStudents,
      };

      // 2. If Supabase is configured and caller has admin role, attempt to supplement from Supabase
      if (isSupabaseConfigured) {
        try {
          const { data: overview, error: ovErr } = await supabase.rpc('admin_overview');
          if (!ovErr && overview) {
            finalStats.totalUsers = Math.max(finalStats.totalUsers, overview.total_students || 0);
            finalStats.totalRegistrations = Math.max(finalStats.totalRegistrations, overview.total_registrations || 0);
          }
        } catch {
          // Gracefully fallback to local synchronized store
        }
      }

      setStats(finalStats);
    } catch (err: any) {
      console.error('[CROSSFIRE] Error loading admin data:', err);
      // Fallback to local metrics so admin dashboard never breaks
      const metrics = studentDataService.getMetrics();
      const allStudents = studentDataService.getAllStudents();
      setStats({
        totalUsers: metrics.totalUsers,
        totalRegistrations: metrics.totalRegistrations,
        todayRegistrations: metrics.todayRegistrations,
        checkedInCount: metrics.checkedInCount,
        streamCounts: metrics.streamCounts,
        eventsStats: metrics.eventsStats,
        recentRegistrations: metrics.recentRegistrations,
        allStudents,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== 'admin') return;

    loadData();

    // Listen to real-time registration events dispatched when students register
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
    return () => {
      window.removeEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
    };
  }, [role, loadData]);

  return { stats, isLoading, error, refreshStats: loadData };
}
