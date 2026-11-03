import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PROVISIONED_ROLES } from '../lib/roles';
import { registrationStatusFromSetting } from '../lib/registrationNotice';
import { PUBLIC_STUDENT_SIGNIN } from '../lib/studentAccess';

type Result = { success: boolean; error?: string; role?: UserRole };
/** 'error' means the setting could not be read; it is never treated as open. */
export type RegistrationStatus = 'loading' | 'open' | 'closed' | 'error';
/** 'anonymous' is set only after a successful session lookup that found no session. */
export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'error' | 'unconfigured';
interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  isRegistrationOpen: boolean;
  registrationStatus: RegistrationStatus;
  /** Increments each time a registration-status request finishes. */
  registrationCheckCount: number;
  authStatus: AuthStatus;
  needsMfa: boolean;
  mustChangePassword: boolean;
  refreshAuth: () => Promise<void>;
  refreshRegistrationStatus: () => Promise<void>;
  login: (email: string, password: string, audience?: 'staff' | 'student') => Promise<Result>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const unavailable = 'The secure account service is unavailable. Please try again later.';
const genericLoginError = 'Sign-in failed. Check your details and try again. If you have made several attempts, wait before retrying.';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<AuthStatus>(isSupabaseConfigured ? 'loading' : 'unconfigured');
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>(isSupabaseConfigured ? 'loading' : 'error');
  const [registrationCheckCount, setRegistrationCheckCount] = useState(0);
  const [needsMfa, setNeedsMfa] = useState(false);
  const revision = useRef(0);
  const registrationRequest = useRef<Promise<void> | null>(null);
  const registrationRevision = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    const request = ++revision.current;
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        if (request === revision.current) { setUser(null); setNeedsMfa(false); setAuthStatus('anonymous'); }
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
        setAuthStatus('authenticated');
      }
    } catch {
      if (request === revision.current) { setUser(null); setNeedsMfa(false); setAuthStatus('error'); }
    } finally { if (request === revision.current) setLoading(false); }
  }, []);

  // One request at a time; the last resolved status stays in place until it finishes.
  const loadRegistrationStatus = useCallback(() => {
    if (!isSupabaseConfigured) return Promise.resolve();
    if (registrationRequest.current) return registrationRequest.current;
    const request = registrationRevision.current;
    const pending: Promise<void> = (async () => {
      let next: RegistrationStatus = 'error';
      try {
        const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'student_registration_open' });
        next = registrationStatusFromSetting(data, error);
      } catch { /* unavailable */ }
      if (request !== registrationRevision.current) return;
      setRegistrationStatus(next);
      setRegistrationCheckCount(count => count + 1);
    })().finally(() => { if (registrationRequest.current === pending) registrationRequest.current = null; });
    registrationRequest.current = pending;
    return pending;
  }, []);

  useEffect(() => {
    // Legacy private caches and simulated sessions never establish identity.
    ['crossfire_mock_user','crossfire_mock_regs','crossfire_student_records','crossfire_notifications','crossfire_operations_preview_v1'].forEach(key => localStorage.removeItem(key));
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let alive = true;
    let pending: ReturnType<typeof setTimeout> | undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // An earlier "no session" result no longer describes this browser.
      setAuthStatus(status => status === 'anonymous' ? 'loading' : status);
      if (pending) clearTimeout(pending);
      pending = setTimeout(() => { if (alive) void loadProfile(); }, 0);
    });
    const refresh = async () => {
      if (document.hidden || !alive) return;
      await Promise.all([loadProfile(), loadRegistrationStatus()]);
    };
    const onVisibility = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      alive = false; revision.current++; registrationRevision.current++; registrationRequest.current = null;
      subscription.unsubscribe(); if (pending) clearTimeout(pending); clearInterval(interval);
      window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadProfile, loadRegistrationStatus]);

  // Students sign in whether or not registration is open.
  const login = async (email: string, password: string, audience: 'staff' | 'student' = 'staff'): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    setAuthStatus(status => status === 'anonymous' ? 'loading' : status);
    try {
      let error;
      if (audience === 'student' && /^CFS-\d+$/i.test(email.trim())) {
        const grant = await supabase.functions.invoke('student-portal', { body: { action: 'login', student_id: email.trim(), password } });
        error = grant.error || (!grant.data?.access_token || !grant.data?.refresh_token
          ? new Error('Invalid credentials') : (await supabase.auth.setSession(grant.data)).error);
      } else {
        ({ error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password }));
      }
      if (error) { await loadProfile(); return { success: false, error: genericLoginError }; }
      const { data, error: profileError } = await supabase.rpc('crossfire_current_profile');
      if (profileError || !data?.active || (audience === 'staff' ? !PROVISIONED_ROLES.includes(data.role) : data.role !== 'student')) {
        await supabase.auth.signOut({ scope: 'local' });
        return { success: false, error: profileError || !data?.active ? genericLoginError : audience === 'staff' ? (PUBLIC_STUDENT_SIGNIN ? 'This is a student account. Use the Student Login tab.' : 'This is a student account. Use the student sign-in link provided by the organisers.') : 'This account is not a student account. Use the Staff, Judge & VIP tab.' };
      }
      await loadProfile();
      return { success: true, role: data.role };
    } catch { void loadProfile(); return { success: false, error: genericLoginError }; }
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
  return <AuthContext.Provider value={{user,role:user?.role || 'student',isLoading,isConfigured:isSupabaseConfigured,isRegistrationOpen:registrationStatus === 'open',registrationStatus,registrationCheckCount,authStatus,needsMfa,mustChangePassword:Boolean(user?.must_change_password),refreshAuth:loadProfile,refreshRegistrationStatus:loadRegistrationStatus,login,logout}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
