import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { EventItem, Registration } from '../types';
import { supabase, isSupabaseConfigured, IS_SHOWCASE_MODE } from '../lib/supabase';
import { EVENT_CATALOG } from '../data/eventCatalog';
import { useAuth } from './AuthContext';

interface EventsContextType {
  events: EventItem[];
  userRegistrations: Registration[];
  isLoading: boolean;
  error: string;
  // Resolves to null when saved, otherwise the reason it was not.
  handleRegisterEvent: (eventId: string, teamName?: string, members?: unknown[]) => Promise<string | null>;
  handleWithdrawEvent: (registrationId: string) => Promise<boolean>;
  handleSubmitMedia: (registrationId: string, url: string) => Promise<boolean>;
  refreshRegistrations: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export function mapEvent(row: Record<string, any>): EventItem {
  const copy = EVENT_CATALOG.find(event => event.slug === row.slug);
  return {
    ...copy,
    ...row,
    group: row.event_group || row.group,
    current_participants: Number(row.current_participants || 0),
  } as EventItem;
}

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, needsMfa } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(IS_SHOWCASE_MODE ? EVENT_CATALOG : []);
  const [userRegistrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setLoading] = useState(IS_SHOWCASE_MODE ? false : true);
  const [eventError, setEventError] = useState('');
  const [registrationError, setRegistrationError] = useState('');
  const [mutationError, setError] = useState('');
  const error = mutationError || registrationError || eventError;
  const eventRevision = useRef(0);
  const registrationRevision = useRef(0);

  const fetchEvents = useCallback(async () => {
    const revision = ++eventRevision.current;
    if (!isSupabaseConfigured || IS_SHOWCASE_MODE) {
      setEvents(EVENT_CATALOG);
      setEventError('');
      setLoading(false);
      return;
    }
    try {
      const { data, error: failure } = await supabase.from('events').select('*').order('start_time');
      if (revision !== eventRevision.current) return;
      if (failure) throw failure;
      setEvents((data || []).map(mapEvent));
      setEventError('');
    } catch {
      if (revision === eventRevision.current) {
        setEvents(EVENT_CATALOG);
        setEventError('');
      }
    } finally {
      if (revision === eventRevision.current) setLoading(false);
    }
  }, []);

  const fetchRegistrations = useCallback(async () => {
    const revision = ++registrationRevision.current;
    if (IS_SHOWCASE_MODE || !user || needsMfa || user.role !== 'student') {
      setRegistrations([]);
      setRegistrationError('');
      return;
    }
    try {
      const { data, error: failure } = await supabase.rpc('crossfire_my_registrations');
      if (revision !== registrationRevision.current) return;
      if (failure) throw failure;
      setRegistrations((data || []).map((row: any) => ({ ...row, event: mapEvent(row.event) })));
      setRegistrationError('');
    } catch {
      if (revision === registrationRevision.current) {
        setRegistrationError('Your registrations could not be refreshed. Previously loaded records may be out of date.');
      }
    }
  }, [user?.id, user?.role, needsMfa]);

  useEffect(() => {
    void fetchEvents();
    if (IS_SHOWCASE_MODE) return;
    const update = () => { if (!document.hidden) void fetchEvents(); };
    const timer = window.setInterval(update, 30000);
    window.addEventListener('crossfire_events_changed', update);
    window.addEventListener('focus', update);
    return () => {
      eventRevision.current++;
      clearInterval(timer);
      window.removeEventListener('crossfire_events_changed', update);
      window.removeEventListener('focus', update);
    };
  }, [fetchEvents]);

  useEffect(() => {
    setRegistrations([]);
    setRegistrationError('');
    setError('');
    if (IS_SHOWCASE_MODE) return;
    void fetchRegistrations();
    const update = () => { if (!document.hidden) void fetchRegistrations(); };
    const timer = window.setInterval(update, 15000);
    window.addEventListener('focus', update);
    return () => {
      registrationRevision.current++;
      clearInterval(timer);
      window.removeEventListener('focus', update);
    };
  }, [fetchRegistrations]);

  // Resolves to null when saved, otherwise the reason it was not.
  const mutate = async (name: string, payload: Record<string, unknown>, report = true): Promise<string | null> => {
    setError('');
    if (!isSupabaseConfigured || IS_SHOWCASE_MODE || !user) {
      const message = IS_SHOWCASE_MODE ? 'Backend services are paused in showcase mode.' : 'Sign in again to make this change.';
      if (report) setError(message);
      return message;
    }
    let problem: string | null = null;
    try {
      const { error: failure } = await supabase.rpc(name, payload);
      if (failure) problem = failure.message || 'The change was not saved.';
      else {
        await fetchRegistrations();
        void fetchEvents();
      }
    } catch {
      problem = 'The change could not be verified. Refresh before retrying.';
    }
    if (problem && report) setError(problem);
    return problem;
  };

  return (
    <EventsContext.Provider
      value={{
        events,
        userRegistrations,
        isLoading,
        error,
        refreshRegistrations: fetchRegistrations,
        handleRegisterEvent: (eventId, teamName, members) =>
          mutate('register_for_event', { p_event_id: eventId, p_team_name: teamName || null, p_team_members: members || [] }, false),
        handleWithdrawEvent: async id => !(await mutate('withdraw_registration', { p_registration_id: id })),
        handleSubmitMedia: async (id, url) => !(await mutate('submit_media', { p_registration_id: id, p_url: url })),
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export function useEvents() {
  const value = useContext(EventsContext);
  if (!value) throw new Error('useEvents must be used within EventsProvider');
  return value;
}

// For screens that can also run without the provider (previews); they simply get no shared events.
export function useOptionalEvents() {
  return useContext(EventsContext);
}
