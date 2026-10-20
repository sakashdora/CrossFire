import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured, isEmailAuthReady } from '../lib/supabase';

type Result = { success: boolean; error?: string; role?: UserRole; passId?: string };
type RegistrationInput = Omit<UserProfile, 'id' | 'role' | 'created_at'>;
interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  isStudentPortalOpen: boolean;
  needsMfa: boolean;
  refreshAuth: () => Promise<void>;
  requestEmailCode: (email: string, createAccount?: boolean) => Promise<Result>;
  verifyEmailCode: (email: string, code: string) => Promise<Result>;
  login: (email: string, password: string) => Promise<Result>;
  signUp: (data: RegistrationInput) => Promise<Result>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const unavailable = 'The secure account service is unavailable. Please try again later.';
const genericLoginError = 'Sign-in failed. Check your details and try again. If you have made several attempts, wait before retrying.';
const staffRoles = ['admin', 'super_admin', 'volunteer', 'judge', 'organizer'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isStudentPortalOpen, setPortalOpen] = useState(false);
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
      if (error || !data?.active) throw new Error('Account access is unavailable.');
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError) throw assuranceError;
      if (request === revision.current) {
        setUser(data as UserProfile);
        setNeedsMfa(staffRoles.includes(data.role) && assurance?.currentLevel !== 'aal2');
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
      const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'student_portal_open' });
      if (alive) setPortalOpen(!error && data === true);
    };
    void refresh();
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { alive = false; revision.current++; subscription.unsubscribe(); if (pending) clearTimeout(pending); clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [loadProfile]);

  const requestEmailCode = async (email: string, createAccount = false): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    if (!isEmailAuthReady) return { success: false, error: 'Email verification is not open yet. Please use the official registration form or contact the college organisers.' };
    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254) return { success: false, error: 'Enter a valid email address.' };
    const { error } = await supabase.auth.signInWithOtp({ email: cleanEmail, options: { shouldCreateUser: createAccount, data: { app: 'crossfire' }, emailRedirectTo: window.location.origin + '/#register' } });
    return error ? { success: false, error: 'A sign-in code could not be sent. Wait a minute and try again, or contact the organisers.' } : { success: true };
  };

  const verifyEmailCode = async (email: string, code: string): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    if (!/^\d{6,10}$/.test(code.trim())) return { success: false, error: 'Enter the code from your email.' };
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    if (error) return { success: false, error: 'The code is incorrect or has expired. Request a new code and try again.' };
    const { error: profileError } = await supabase.rpc('ensure_profile');
    if (profileError) { await supabase.auth.signOut({ scope: 'local' }); return { success: false, error: 'Your account could not be opened. Contact the organisers.' }; }
    const { data, error: accessError } = await supabase.rpc('crossfire_current_profile');
    if (accessError || !data?.active) return { success: false, error: 'Your account is not active. Contact the organisers.' };
    await loadProfile();
    return { success: true, role: data.role };
  };

  const login = async (email: string, password: string): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) return { success: false, error: genericLoginError };
      const { data, error: profileError } = await supabase.rpc('crossfire_current_profile');
      if (profileError || !data?.active || !staffRoles.includes(data.role)) {
        await supabase.auth.signOut({ scope: 'local' });
        return { success: false, error: genericLoginError };
      }
      await loadProfile();
      return { success: true, role: data.role };
    } catch { return { success: false, error: genericLoginError }; }
  };

  const signUp = async (input: RegistrationInput): Promise<Result> => {
    if (!isSupabaseConfigured) return { success: false, error: unavailable };
    try {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user?.email_confirmed_at || auth.user.email?.toLowerCase() !== input.email.trim().toLowerCase()) return { success: false, error: 'Verify this email address before submitting your registration.' };
      const { selected_competitions, ...profile } = input;
      const slugs = (selected_competitions || []).map(name => name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      const { error } = await supabase.rpc('submit_registration_form', { p_profile: profile, p_event_slugs: slugs });
      if (error) return { success: false, error: error.message || 'Registration was not saved. Please try again.' };
      const { data: receipt, error: receiptError } = await supabase.rpc('crossfire_registration_receipt');
      if (receiptError || !receipt?.pass_code) return { success: false, error: 'Your submission could not be verified. Sign in and review your registration before retrying.' };
      await loadProfile();
      return { success: true, passId: receipt.pass_code };
    } catch { return { success: false, error: 'Registration could not be verified. Check your connection and review your account before retrying.' }; }
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
  return <AuthContext.Provider value={{user,role:user?.role || 'student',isLoading,isConfigured:isSupabaseConfigured,isStudentPortalOpen,needsMfa,refreshAuth:loadProfile,requestEmailCode,verifyEmailCode,login,signUp,logout}}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
};
