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

if (!isSupabaseConfigured) {
  console.info(
    '[CROSSFIRE] Supabase credentials not detected or using placeholder. Running in Mock/Demo mode with full offline testing support. To connect live Supabase, update .env with your project URL and anon key.'
  );
}

// Initialized Supabase client for main app session
export const supabase = createClient(
  supabaseUrl || 'https://mock-crossfire.supabase.co',
  supabaseAnonKey || 'mock-anon-key'
);

// Factory for isolated Supabase client that will never contaminate or mutate the main browser session
export const createIsolatedClient = () => {
  return createClient(
    supabaseUrl || 'https://mock-crossfire.supabase.co',
    supabaseAnonKey || 'mock-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  );
};
