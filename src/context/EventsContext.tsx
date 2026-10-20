import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { EventItem, Registration } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EVENT_CATALOG } from '../data/eventCatalog';
import { useAuth } from './AuthContext';

interface EventsContextType {
  events: EventItem[]; userRegistrations: Registration[]; isLoading: boolean; error: string;
  handleRegisterEvent: (eventId:string,teamName?:string,members?:unknown[])=>Promise<boolean>;
  handleWithdrawEvent:(registrationId:string)=>Promise<boolean>;
  handleSubmitMedia:(registrationId:string,url:string)=>Promise<boolean>;
  refreshRegistrations:()=>Promise<void>;
}
const EventsContext=createContext<EventsContextType|undefined>(undefined);
export function mapEvent(row:Record<string,any>):EventItem {
  const copy=EVENT_CATALOG.find(event=>event.slug===row.slug);
  return {...copy,...row,group:row.event_group || row.group,current_participants:Number(row.current_participants || 0)} as EventItem;
}
export const EventsProvider:React.FC<{children:React.ReactNode}>=({children})=>{
  const {user,needsMfa}=useAuth();
  const [events,setEvents]=useState<EventItem[]>([]);
  const [userRegistrations,setRegistrations]=useState<Registration[]>([]);
  const [isLoading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const eventRevision=useRef(0);
  const registrationRevision=useRef(0);
  const fetchEvents=useCallback(async()=>{
    const revision=++eventRevision.current;
    if(!isSupabaseConfigured){setError('Event information is unavailable. Please try again later.');setLoading(false);return;}
    try{
      const {data,error:failure}=await supabase.from('events').select('*').order('start_time');
      if(revision!==eventRevision.current)return;
      if(failure)throw failure;
      setEvents((data||[]).map(mapEvent));setError('');
    }catch{if(revision===eventRevision.current){setEvents([]);setError('Event information could not be loaded. Please refresh before registering.');}}
    finally{if(revision===eventRevision.current)setLoading(false);}
  },[]);
  const fetchRegistrations=useCallback(async()=>{
    const revision=++registrationRevision.current;
    if(!user || needsMfa || user.role!=='student'){setRegistrations([]);return;}
    try{
      const {data,error:failure}=await supabase.rpc('crossfire_my_registrations');
      if(revision!==registrationRevision.current)return;
      if(failure)throw failure;
      setRegistrations((data||[]).map((row:any)=>({...row,event:mapEvent(row.event)})));
    }catch{if(revision===registrationRevision.current){setRegistrations([]);setError('Your registrations could not be loaded. Please refresh and try again.');}}
  },[user?.id,user?.role,needsMfa]);
  useEffect(()=>{
    void fetchEvents();
    const update=()=>{if(!document.hidden)void fetchEvents();};
    const timer=window.setInterval(update,30000);
    window.addEventListener('crossfire_events_changed',update);window.addEventListener('focus',update);
    return()=>{eventRevision.current++;clearInterval(timer);window.removeEventListener('crossfire_events_changed',update);window.removeEventListener('focus',update);};
  },[fetchEvents]);
  useEffect(()=>{
    setRegistrations([]);void fetchRegistrations();
    const update=()=>{if(!document.hidden)void fetchRegistrations();};
    const timer=window.setInterval(update,15000);window.addEventListener('focus',update);
    return()=>{registrationRevision.current++;clearInterval(timer);window.removeEventListener('focus',update);};
  },[fetchRegistrations]);
  const mutate=async(name:string,payload:Record<string,unknown>)=>{
    setError('');
    if(!isSupabaseConfigured||!user)return false;
    try{
      const {error:failure}=await supabase.rpc(name,payload);
      if(failure){setError(failure.message||'The change was not saved.');return false;}
      await fetchRegistrations();void fetchEvents();return true;
    }catch{setError('The change could not be verified. Refresh before retrying.');return false;}
  };
  return <EventsContext.Provider value={{events,userRegistrations,isLoading,error,refreshRegistrations:fetchRegistrations,
    handleRegisterEvent:(eventId,teamName,members)=>mutate('register_for_event',{p_event_id:eventId,p_team_name:teamName||null,p_team_members:members||[]}),
    handleWithdrawEvent:(id)=>mutate('withdraw_registration',{p_registration_id:id}),
    handleSubmitMedia:(id,url)=>mutate('submit_media',{p_registration_id:id,p_url:url})
  }}>{children}</EventsContext.Provider>;
};
export function useEvents(){const value=useContext(EventsContext);if(!value)throw new Error('useEvents must be used within EventsProvider');return value;}
