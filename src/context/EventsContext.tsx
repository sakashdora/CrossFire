import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventItem, Registration } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_EVENTS } from '../data/mockData';
import { useAuth } from './AuthContext';
import { studentDataService } from '../services/studentDataService';

interface EventsContextType {
  events: EventItem[];
  userRegistrations: Registration[];
  isLoading: boolean;
  handleRegisterEvent: (eventId: string, teamName?: string, members?: any[]) => Promise<boolean>;
  handleWithdrawEvent: (registrationId: string) => Promise<boolean>;
  handleSubmitMedia: (registrationId: string, url: string) => Promise<boolean>;
  refreshRegistrations: () => Promise<void>;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

export const EventsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!isSupabaseConfigured) {
        setEvents(INITIAL_EVENTS);
        return;
      }
      try {
        const { data, error } = await supabase.from('events').select('*').order('start_time');
        if (data && !error && data.length > 0) {
          const merged = INITIAL_EVENTS.map(localEvent => {
            const remote = data.find((e: any) => e.slug === localEvent.slug || e.id === localEvent.id);
            if (remote) {
              return {
                ...localEvent,
                id: remote.id,
                current_participants: remote.current_participants ?? localEvent.current_participants,
                status: remote.status ?? localEvent.status
              };
            }
            return localEvent;
          });
          setEvents(merged);
        } else {
          setEvents(INITIAL_EVENTS);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents(INITIAL_EVENTS);
      }
    };
    fetchEvents();
  }, []);

  // Helper to map student's selected competitions into Registration objects
  const mapSelectedCompetitionsToRegistrations = (selectedCompetitions: string[] = []): Registration[] => {
    return selectedCompetitions.map((compName, idx) => {
      const cleanName = compName.toLowerCase();
      const matchedEvent = events.find(e => 
        e.name.toLowerCase() === cleanName ||
        e.name.toLowerCase().includes(cleanName) ||
        cleanName.includes(e.name.toLowerCase()) ||
        e.slug.toLowerCase() === cleanName.replace(/[^a-z0-9]/g, '-')
      ) || events[idx % events.length];

      return {
        id: `reg-${user?.id || 'std'}-${idx}`,
        user_id: user?.id || 'std',
        event_id: matchedEvent.id,
        event: matchedEvent,
        status: 'registered',
        created_at: user?.created_at || new Date().toISOString()
      };
    });
  };

  // Fetch registrations
  const fetchRegistrations = async () => {
    if (!user) {
      setUserRegistrations([]);
      setIsLoading(false);
      return;
    }

    if (isSupabaseConfigured) {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('registrations')
          .select(`
            *,
            event:events(*)
          `)
          .eq('user_id', user.id);
          
        if (data && !error && data.length > 0) {
          setUserRegistrations(data as Registration[]);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn('[CROSSFIRE] Supabase registration fetch notice:', err);
      }
    }

    // Seamless fallback to user's registered competitions
    if (user.selected_competitions && user.selected_competitions.length > 0) {
      const mapped = mapSelectedCompetitionsToRegistrations(user.selected_competitions);
      setUserRegistrations(mapped);
    } else {
      const mockRegs = localStorage.getItem('crossfire_mock_regs');
      if (mockRegs) {
        setUserRegistrations(JSON.parse(mockRegs));
      } else {
        setUserRegistrations([]);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user, events]);

  const handleRegisterEvent = async (eventId: string, teamName?: string, members?: any[]): Promise<boolean> => {
    if (userRegistrations.length >= 2) {
      alert('Maximum 2 events registration limit reached per student.');
      return false;
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('register_for_event', {
          p_event_id: eventId,
          p_team_name: teamName || null,
          p_team_members: members || []
        });

        if (!error) {
          await fetchRegistrations();
          return true;
        }
      } catch (err: any) {
        console.warn('[CROSSFIRE] Supabase register_for_event fallback:', err);
      }
    }

    // Local registration fallback
    const event = events.find(e => e.id === eventId);
    if (!event) return false;
    const newReg: Registration = {
      id: `reg-${Date.now()}`,
      user_id: user?.id || 'student',
      event_id: eventId,
      event,
      team_name: teamName,
      team_members: members,
      status: 'registered',
      created_at: new Date().toISOString()
    };
    const updated = [...userRegistrations, newReg];
    setUserRegistrations(updated);
    localStorage.setItem('crossfire_mock_regs', JSON.stringify(updated));

    if (user?.email) {
      const student = studentDataService.findStudentByEmail(user.email);
      if (student) {
        const curCompetitions = student.selected_competitions || [];
        if (!curCompetitions.includes(event.name)) {
          studentDataService.updateStudentStatus(student.id, {
            selected_competitions: [...curCompetitions, event.name]
          });
        }
      }
    }
    return true;
  };

  const handleWithdrawEvent = async (registrationId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('withdraw_registration', {
          p_registration_id: registrationId
        });
        if (!error) {
          await fetchRegistrations();
          return true;
        }
      } catch (err: any) {
        console.warn('[CROSSFIRE] Supabase withdraw fallback:', err);
      }
    }

    const regToRemove = userRegistrations.find(r => r.id === registrationId);
    const updated = userRegistrations.filter(r => r.id !== registrationId);
    setUserRegistrations(updated);
    localStorage.setItem('crossfire_mock_regs', JSON.stringify(updated));

    if (user?.email && regToRemove?.event) {
      const student = studentDataService.findStudentByEmail(user.email);
      if (student) {
        const eventName = regToRemove.event.name;
        studentDataService.updateStudentStatus(student.id, {
          selected_competitions: (student.selected_competitions || []).filter(c => c !== eventName)
        });
      }
    }
    return true;
  };

  const handleSubmitMedia = async (registrationId: string, url: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('submit_media', {
          p_registration_id: registrationId,
          p_url: url
        });
        if (!error) {
          await fetchRegistrations();
          return true;
        }
      } catch (err: any) {
        console.warn('[CROSSFIRE] Supabase submit_media fallback:', err);
      }
    }

    const targetReg = userRegistrations.find(r => r.id === registrationId);
    const updated = userRegistrations.map(r => 
      r.id === registrationId 
        ? { ...r, media_url: url, media_submitted_at: new Date().toISOString() } 
        : r
    );
    setUserRegistrations(updated);
    localStorage.setItem('crossfire_mock_regs', JSON.stringify(updated));

    if (user?.email && targetReg?.event) {
      const student = studentDataService.findStudentByEmail(user.email);
      if (student) {
        const slug = targetReg.event.slug || targetReg.event.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        studentDataService.updateStudentStatus(student.id, {
          media_urls: { ...(student.media_urls || {}), [slug]: url }
        });
      }
    }
    return true;
  };

  return (
    <EventsContext.Provider value={{
      events,
      userRegistrations,
      isLoading,
      handleRegisterEvent,
      handleWithdrawEvent,
      handleSubmitMedia,
      refreshRegistrations: fetchRegistrations
    }}>
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) throw new Error('useEvents must be used within EventsProvider');
  return context;
};
