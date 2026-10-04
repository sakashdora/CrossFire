import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventItem, Registration } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { INITIAL_EVENTS } from '../data/mockData';
import { useAuth } from './AuthContext';

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
        if (data && !error) {
          setEvents(data as EventItem[]);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      }
    };
    fetchEvents();
  }, []);

  // Fetch registrations
  const fetchRegistrations = async () => {
    if (!user) {
      setUserRegistrations([]);
      setIsLoading(false);
      return;
    }
    
    if (!isSupabaseConfigured) {
      // Load mock registrations
      const mockRegs = localStorage.getItem('crossfire_mock_regs');
      if (mockRegs) {
        setUserRegistrations(JSON.parse(mockRegs));
      }
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*)
        `)
        .eq('user_id', user.id);
        
      if (data && !error) {
        setUserRegistrations(data as Registration[]);
      }
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [user]);

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

        if (error) {
          alert('Registration failed: ' + error.message);
          return false;
        }

        await fetchRegistrations();
        return true;
      } catch (err: any) {
        alert('Registration failed: ' + err.message);
        return false;
      }
    } else {
      // Mock logic
      const event = events.find(e => e.id === eventId);
      if (!event) return false;
      const newReg: Registration = {
        id: `reg-${Date.now()}`,
        user_id: user?.id || 'guest',
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
      return true;
    }
  };

  const handleWithdrawEvent = async (registrationId: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('withdraw_registration', {
          p_registration_id: registrationId
        });
        if (error) {
          alert('Withdrawal failed: ' + error.message);
          return false;
        }
        await fetchRegistrations();
        return true;
      } catch (err: any) {
        alert('Withdrawal failed: ' + err.message);
        return false;
      }
    } else {
      const updated = userRegistrations.filter(r => r.id !== registrationId);
      setUserRegistrations(updated);
      localStorage.setItem('crossfire_mock_regs', JSON.stringify(updated));
      return true;
    }
  };

  const handleSubmitMedia = async (registrationId: string, url: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.rpc('submit_media', {
          p_registration_id: registrationId,
          p_url: url
        });
        if (error) {
          alert('Media submission failed: ' + error.message);
          return false;
        }
        await fetchRegistrations();
        return true;
      } catch (err: any) {
        alert('Media submission failed: ' + err.message);
        return false;
      }
    } else {
      const updated = userRegistrations.map(r => 
        r.id === registrationId 
          ? { ...r, media_url: url, media_submitted_at: new Date().toISOString() } 
          : r
      );
      setUserRegistrations(updated);
      localStorage.setItem('crossfire_mock_regs', JSON.stringify(updated));
      return true;
    }
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
