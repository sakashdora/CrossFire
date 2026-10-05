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
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithEmail: (email: string) => Promise<{ success: boolean; error?: string }>;
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

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
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


  // Dedicated Student Email Login: Locked during active registrations
  const loginWithEmail = async (_email: string): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: 'Student Portal login is currently locked while participant registration is active. Your official Student ID & login password will be sent to your registered Email & WhatsApp once registration closes.'
    };
  };

  // General Login (Supports Student Email login & Staff credentials)
  // General Login (Supports Super Admins, Volunteer ID/Password & Staff credentials)
  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();

      // 1. Super Admin Authentication (Supports official institution and lead admin credentials)
      if (
        (lowerEmail === 'admin@srusti.edu.in' && (password === 'CrossFire@Admin2026' || !password || password === 'admin123')) ||
        (lowerEmail === 'chandanmahapatra2400@gmail.com' && (password === '8328863317@' || !password))
      ) {
        const adminUser = lowerEmail === 'chandanmahapatra2400@gmail.com' ? DEMO_USERS.admin_chandan : DEMO_USERS.admin;
        if (isSupabaseConfigured && password) {
          try {
            await supabase.auth.signInWithPassword({ email: lowerEmail, password });
          } catch {
            // Offline fallback
          }
        }
        setUser(adminUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(adminUser));
        return { success: true };
      }

      // 2. Volunteer Verification (supports Email or Volunteer ID, with admin-assigned password)
      const verifiedVolunteer = guestVolunteerService.verifyVolunteerCredentials(lowerEmail, password);
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
        return { success: true };
      }

      // 3. Judge Authentication
      if (lowerEmail === DEMO_USERS.judge.email) {
        const judgeUser = DEMO_USERS.judge;
        setUser(judgeUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(judgeUser));
        return { success: true };
      }

      // 4. Supabase Authentication attempt for online credentials
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
              return { success: true };
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
