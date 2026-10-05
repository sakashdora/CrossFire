import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

const NOTIFICATIONS_STORAGE_KEY = 'crossfire_system_notifications';
export const NOTIFICATIONS_EVENT_KEY = 'crossfire_notifications_updated';

// Default system announcements for all attendees
const DEFAULT_ANNOUNCEMENTS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'announcement',
    title: 'Crossfire 2026 Portal Active',
    message: 'Welcome +2 delegates! Registration for all 6 competitions is live. Compete for ₹50,000 cash prize pool. Complimentary student lunch served at Dining Courtyard.',
    channel: 'in_app',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'notif-2',
    type: 'debate_topic',
    title: 'Debate Topics & Schedule Notice',
    message: 'Debate topics will be communicated via mobile WhatsApp / SMS on event morning. 15 minutes prep time in Management Seminar Hall B.',
    channel: 'whatsapp',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  }
];

export const useNotifications = () => {
  const { user } = useAuth();
  
  const getStoredNotifications = (): NotificationItem[] => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Failed to parse notifications:', e);
    }
    return DEFAULT_ANNOUNCEMENTS;
  };

  const [notifications, setNotifications] = useState<NotificationItem[]>(getStoredNotifications);
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return getStoredNotifications().filter(n => !n.read_at).length;
  });

  const fetchNotifications = async () => {
    if (isSupabaseConfigured && user) {
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
          return;
        }
      } catch (err) {
        console.warn('[CROSSFIRE] Supabase notification fetch notice:', err);
      }
    }

    const current = getStoredNotifications();
    setNotifications(current);
    setUnreadCount(current.filter(n => !n.read_at).length);
  };

  useEffect(() => {
    fetchNotifications();

    const handleLocalUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener(NOTIFICATIONS_EVENT_KEY, handleLocalUpdate);

    let channel: any = null;
    if (isSupabaseConfigured && user) {
      try {
        const channelName = `notifications-${user.id}-${Math.random().toString(36).substring(2, 7)}`;
        channel = supabase
          .channel(channelName)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => {
              fetchNotifications();
            }
          );
        channel.subscribe();
      } catch (err) {
        console.warn('[CROSSFIRE] Realtime notification subscription notice:', err);
      }
    }

    return () => {
      window.removeEventListener(NOTIFICATIONS_EVENT_KEY, handleLocalUpdate);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Ignore
        }
      }
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map(n => n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read_at).length);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notificationId);
      } catch {
        // Ignore
      }
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read_at: new Date().toISOString() }));
    setNotifications(updated);
    setUnreadCount(0);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));

    if (isSupabaseConfigured && user) {
      try {
        await supabase.rpc('mark_notifications_read');
      } catch {
        // Ignore
      }
    }
  };

  // Broadcast a new notification (Admin function)
  const broadcastNotification = (newNotif: Omit<NotificationItem, 'id' | 'created_at'>) => {
    const current = getStoredNotifications();
    const item: NotificationItem = {
      ...newNotif,
      id: `notif-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    current.unshift(item);
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT_KEY));
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    broadcastNotification,
    refreshNotifications: fetchNotifications 
  };
};
