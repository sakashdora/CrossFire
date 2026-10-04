import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_USERS } from '../data/mockData';
import { studentDataService } from '../services/studentDataService';

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
            // Default demo student if no session exists yet
            setUser(DEMO_USERS.student);
            localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.student));
          }
        } else {
          // Default to demo student for instantaneous preview
          setUser(DEMO_USERS.student);
          localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.student));
        }
      } catch (err) {
        console.error('[CROSSFIRE] Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Dedicated Student Email Login: Allows registered students to log in directly via their email
  const loginWithEmail = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return { success: false, error: 'Please enter a valid email address.' };
      }

      // Check student registry
      const student = studentDataService.findStudentByEmail(cleanEmail);
      if (student) {
        const userProfile = studentDataService.toUserProfile(student);
        setUser(userProfile);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(userProfile));
        return { success: true };
      }

      // Check demo student accounts
      if (cleanEmail === DEMO_USERS.student.email.toLowerCase()) {
        setUser(DEMO_USERS.student);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.student));
        return { success: true };
      }

      return {
        success: false,
        error: `No student registration found for "${email}". Please complete the registration form first.`
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Email authentication failed' };
    } finally {
      setIsLoading(false);
    }
  };

  // General Login (Supports Student Email login & Staff credentials)
  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const lowerEmail = email.toLowerCase().trim();

      // 1. Staff / Role-based Authentication
      if (lowerEmail.includes('admin')) {
        setUser(DEMO_USERS.admin);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.admin));
        return { success: true };
      }
      if (lowerEmail.includes('judge')) {
        setUser(DEMO_USERS.judge);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.judge));
        return { success: true };
      }
      if (lowerEmail.includes('volunteer')) {
        setUser(DEMO_USERS.volunteer);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.volunteer));
        return { success: true };
      }

      // 2. Check student registry by email
      const registeredStudent = studentDataService.findStudentByEmail(lowerEmail);
      if (registeredStudent) {
        const profile = studentDataService.toUserProfile(registeredStudent);
        setUser(profile);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(profile));
        return { success: true };
      }

      // 3. If password was provided and Supabase is configured, attempt Supabase authentication
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
          // Ignore and continue to fallback checks
        }
      }

      // 4. Check Demo student
      if (lowerEmail === DEMO_USERS.student.email.toLowerCase()) {
        setUser(DEMO_USERS.student);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.student));
        return { success: true };
      }

      return {
        success: false,
        error: `Account with email "${email}" was not found. Please register as a participant.`
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
      // 1. Age validation if provided
      if (formData.date_of_birth) {
        const age = calculateAge(formData.date_of_birth);
        if (age < 15 || age > 20) {
          return {
            success: false,
            error: `Eligibility restriction: Only +2 Final Year students (ages 16 to 18) are eligible. Detected age: ${age}`
          };
        }
      }

      // 2. Persist directly in studentDataService (ensures instant availability across Admin & Student panels)
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

      const activeProfile = studentDataService.toUserProfile(regResult.student);
      setUser(activeProfile);
      localStorage.setItem('crossfire_mock_user', JSON.stringify(activeProfile));

      // 3. Attempt Supabase Auth & RPC sync in background
      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signUp({
            email: formData.email,
            password: formData.password || 'CrossFire2026!',
            options: {
              data: {
                first_name: formData.first_name,
                last_name: formData.last_name,
                contact_number: formData.contact_number,
                whatsapp_number: formData.whatsapp_number,
                mobile_number: formData.contact_number,
                institute_name: formData.institute_name,
                city_town: formData.city_town,
                course_stream: formData.course_stream,
                board: formData.board || 'CBSE',
                food_preference: formData.food_preference,
                role: 'student',
                selected_competitions: formData.selected_competitions || [],
              }
            }
          });
        } catch (supabaseErr) {
          console.warn('[CROSSFIRE] Supabase auth registration notice:', supabaseErr);
        }
      }

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
    } else {
      // Mock Google sign in
      const googleMockUser: UserProfile = {
        id: 'CF26-GOOGLE-01',
        email: 'imazureakash@gmail.com',
        first_name: 'Akash',
        last_name: 'Pattnaik',
        contact_number: '+91 9876543210',
        whatsapp_number: '+91 9876543210',
        mobile_number: '+91 9876543210',
        date_of_birth: '2008-06-15',
        institute_name: 'DAV Public School, Chandrasekharpur',
        school_name: 'DAV Public School, Chandrasekharpur',
        city_town: 'Bhubaneswar',
        course_stream: '12th Science',
        food_preference: 'Veg',
        board: 'CBSE',
        role: 'student',
        parent_consent: true,
        terms_accepted: true,
        selected_competitions: ['Quiz', 'Ramp Walk'],
        created_at: new Date().toISOString()
      };
      setUser(googleMockUser);
      localStorage.setItem('crossfire_mock_user', JSON.stringify(googleMockUser));
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
    const template = DEMO_USERS[newRole] || {
      ...DEMO_USERS.student,
      role: newRole,
      first_name: newRole.toUpperCase(),
      email: `${newRole}@crossfire.org`
    };
    setUser(template);
    localStorage.setItem('crossfire_mock_user', JSON.stringify(template));
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
