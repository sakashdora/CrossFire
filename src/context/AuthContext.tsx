import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_USERS } from '../data/mockData';
import { studentDataService } from '../services/studentDataService';
import { guestVolunteerService } from '../services/guestVolunteerService';


interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  isStudentPortalOpen: boolean;
  setStudentPortalStatus: (open: boolean) => Promise<{ success: boolean; error?: string }>;
  checkStudentPortalStatus: () => Promise<boolean>;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  loginWithEmail: (email: string, passIdOrPassword?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (formData: Omit<UserProfile, 'id' | 'role' | 'created_at'> & { password?: string }) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<UserProfile>) => Promise<void>;
  switchRoleForTesting: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStudentPortalOpen, setIsStudentPortalOpen] = useState<boolean>(() => {
    return localStorage.getItem('crossfire_student_portal_open') === 'true';
  });

  const checkStudentPortalStatus = async (): Promise<boolean> => {
    let open = false;
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.rpc('get_system_setting', { p_key: 'student_portal_open' });
        if (!error && data !== null && data !== undefined) {
          open = data === true || data === 'true';
        } else {
          const { data: row } = await supabase.from('system_settings').select('value').eq('key', 'student_portal_open').maybeSingle();
          if (row) {
            open = row.value === true || row.value === 'true';
          } else {
            open = localStorage.getItem('crossfire_student_portal_open') === 'true';
          }
        }
      } catch {
        open = localStorage.getItem('crossfire_student_portal_open') === 'true';
      }
    } else {
      open = localStorage.getItem('crossfire_student_portal_open') === 'true';
    }
    setIsStudentPortalOpen(open);
    localStorage.setItem('crossfire_student_portal_open', String(open));
    return open;
  };

  const setStudentPortalStatus = async (open: boolean): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsStudentPortalOpen(open);
      localStorage.setItem('crossfire_student_portal_open', String(open));

      if (isSupabaseConfigured) {
        try {
          const { error: rpcErr } = await supabase.rpc('admin_set_system_setting', {
            p_key: 'student_portal_open',
            p_value: open
          });
          if (rpcErr) {
            console.warn('[CROSSFIRE] RPC admin_set_system_setting warning:', rpcErr);
            await supabase.from('system_settings').upsert({ key: 'student_portal_open', value: open });
          }
        } catch (e) {
          console.warn('[CROSSFIRE] Direct system_setting update fallback:', e);
        }
      }
      return { success: true };
    } catch (err: any) {
      console.error('[CROSSFIRE] Failed to update portal status:', err);
      return { success: false, error: err.message || 'Failed to update portal status' };
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkStudentPortalStatus();

        // First, check if there's a saved active user in localStorage
        const savedMockUser = localStorage.getItem('crossfire_mock_user');
        if (savedMockUser) {
          const parsed = JSON.parse(savedMockUser);
          // Purge legacy demo student so visitors aren't automatically logged in as Akash
          if (parsed.id === 'user-student-demo' || parsed.email === 'imazureakash@gmail.com') {
            localStorage.removeItem('crossfire_mock_user');
            setUser(null);
            setIsLoading(false);
            return;
          }

          // Check if this student has updated records in studentDataService
          if (parsed.email) {
            const freshStudent = studentDataService.findStudentByEmail(parsed.email);
            if (freshStudent) {
              const fullProfile = studentDataService.toUserProfile(freshStudent);
              setUser(fullProfile);
              localStorage.setItem('crossfire_mock_user', JSON.stringify(fullProfile));
              setIsLoading(false);
              return;
            }
          }
          setUser(parsed);
          setIsLoading(false);
          return;
        }

        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Check studentDataService first
            const existingStudent = studentDataService.findStudentByEmail(session.user.email || '');
            if (existingStudent) {
              const profile = studentDataService.toUserProfile(existingStudent);
              setUser(profile);
              localStorage.setItem('crossfire_mock_user', JSON.stringify(profile));
              setIsLoading(false);
              return;
            }

            // Fallback to Supabase users table query
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (data && !error) {
              setUser(data as UserProfile);
            } else {
              const meta = session.user.user_metadata || {};
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                first_name: meta.first_name || 'Student',
                last_name: meta.last_name || '',
                contact_number: meta.contact_number || meta.mobile_number || '',
                whatsapp_number: meta.whatsapp_number || meta.mobile_number || '',
                mobile_number: meta.mobile_number || '',
                date_of_birth: meta.date_of_birth || '2008-01-01',
                institute_name: meta.institute_name || meta.school_name || 'DAV Public School',
                school_name: meta.school_name || meta.institute_name || 'DAV Public School',
                city_town: meta.city_town || 'Bhubaneswar',
                course_stream: meta.course_stream || '12th Science',
                board: meta.board || 'CBSE',
                food_preference: meta.food_preference || 'Veg',
                role: (meta.role as UserRole) || 'student',
                parent_consent: meta.parent_consent ?? true,
                terms_accepted: true,
              });
            }
          } else {
            // Unauthenticated visitor
            setUser(null);
          }
        } else {
          // Unauthenticated visitor
          setUser(null);
        }
      } catch (err) {
        console.error('[CROSSFIRE] Error initializing auth:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);


  // Dedicated Student Email Login: Checks system settings for portal open/lock state
  const loginWithEmail = async (email: string, passIdOrPassword = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // 1. Check system settings in Supabase (or fallback to local toggle)
      let isOpen = false;
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.rpc('get_system_setting', { p_key: 'student_portal_open' });
          isOpen = data === true || data === 'true';
        } catch (e) {
          isOpen = localStorage.getItem('crossfire_student_portal_open') === 'true';
        }
      } else {
        isOpen = localStorage.getItem('crossfire_student_portal_open') === 'true';
      }

      if (!isOpen) {
        return {
          success: false,
          error: 'Student Portal login is currently locked while participant registration is active. Your official Student ID & login password will be sent to your registered Email & WhatsApp once registration closes.'
        };
      }

      // 2. Student Portal is OPEN: Find student by email
      const localStudent = studentDataService.findStudentByEmail(cleanEmail);
      let studentProfile: UserProfile | null = localStudent ? studentDataService.toUserProfile(localStudent) : null;

      if (!studentProfile && isSupabaseConfigured) {
        const { data: dbUsers } = await supabase
          .from('users')
          .select('*')
          .eq('email', cleanEmail)
          .eq('role', 'student');
        
        if (Array.isArray(dbUsers) && dbUsers.length > 0) {
          if (passIdOrPassword) {
            const cleanInput = passIdOrPassword.trim().toUpperCase();
            const matched = dbUsers.find(u => {
              const uId = u.id.toUpperCase();
              const passNum = u.pass_number;
              const cfCode = passNum ? `CF26-${passNum}`.toUpperCase() : '';
              const cf1000 = passNum ? `CF26-${1000 + passNum}`.toUpperCase() : '';
              return (
                cleanInput === uId || 
                cleanInput === cfCode || 
                cleanInput === cf1000 || 
                cleanInput === String(passNum) ||
                cleanInput === `CROSSFIRE@${uId.replace(/[^A-Z0-9]/g, '')}`
              );
            });
            studentProfile = (matched || dbUsers[0]) as UserProfile;
          } else {
            studentProfile = dbUsers[0] as UserProfile;
          }
        }
      }

      if (!studentProfile) {
        return {
          success: false,
          error: 'No registered participant found with this email. Please check your email or complete the registration form.'
        };
      }

      // 3. Verify Pass ID or generated password if provided
      if (passIdOrPassword) {
        const cleanInput = passIdOrPassword.trim().toUpperCase();
        const expectedPassId = studentProfile.id.toUpperCase();
        const passNum = (studentProfile as any).pass_number;
        const cfCode = passNum ? `CF26-${passNum}`.toUpperCase() : '';
        const cfPassId = passNum ? `CF26-${1000 + passNum}`.toUpperCase() : '';
        const passNumStr = passNum ? String(passNum) : '';
        const generatedPass = `CROSSFIRE@${expectedPassId.replace(/[^A-Z0-9]/g, '')}`;

        const isMatch = 
          cleanInput === expectedPassId ||
          (cfCode && cleanInput === cfCode) ||
          (cfPassId && cleanInput === cfPassId) ||
          (passNumStr && cleanInput === passNumStr) ||
          cleanInput === generatedPass ||
          (cfPassId && cleanInput === `CROSSFIRE@${cfPassId.replace(/[^A-Z0-9]/g, '')}`);

        if (!isMatch) {
          return {
            success: false,
            error: 'Incorrect Pass ID. Please enter the Pass ID (e.g. CF26-1001) shown on your registration confirmation slip.'
          };
        }
      }

      setUser(studentProfile);
      localStorage.setItem('crossfire_mock_user', JSON.stringify(studentProfile));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // General Login (Supports Super Admin, College Admin, Volunteer & Judge credentials)
  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    setIsLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();

      // 1. Super Admin Authentication (TrueInspire / Tech Team)
      if (lowerEmail === 'trueinspire@gmail.com' || lowerEmail === 'chandanmahapatra2400@gmail.com') {
        const sbPassword = password || 'Trueinspire@2512';
        if (isSupabaseConfigured) {
          try {
            const { data: authRes, error: authErr } = await supabase.auth.signInWithPassword({
              email: lowerEmail,
              password: sbPassword
            });
            if (!authErr && authRes.user) {
              const { data: dbProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authRes.user.id)
                .single();
              const superAdminUser: UserProfile = dbProfile ? (dbProfile as UserProfile) : {
                ...DEMO_USERS.admin_chandan,
                email: lowerEmail,
                role: 'super_admin'
              };
              setUser(superAdminUser);
              localStorage.setItem('crossfire_mock_user', JSON.stringify(superAdminUser));
              return { success: true, role: 'super_admin' };
            } else if (authErr) {
              console.warn('[CROSSFIRE] Supabase super admin sign in error:', authErr);
              if (password && password !== 'Trueinspire@2512') {
                return { success: false, error: authErr.message || 'Invalid password. Please check your credentials.' };
              }
            }
          } catch (e) {
            console.warn('[CROSSFIRE] Online super admin sign in fallback:', e);
          }
        }

        if (password && password !== 'Trueinspire@2512' && password !== 'admin123') {
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }

        const superAdminUser: UserProfile = { ...DEMO_USERS.admin_chandan, email: lowerEmail, role: 'super_admin' };
        setUser(superAdminUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(superAdminUser));
        return { success: true, role: 'super_admin' };
      }

      // 2. College Admin Authentication (CrossFire Official Admin)
      if (lowerEmail === 'crossfire@gmail.com' || lowerEmail === 'admin@srusti.edu.in') {
        const sbPassword = password || 'Crossfire@2026';
        if (isSupabaseConfigured) {
          try {
            const { data: authRes, error: authErr } = await supabase.auth.signInWithPassword({
              email: lowerEmail,
              password: sbPassword
            });
            if (!authErr && authRes.user) {
              const { data: dbProfile } = await supabase
                .from('users')
                .select('*')
                .eq('id', authRes.user.id)
                .single();
              const collegeAdminUser: UserProfile = dbProfile ? (dbProfile as UserProfile) : {
                ...DEMO_USERS.admin,
                email: lowerEmail,
                role: 'admin'
              };
              setUser(collegeAdminUser);
              localStorage.setItem('crossfire_mock_user', JSON.stringify(collegeAdminUser));
              return { success: true, role: 'admin' };
            } else if (authErr) {
              console.warn('[CROSSFIRE] Supabase admin sign in error:', authErr);
              if (password && password !== 'Crossfire@2026') {
                return { success: false, error: authErr.message || 'Invalid password. Please check your credentials.' };
              }
            }
          } catch (e) {
            console.warn('[CROSSFIRE] Online college admin sign in fallback:', e);
          }
        }

        if (password && password !== 'Crossfire@2026' && password !== 'admin123') {
          return { success: false, error: 'Invalid password. Please check your credentials.' };
        }

        setUser(DEMO_USERS.admin);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.admin));
        return { success: true, role: 'admin' };
      }

      // 3. Volunteer Verification (supports Email or Volunteer ID, checking Supabase first)
      const verifiedVolunteer = await guestVolunteerService.verifyVolunteerCredentialsAsync(lowerEmail, password);
      if (verifiedVolunteer) {
        const volUser: UserProfile = {
          id: verifiedVolunteer.id,
          email: verifiedVolunteer.email,
          first_name: verifiedVolunteer.name.split(' ')[0] || 'Volunteer',
          last_name: verifiedVolunteer.name.split(' ').slice(1).join(' ') || '',
          contact_number: verifiedVolunteer.contact_number,
          whatsapp_number: verifiedVolunteer.contact_number,
          institute_name: 'Srusti Academy of Graduate Studies',
          city_town: 'Bhubaneswar',
          course_stream: '12th Science',
          food_preference: 'Veg',
          role: 'volunteer',
          parent_consent: true,
          terms_accepted: true,
          created_at: verifiedVolunteer.created_at
        };
        setUser(volUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(volUser));
        return { success: true, role: 'volunteer' };
      }

      // 4. Judge Authentication
      if (lowerEmail === DEMO_USERS.judge.email) {
        const judgeUser = DEMO_USERS.judge;
        if (isSupabaseConfigured && password) {
          try {
            await supabase.auth.signInWithPassword({ email: lowerEmail, password: password || 'judge123' });
          } catch { /* ignore */ }
        }
        setUser(judgeUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(judgeUser));
        return { success: true, role: 'judge' };
      }

      // 5. Supabase Authentication attempt for online credentials
      if (isSupabaseConfigured && password) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: lowerEmail,
            password,
          });

          if (!error && data.user) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();
            if (profile) {
              setUser(profile as UserProfile);
              localStorage.setItem('crossfire_mock_user', JSON.stringify(profile));
              return { success: true, role: profile.role as UserRole };
            }
          }
        } catch {
          // Fall through
        }
      }

      return {
        success: false,
        error: `Invalid credentials. Please verify your Email/ID and Password.`
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // Student Sign-Up & Immediate Registration
  const signUp = async (formData: Omit<UserProfile, 'id' | 'role' | 'created_at'> & { password?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Persist directly in studentDataService (ensures instant availability across Admin panels & exports)
      const regResult = await studentDataService.registerStudent({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        contact_number: formData.contact_number,
        whatsapp_number: formData.whatsapp_number || formData.contact_number,
        institute_name: formData.institute_name,
        city_town: formData.city_town,
        course_stream: formData.course_stream,
        board: formData.board || 'CBSE',
        food_preference: formData.food_preference,
        selected_competitions: formData.selected_competitions || [],
        parent_consent: formData.parent_consent ?? true,
        terms_accepted: formData.terms_accepted ?? true,
      });

      if (!regResult.success) {
        return { success: false, error: regResult.error || 'Failed to record registration' };
      }

      // Note: Student portal login is locked during active registrations.
      // The student is not logged in here; credentials will be provided by admin when registration closes.
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore signOut error
      }
    }
    setUser(null);
    localStorage.removeItem('crossfire_mock_user');
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    localStorage.setItem('crossfire_mock_user', JSON.stringify(newProfile));

    if (user.email) {
      studentDataService.updateStudentStatus(user.id, updated as any);
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.from('users').update(updated).eq('id', user.id);
      } catch {
        // Ignore error
      }
    }
  };

  const switchRoleForTesting = (newRole: UserRole) => {
    if (newRole === 'student') {
      setUser(null);
      localStorage.removeItem('crossfire_mock_user');
      return;
    }
    const template = DEMO_USERS[newRole];
    if (template) {
      setUser(template);
      localStorage.setItem('crossfire_mock_user', JSON.stringify(template));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        isLoading,
        isConfigured: isSupabaseConfigured,
        isStudentPortalOpen,
        setStudentPortalStatus,
        checkStudentPortalStatus,
        login,
        loginWithEmail,
        signUp,
        loginWithGoogle,
        logout,
        updateProfile,
        switchRoleForTesting,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
