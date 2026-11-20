import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// In static showcase mode, backend services are safely suspended.
export const IS_SHOWCASE_MODE: boolean = import.meta.env.VITE_SHOWCASE_MODE !== 'false';

// Detect if user has provided real Supabase project credentials AND showcase mode is explicitly disabled
export const isSupabaseConfigured: boolean = !IS_SHOWCASE_MODE && Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('mock-crossfire') &&
  !supabaseUrl.includes('your-project') &&
  (supabaseUrl.startsWith('https://') || (import.meta.env.DEV && /^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(supabaseUrl)))
);

// Initialized Supabase client for main app session.
// In showcase mode, uses an inert client configuration without issuing background network requests.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://configuration.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'unconfigured',
  {
    auth: {
      storage: window.sessionStorage,
      storageKey: 'crossfire.auth',
      flowType: 'pkce',
      persistSession: isSupabaseConfigured,
      autoRefreshToken: isSupabaseConfigured,
      detectSessionInUrl: isSupabaseConfigured,
    },
  }
);
