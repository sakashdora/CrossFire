import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user, needsMfa } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState('');
  const sequence = useRef(0);
  const fetchNotifications = useCallback(async () => {
    const revision = ++sequence.current;
    if (!user || needsMfa || !isSupabaseConfigured) {
      setNotifications([]);
      setError('');
      return;
    }
    try {
      const { data, error: failure } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (revision !== sequence.current) return;
      if (failure) throw failure;
      setNotifications(data || []);
      setError('');
    } catch {
      if (revision === sequence.current) {
        setNotifications([]);
        setError('Notifications could not be loaded. Try again shortly.');
      }
    }
  }, [user?.id, needsMfa]);

  useEffect(() => {
    setNotifications([]);
    void fetchNotifications();
    const update = () => {
      if (!document.hidden) void fetchNotifications();
    };
    const timer = window.setInterval(update, 15000);
    window.addEventListener('focus', update);
    return () => {
      sequence.current++;
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, [fetchNotifications]);

  const mark = async (id?: string) => {
    try {
      const { error: failure } = id
        ? await supabase.rpc('crossfire_mark_notification_read', { p_id: id })
        : await supabase.rpc('mark_notifications_read');
      if (failure) throw failure;
      await fetchNotifications();
    } catch {
      setError('Read status was not saved. Please try again.');
    }
  };

  return {
    notifications,
    error,
    unreadCount: notifications.filter(item => !item.read_at).length,
    markAsRead: (id: string) => mark(id),
    markAllAsRead: () => mark(),
    refreshNotifications: fetchNotifications,
  };
};
