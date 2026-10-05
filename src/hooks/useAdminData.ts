import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { studentDataService, StudentRegistrationRecord, REGISTRATION_EVENT_KEY } from '../services/studentDataService';
import { guestVolunteerService, GUEST_UPDATED_EVENT, VOLUNTEER_UPDATED_EVENT } from '../services/guestVolunteerService';
import { GuestItem, VolunteerItem } from '../types';

export interface AdminStats {
  totalUsers: number;
  totalRegistrations: number;
  todayRegistrations: number;
  checkedInCount: number;
  foodRedeemedCount: number;
  streamCounts: Record<string, number>;
  eventsStats: { id: string; name: string; capacity: number; registered: number; group?: string }[];
  recentRegistrations: StudentRegistrationRecord[];
  allStudents: StudentRegistrationRecord[];
  guests: GuestItem[];
  volunteers: VolunteerItem[];
  guestMetrics: {
    total: number;
    confirmed: number;
    arrived: number;
    pending: number;
    judges: number;
    vips: number;
  };
  volunteerMetrics: {
    total: number;
    onDuty: number;
    kitsIssued: number;
    assigned: number;
    absent: number;
  };
}

export function useAdminData() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { role, isLoading: authIsLoading } = useAuth();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Get base metrics & student list from studentDataService
      const localMetrics = studentDataService.getMetrics();
      const allStudents = studentDataService.getAllStudents();
      const guests = guestVolunteerService.getAllGuests();
      const volunteers = guestVolunteerService.getAllVolunteers();
      const guestMetrics = guestVolunteerService.getGuestMetrics();
      const volunteerMetrics = guestVolunteerService.getVolunteerMetrics();

      let finalStats: AdminStats = {
        totalUsers: localMetrics.totalUsers,
        totalRegistrations: localMetrics.totalRegistrations,
        todayRegistrations: localMetrics.todayRegistrations,
        checkedInCount: localMetrics.checkedInCount,
        foodRedeemedCount: localMetrics.foodRedeemedCount,
        streamCounts: localMetrics.streamCounts,
        eventsStats: localMetrics.eventsStats,
        recentRegistrations: localMetrics.recentRegistrations,
        allStudents: allStudents,
        guests,
        volunteers,
        guestMetrics,
        volunteerMetrics
      };

      // 2. If Supabase is configured and caller has admin role, supplement from Supabase
      if (isSupabaseConfigured) {
        try {
          const { data: overview, error: ovErr } = await supabase.rpc('admin_overview');
          if (!ovErr && overview) {
            finalStats.totalUsers = Math.max(finalStats.totalUsers, overview.total_students || 0);
            finalStats.totalRegistrations = Math.max(finalStats.totalRegistrations, overview.total_registrations || 0);
            if (overview.checked_in !== undefined) {
              finalStats.checkedInCount = Math.max(finalStats.checkedInCount, overview.checked_in);
            }
          }
        } catch {
          // Gracefully fallback to synchronized store
        }
      }

      setStats(finalStats);
    } catch (err: any) {
      console.error('[CROSSFIRE] Error loading admin data:', err);
      const metrics = studentDataService.getMetrics();
      const allStudents = studentDataService.getAllStudents();
      const guests = guestVolunteerService.getAllGuests();
      const volunteers = guestVolunteerService.getAllVolunteers();
      setStats({
        totalUsers: metrics.totalUsers,
        totalRegistrations: metrics.totalRegistrations,
        todayRegistrations: metrics.todayRegistrations,
        checkedInCount: metrics.checkedInCount,
        foodRedeemedCount: metrics.foodRedeemedCount,
        streamCounts: metrics.streamCounts,
        eventsStats: metrics.eventsStats,
        recentRegistrations: metrics.recentRegistrations,
        allStudents,
        guests,
        volunteers,
        guestMetrics: guestVolunteerService.getGuestMetrics(),
        volunteerMetrics: guestVolunteerService.getVolunteerMetrics()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Wait for auth to finish hydrating before checking role
    if (authIsLoading) return;
    if (role !== 'admin') return;

    loadData();

    // Listen to real-time events dispatched on registrations, guests, volunteers
    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
    window.addEventListener(GUEST_UPDATED_EVENT, handleUpdate);
    window.addEventListener(VOLUNTEER_UPDATED_EVENT, handleUpdate);

    // Supabase realtime channel if configured
    let channel: any = null;
    if (isSupabaseConfigured) {
      try {
        channel = supabase
          .channel('admin-dashboard-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => {
            loadData();
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
            loadData();
          })
          .subscribe();
      } catch (e) {
        console.warn('[CROSSFIRE] Supabase realtime channel notice:', e);
      }
    }

    return () => {
      window.removeEventListener(REGISTRATION_EVENT_KEY, handleUpdate);
      window.removeEventListener(GUEST_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(VOLUNTEER_UPDATED_EVENT, handleUpdate);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Ignore removal error
        }
      }
    };
  }, [role, authIsLoading, loadData]);

  return { stats, isLoading, error, refreshStats: loadData };
}
