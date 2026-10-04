import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationItem } from '../types';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(INITIAL_NOTIFICATIONS.filter(n => !n.read_at).length);

  const fetchNotifications = async () => {
    if (!isSupabaseConfigured || !user) {
      setNotifications(INITIAL_NOTIFICATIONS);
      setUnreadCount(INITIAL_NOTIFICATIONS.filter(n => !n.read_at).length);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const notifs = data as NotificationItem[];
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read_at).length);
      } else {
        setNotifications(INITIAL_NOTIFICATIONS);
        setUnreadCount(INITIAL_NOTIFICATIONS.filter(n => !n.read_at).length);
      }
    } catch {
      setNotifications(INITIAL_NOTIFICATIONS);
      setUnreadCount(INITIAL_NOTIFICATIONS.filter(n => !n.read_at).length);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (isSupabaseConfigured && user) {
      try {
        // Use a unique channel name per user to prevent collision
        const channelName = `notifications-${user.id}-${Math.random().toString(36).substring(2, 7)}`;
        const channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => {
              fetchNotifications();
            }
          );

        channel.subscribe();

        return () => {
          try {
            supabase.removeChannel(channel);
          } catch {
            // Ignore channel removal error
          }
        };
      } catch (err) {
        console.warn('[CROSSFIRE] Realtime notification subscription notice:', err);
      }
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);
      } catch {
        // Ignore error
      }
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
    setUnreadCount(0);

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null);
      } catch {
        // Ignore error
      }
    }
  };

  return { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications };
};
