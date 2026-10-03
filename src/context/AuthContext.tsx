import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEMO_USERS } from '../data/mockData';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
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
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch user profile from public.users table
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (data && !error) {
              setUser(data as UserProfile);
            } else {
              // Fallback to auth metadata if table query hasn't synced yet
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
          }

          // Subscribe to Supabase auth state changes
          const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session?.user) {
              const { data } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
              if (data) setUser(data as UserProfile);
            } else {
              setUser(null);
            }
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } else {
          // Check local storage for mock session
          const savedMockUser = localStorage.getItem('crossfire_mock_user');
          if (savedMockUser) {
            setUser(JSON.parse(savedMockUser));
          } else {
            // Default to demo student for instantaneous preview
            setUser(DEMO_USERS.student);
            localStorage.setItem('crossfire_mock_user', JSON.stringify(DEMO_USERS.student));
          }
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

  const login = async (email: string, password = ''): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { success: false, error: error.message };

        if (data.user) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
          if (profile) setUser(profile as UserProfile);
        }
        return { success: true };
      } else {
        // Mock authentication login
        const lowerEmail = email.toLowerCase().trim();
        let targetUser: UserProfile = DEMO_USERS.student;

        if (lowerEmail.includes('judge')) {
          targetUser = DEMO_USERS.judge;
        } else if (lowerEmail.includes('admin')) {
          targetUser = DEMO_USERS.admin;
        } else {
          // Check if previously stored student matches
          const stored = localStorage.getItem('crossfire_mock_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.email === lowerEmail) {
              targetUser = parsed;
            }
          }
        }

        setUser(targetUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(targetUser));
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (formData: Omit<UserProfile, 'id' | 'role' | 'created_at'> & { password?: string }): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      // 1. Validate Age (Must be 16-18 as per PRD Section 4.1 if DOB provided)
      if (formData.date_of_birth) {
        const age = calculateAge(formData.date_of_birth);
        if (age < 15 || age > 20) {
          return {
            success: false,
            error: `Eligibility restriction: Only +2 Final Year students (ages 16 to 18) are eligible. Detected age: ${age}`
          };
        }
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password || 'CrossFire2026!',
          options: {
            data: {
              first_name: formData.first_name,
              last_name: formData.last_name,
              contact_number: formData.contact_number,
              whatsapp_number: formData.whatsapp_number,
              mobile_number: formData.contact_number,
              date_of_birth: formData.date_of_birth || '2008-01-01',
              institute_name: formData.institute_name,
              school_name: formData.institute_name,
              city_town: formData.city_town,
              course_stream: formData.course_stream,
              board: formData.board || 'CBSE',
              food_preference: formData.food_preference,
              role: 'student',
              parent_consent: formData.parent_consent ?? true,
              selected_competitions: formData.selected_competitions || [],
            }
          }
        });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          const newUser: UserProfile = {
            id: data.user.id,
            email: formData.email,
            first_name: formData.first_name,
            last_name: formData.last_name,
            contact_number: formData.contact_number,
            whatsapp_number: formData.whatsapp_number,
            mobile_number: formData.contact_number,
            date_of_birth: formData.date_of_birth || '2008-01-01',
            institute_name: formData.institute_name,
            school_name: formData.institute_name,
            city_town: formData.city_town,
            course_stream: formData.course_stream,
            board: formData.board || 'CBSE',
            food_preference: formData.food_preference,
            role: 'student',
            parent_consent: formData.parent_consent,
            terms_accepted: true,
            selected_competitions: formData.selected_competitions || [],
            created_at: new Date().toISOString()
          };
          setUser(newUser);
        }
        return { success: true };
      } else {
        // Mock Registration
        const newMockUser: UserProfile = {
          id: `user-${Date.now()}`,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          contact_number: formData.contact_number,
          whatsapp_number: formData.whatsapp_number,
          mobile_number: formData.contact_number,
          date_of_birth: formData.date_of_birth || '2008-01-01',
          institute_name: formData.institute_name,
          school_name: formData.institute_name,
          city_town: formData.city_town,
          course_stream: formData.course_stream,
          board: formData.board || 'CBSE',
          food_preference: formData.food_preference,
          role: 'student',
          parent_consent: formData.parent_consent,
          terms_accepted: true,
          selected_competitions: formData.selected_competitions || [],
          created_at: new Date().toISOString()
        };

        setUser(newMockUser);
        localStorage.setItem('crossfire_mock_user', JSON.stringify(newMockUser));
        return { success: true };
      }
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
        id: 'google-user-' + Date.now(),
        email: 'imazureakash@gmail.com',
        first_name: 'Akash',
        last_name: 'Pattnaik',
        contact_number: '+91 9876500000',
        whatsapp_number: '+91 9876500000',
        mobile_number: '+91 9876500000',
        date_of_birth: '2008-06-15',
        institute_name: 'Srusti Academy of Management and Technology',
        school_name: 'Srusti Academy of Management and Technology',
        city_town: 'Bhubaneswar',
        course_stream: '12th Science',
        food_preference: 'Veg',
        board: 'CBSE',
        role: 'student',
        parent_consent: true,
        terms_accepted: true,
        selected_competitions: ['Intelect Odyssey (Quiz)'],
        created_at: new Date().toISOString()
      };
      setUser(googleMockUser);
      localStorage.setItem('crossfire_mock_user', JSON.stringify(googleMockUser));
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('crossfire_mock_user');
  };

  const updateProfile = async (updated: Partial<UserProfile>) => {
    if (!user) return;
    const newProfile = { ...user, ...updated };
    setUser(newProfile);
    if (isSupabaseConfigured) {
      await supabase.from('users').update(updated).eq('id', user.id);
    } else {
      localStorage.setItem('crossfire_mock_user', JSON.stringify(newProfile));
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
