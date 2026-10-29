import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PROVISIONED_ROLES } from '../lib/roles';

type Result = { success: boolean; error?: string; role?: UserRole };
interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  isRegistrationOpen: boolean;
  needsMfa: boolean;
  mustChangePassword: boolean;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string, audience?: 'staff' | 'student') => Promise<Result>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const unavailable = 'The secure account service is unavailable. Please try again later.';
const genericLoginError = 'Sign-in failed. Check your details and try again. If you have made several attempts, wait before retrying.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRegistrationOpen, setRegistrationOpen] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const revision = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const request = ++revision.current;
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        if (request === revision.current) { setUser(null); setNeedsMfa(false); }
        return;
      }
      const { data, error } = await supabase.rpc('crossfire_current_profile');
      if (error || !data?.active) {
        // A deactivated or removed account ends this browser session; a network error does not.
        if (error?.code === 'P0001' || (data && !data.active)) await supabase.auth.signOut({ scope: 'local' });
        throw new Error('Account access is unavailable.');
      }
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (request === revision.current) {
        setUser(data as UserProfile);
        // Only super admins use an authenticator; the database enforces the same rule.
        setNeedsMfa(data.role === 'super_admin' && assurance?.currentLevel !== 'aal2');
      }
    } catch {
      if (request === revision.current) { setUser(null); setNeedsMfa(false); }
    } finally { if (request === revision.current) setLoading(false); }
  }, []);

  useEffect(() => {
    // Legacy private caches and simulated sessions never establish identity.
    ['crossfire_mock_user','crossfire_mock_regs','crossfire_student_records','crossfire_notifications','crossfire_operations_preview_v1'].forEach(key => localStorage.removeItem(key));
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let alive = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { if (alive) void loadProfile(); }, 0);
    });
    const refresh = async () => {
      if (document.hidden || !alive) return;
      await loadProfile();
      const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'student_registration_open' });
      if (alive) setRegistrationOpen(!error && data === true);
    };
    void refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { alive = false; revision.current++; subscription.unsubscribe(); if (pending) clearTimeout(pending); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [loadProfile]);

  // Students sign in whether or not registration is open.
  const login = async (email: string, password: string, audience: 'staff' | 'student' = 'staff'): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return { success: false, error: genericLoginError };
      const { data, error: profileError } = await supabase.rpc('crossfire_current_profile');
      if (profileError || !data?.active || (audience === 'staff' ? !PROVISIONED_ROLES.includes(data.role) : data.role !== 'student')) {
        await supabase.auth.signOut({ scope: 'local' });
        return { success: false, error: profileError || !data?.active ? genericLoginError : audience === 'staff' ? 'This is a student account. Use the Student Login tab.' : 'This account is not a student account. Use the Staff, Judge & VIP tab.' };
      }
      await loadProfile();
      return { success: true, role: data.role };
    } catch { return { success: false, error: genericLoginError }; }
  };

  const logout = async () => {
    revision.current++;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    setUser(null); setNeedsMfa(false);
    if (error) {
      // Remove this application's local tokens even if remote revocation fails.
      sessionStorage.removeItem('crossfire.auth');
      sessionStorage.removeItem('crossfire.auth-code-verifier');
      window.location.replace(window.location.origin + '/#landing');
    }
  };
  return <AuthContext.Provider value={{user,role:user?.role || 'student',isLoading,isConfigured:isSupabaseConfigured,isRegistrationOpen,needsMfa,mustChangePassword:Boolean(user?.must_change_password),refreshAuth:loadProfile,login,logout}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
