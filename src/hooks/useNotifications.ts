import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { NotificationItem } from '../types';
import { useAuth } from '../context/AuthContext';

export const NOTIFICATIONS_STORAGE_KEY = 'crossfire_system_notifications';
export const NOTIFICATIONS_EVENT_KEY = 'crossfire_notifications_updated';

// Default system announcements for all delegates
export const DEFAULT_ANNOUNCEMENTS: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'announcement',
    title: 'Crossfire 2026 Portal Active',
    message: 'Welcome +2 delegates! Registration for all 6 competitions is live. Compete for ₹50,000 cash prize pool. Complimentary student lunch served at Dining Courtyard.',
    channel: 'in_app',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    action_view: 'register',
    action_label: 'Register Now',
    priority: 'high',
    tag: 'Portal Launch'
  },
  {
    id: 'notif-2',
    type: 'debate_topic',
    title: 'Debate Topics & Schedule Notice',
    message: 'Debate topics will be communicated via mobile WhatsApp / SMS on event morning. 15 minutes prep time in Management Seminar Hall B.',
    channel: 'whatsapp',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    action_view: 'events',
    action_label: 'View Competitions',
    priority: 'normal',
    tag: 'Debate Rules'
  },
  {
    id: 'notif-3',
    type: 'event_reminder',
    title: 'Auditorium A Tech Orientation',
    message: 'Official delegate briefing starts at 09:30 AM in Main Academic Block. Srusti faculty coordinators will assist with badge printing.',
    channel: 'in_app',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    action_view: 'events',
    action_label: 'Schedule & Venues',
    priority: 'normal',
    tag: 'Campus Briefing'
  }
];

// Helper to calculate human-readable relative time dynamically
export const formatNotificationTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    if (diffMs < 0) return 'Just now';
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 45) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${diffHours}h ago (${timeStr})`;
    }
    if (diffDays === 1) {
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Yesterday (${timeStr})`;
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
};

// Global helper to push notification from anywhere in the app
export const pushSystemNotification = (
  notif: Omit<NotificationItem, 'id' | 'created_at'> & { id?: string; created_at?: string }
): NotificationItem => {
  let stored: NotificationItem[] = [];
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    stored = raw ? JSON.parse(raw) : [...DEFAULT_ANNOUNCEMENTS];
    if (!Array.isArray(stored)) stored = [...DEFAULT_ANNOUNCEMENTS];
  } catch {
    stored = [...DEFAULT_ANNOUNCEMENTS];
  }

  const newItem: NotificationItem = {
    ...notif,
    id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    created_at: notif.created_at || new Date().toISOString()
  };

  // Avoid duplicate by ID
  const existingIdx = stored.findIndex(n => n.id === newItem.id);
  if (existingIdx >= 0) {
    stored[existingIdx] = newItem;
  } else {
    stored.unshift(newItem);
  }

  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(stored));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT_KEY, { detail: newItem }));
  } catch (e) {
    console.warn('[CROSSFIRE] Failed to persist system notification:', e);
  }

  return newItem;
};

