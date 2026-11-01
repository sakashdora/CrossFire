import { useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Polls a single number from the database and calls onChange when any operational
// table changed. Full snapshots are only reloaded when something actually changed.
// Every mounted subscriber (operations snapshot, student records) shares one poller,
// so a screen with several live panels still sends one request per interval.
const listeners = new Set<() => void>();
let timer: number | undefined;
let last: number | null = null;
let inFlight = false;

async function check() {
  if (inFlight || document.hidden || !listeners.size) return;
  inFlight = true;
  try {
    const { data, error } = await supabase.rpc('crossfire_live_revision');
    // Missing migration or a lost session: the regular fallback refresh still runs.
    if (error || typeof data !== 'number') return;
    const changed = last !== null && data !== last;
    last = data;
    if (changed) listeners.forEach(listener => listener());
  } catch { /* A network failure is retried on the next interval. */ }
  finally { inFlight = false; }
}

export function useLiveRevision(onChange: () => void, intervalMs = 3000) {
  const callback = useRef(onChange);
  callback.current = onChange;
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const listener = () => callback.current();
    listeners.add(listener);
    if (timer === undefined) {
      last = null;
      void check();
      timer = window.setInterval(check, intervalMs);
    }
    return () => {
      listeners.delete(listener);
      if (!listeners.size && timer !== undefined) { clearInterval(timer); timer = undefined; }
    };
  }, [intervalMs]);
}
