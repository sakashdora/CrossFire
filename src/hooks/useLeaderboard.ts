import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { LeaderboardEntry } from '../types';
import { useAuth } from '../context/AuthContext';

export const useLeaderboard=()=>{
  const {user}=useAuth();
  const [leaderboard,setLeaderboard]=useState<LeaderboardEntry[]>([]);
  const [isLoading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const revision=useRef(0);
  const fetchLeaderboard=useCallback(async()=>{
    const current=++revision.current;
    try{
      if(!isSupabaseConfigured)throw new Error('Unavailable');
      const {data,error:failure}=await supabase.rpc('get_leaderboard');
      if(current!==revision.current)return;
      if(failure)throw failure;
      setLeaderboard((data||[]).map((row:any,index:number)=>({...row,user_id:`published-${index}`,rank:Number(row.rank),events_count:Number(row.events_count),total_score:Number(row.total_score),is_current_user:row.is_current_user===true,trend:'same'})));
      setError('');
    }catch{if(current===revision.current){setLeaderboard([]);setError('Results could not be loaded. Please try again shortly.');}}
    finally{if(current===revision.current)setLoading(false);}
  },[user?.id]);
  useEffect(()=>{
    void fetchLeaderboard();
    const update=()=>{if(!document.hidden)void fetchLeaderboard();};
    const timer=window.setInterval(update,15000);window.addEventListener('focus',update);
    return()=>{revision.current++;clearInterval(timer);window.removeEventListener('focus',update);};
  },[fetchLeaderboard]);
  return {leaderboard,isLoading,error,refreshLeaderboard:fetchLeaderboard};
};
