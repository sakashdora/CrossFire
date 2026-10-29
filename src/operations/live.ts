import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Polls a single number from the database and calls onChange when any operational
// table changed. Full snapshots are only reloaded when something actually changed.
export function useLiveRevision(onChange: () => void, intervalMs = 3000) {
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let alive = true;
    let last: number | null = null;
    let inFlight = false;
    const check = async () => {
      if (!alive || inFlight || document.hidden) return;
      inFlight = true;
      try {
        const { data, error } = await supabase.rpc('crossfire_live_revision');
        // Missing migration or a lost session: the regular fallback refresh still runs.
        if (error || typeof data !== 'number' || !alive) return;
        if (last !== null && data !== last) callback.current();
        last = data;
      } finally { inFlight = false; }
    };
    void check();
    const timer = window.setInterval(check, intervalMs);
    return () => { alive = false; clearInterval(timer); };
  }, [intervalMs]);
}
