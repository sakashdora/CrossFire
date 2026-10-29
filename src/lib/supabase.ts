import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if user has provided real Supabase project credentials
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('mock-crossfire') &&
  !supabaseUrl.includes('your-project') &&
  supabaseUrl.startsWith('https://')
);

// Initialized Supabase client for main app session
export const supabase = createClient(
  supabaseUrl || 'https://configuration.invalid',
  supabaseAnonKey || 'unconfigured',
  { auth: { storage: window.sessionStorage, storageKey: 'crossfire.auth', flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