export const useNotifications = () => {
  const { user } = useAuth();
  const [, setTick] = useState(0);

  const getStoredNotifications = useCallback((): NotificationItem[] => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Failed to parse notifications:', e);
    }
    return DEFAULT_ANNOUNCEMENTS;
  }, []);

  const [notifications, setNotifications] = useState<NotificationItem[]>(getStoredNotifications);

  // Auto-refresh dynamic relative times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => (t + 1) % 1000);
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const unreadCount = notifications.filter(n => !n.read_at).length;

  const fetchNotifications = useCallback(async () => {
    let localList = getStoredNotifications();

    if (isSupabaseConfigured && user) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.is.null`)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          // Merge Supabase notifications with local list to preserve fast updates
          const merged = [...(data as NotificationItem[])];
          for (const item of localList) {
            if (!merged.some(m => m.id === item.id)) {
              merged.push(item);
            }
          }
          setNotifications(merged);
          return;
        }
      } catch (err) {
        console.warn('[CROSSFIRE] Supabase notification fetch notice:', err);
      }
    }

    // Contextual personalization for logged-in user if pass notification not present
    if (user?.id) {
      const passId = `CF26-${user.id.substring(0, 5).toUpperCase()}`;
      const hasPassNotif = localList.some(n => n.id === `pass-${user.id}`);
      if (!hasPassNotif) {
        const passNotif: NotificationItem = {
          id: `pass-${user.id}`,
          user_id: user.id,
          type: 'registration',
          title: `Delegate Pass Active: ${passId}`,
          message: `Welcome ${user.first_name || 'Delegate'}! Your digital QR Pass is ready. Show at Gate 1 Security Desk for fast-track badge collection.`,
          channel: 'in_app',
          created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
          action_view: 'dashboard',
          action_label: 'View Gate Pass',
          priority: 'high',
          tag: 'Delegate ID'
        };
        localList = [passNotif, ...localList];
        try {
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(localList));
        } catch {
          // ignore
        }
      }
    }

    setNotifications(localList);
  }, [user, getStoredNotifications]);

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
            { event: 'INSERT', schema: 'public', table: 'notifications' },
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
  }, [user, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
    );
    setNotifications(updated);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

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

  const markAsUnread = async (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read_at: undefined } : n
    );
    setNotifications(updated);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map(n => ({ ...n, read_at: new Date().toISOString() }));
    setNotifications(updated);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (isSupabaseConfigured && user) {
      try {
        await supabase.rpc('mark_notifications_read');
      } catch {
        // Ignore
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (isSupabaseConfigured && user) {
      try {
        await supabase
          .from('notifications')
          .delete()
          .eq('id', notificationId);
      } catch {
        // Ignore
      }
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }
  };

  const resetToDefaultNotifications = () => {
    setNotifications(DEFAULT_ANNOUNCEMENTS);
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(DEFAULT_ANNOUNCEMENTS));
      window.dispatchEvent(new CustomEvent(NOTIFICATIONS_EVENT_KEY));
    } catch {
      // ignore
    }
  };

  // Broadcast a new notification (Admin function or system event)
  const broadcastNotification = (newNotif: Omit<NotificationItem, 'id' | 'created_at'>) => {
    return pushSystemNotification(newNotif);
  };

  // Live simulation helper (for testing real-time events)
  const simulateLiveNotification = () => {
    const samples: Omit<NotificationItem, 'id' | 'created_at'>[] = [
      {
        type: 'score',
        title: '🏆 Quiz Round 1 Standings Published',
        message: 'Written screening scores have been verified by Judges. Check the live leaderboard for your rank!',
        channel: 'in_app',
        action_view: 'leaderboard',
        action_label: 'View Leaderboard',
        priority: 'high',
        tag: 'Live Scores'
      },
      {
        type: 'announcement',
        title: '🍱 Dining Courtyard Lunch Live',
        message: 'Hot complimentary student lunch packages are being distributed at Dining Courtyard until 2:30 PM.',
        channel: 'in_app',
        action_view: 'dashboard',
        action_label: 'Food Coupon',
        priority: 'normal',
        tag: 'Student Dining'
      },
      {
        type: 'debate_topic',
        title: '🎙️ Debate Semi-Finals Motion Revealed',
        message: 'Motion: "Artificial Intelligence in Classrooms: Catalyst for Equity or Threat to Original Thinking?" 15m prep starts now.',
        channel: 'whatsapp',
        action_view: 'events',
        action_label: 'Debate Arena',
        priority: 'high',
        tag: 'Debate Alert'
      }
    ];

    const chosen = samples[Math.floor(Math.random() * samples.length)];
    return pushSystemNotification(chosen);
  };

  return { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAsUnread,
    markAllAsRead, 
    deleteNotification,
    clearAllNotifications,
    resetToDefaultNotifications,
    broadcastNotification,
    simulateLiveNotification,
    refreshNotifications: fetchNotifications 
  };
};
