import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolBoard } from '../types';
import { 
  X, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, loginWithEmail, signUp, loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'student_email' | 'staff_password'>('student_email');
  
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [dob] = useState('2008-05-15');
  const [schoolName, setSchoolName] = useState('');
  const [board] = useState<SchoolBoard>('CBSE');
  const [termsAccepted] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (loginMethod === 'student_email') {
          // Student Email-Only Login
          if (!email.trim()) {
            setErrorMessage('Please enter your registered email address.');
            setIsSubmitting(false);
            return;
          }

          const res = await loginWithEmail(email.trim());
          if (res.success) {
            setSuccessMessage('Welcome back! Loading your student portal...');
            setTimeout(() => {
              onClose();
              window.location.hash = 'dashboard';
            }, 600);
          } else {
            setErrorMessage(res.error || 'Student account not found.');
          }
        } else {
          // Staff / Password Login
          const res = await login(email.trim(), password);
          if (res.success) {
            setSuccessMessage('Authentication successful!');
            setTimeout(() => {
              onClose();
              const lower = email.toLowerCase();
              if (lower.includes('admin')) {
                window.location.hash = 'admin';
              } else if (lower.includes('judge')) {
                window.location.hash = 'judge';
              } else if (lower.includes('volunteer')) {
                window.location.hash = 'volunteer';
              } else {
                window.location.hash = 'dashboard';
              }
            }, 600);
          } else {
            setErrorMessage(res.error || 'Invalid credentials');
          }
        }
      } else {
        // Quick Registration
        if (!termsAccepted) {
          setErrorMessage('You must accept the terms and conditions to proceed.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp({
          email: email.trim(),
          password: password || 'CrossFire2026!',
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          contact_number: mobileNumber.trim(),
          whatsapp_number: mobileNumber.trim(),
          mobile_number: mobileNumber.trim(),
          date_of_birth: dob,
          institute_name: schoolName.trim() || 'DAV Public School',
          school_name: schoolName.trim() || 'DAV Public School',
          city_town: 'Bhubaneswar',
          course_stream: '12th Science',
          food_preference: 'Veg',
          board,
          parent_consent: true,
          terms_accepted: true,
          selected_competitions: ['Quiz'],
        });

        if (res.success) {
          setSuccessMessage('Registration successful! Redirecting to your dashboard...');
          setTimeout(() => {
            onClose();
            window.location.hash = 'dashboard';
          }, 800);
        } else {
          setErrorMessage(res.error || 'Failed to complete registration.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset loader for staff test accounts
  const fillQuickTestAccount = (testRole: 'judge' | 'admin' | 'volunteer') => {
    if (testRole === 'judge') {
      setEmail('judge@crossfire.org');
      setPassword('JudgePass123!');
      setLoginMethod('staff_password');
    } else if (testRole === 'volunteer') {
      setEmail('volunteer@crossfire.org');
      setPassword('VolPass123!');
      setLoginMethod('staff_password');
    } else {
      setEmail('admin@crossfire.org');
      setPassword('AdminPass123!');
      setLoginMethod('staff_password');
    }
    setMode('login');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[92vh] overflow-y-auto border border-gray-200">
        
        {/* Header banner */}
        <div className="bg-navy text-white px-6 py-5 rounded-t-3xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Logo" className="w-10 h-10 object-contain bg-white rounded-full p-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {mode === 'login' ? 'CrossFire 2026 Portal Login' : 'Join CrossFire 2026'}
              </h3>
              <p className="text-[11px] text-gray-300">
                Srusti Academy of Graduate Studies • State-Level Talent Hunt
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Mode Switcher: Login vs Register */}
          <div className="flex border-b border-gray-200 mb-5">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(null); }}
              className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                mode === 'login'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(null); }}
              className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all ${
                mode === 'register'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Quick Register
            </button>
          </div>

          {/* If mode is Login, offer Student Email vs Staff Password toggle */}
          {mode === 'login' && (
            <div className="flex p-1 bg-gray-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => { setLoginMethod('student_email'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'student_email'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-orange-500" />
                <span>Student Login (Email)</span>
              </button>

              <button
                type="button"
                onClick={() => { setLoginMethod('staff_password'); setErrorMessage(null); }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMethod === 'staff_password'
                    ? 'bg-white text-navy shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Staff & Admin</span>
              </button>
            </div>
          )}

          {/* Quick Test Demo Helpers */}
          <div className="mb-4 bg-navy-50/70 border border-navy-100 rounded-2xl p-2.5">
            <p className="text-[10px] font-bold text-navy-800 uppercase tracking-wider mb-1.5">
              Staff 1-Click Credentials:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => fillQuickTestAccount('admin')}
                className="text-[10px] py-1 px-1.5 rounded-lg bg-white hover:bg-blue-50 text-navy font-bold border border-navy-200 text-center hover:border-blue-400 transition-colors truncate"
              >
                🛡️ Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickTestAccount('judge')}
                className="text-[10px] py-1 px-1.5 rounded-lg bg-white hover:bg-purple-50 text-navy font-bold border border-navy-200 text-center hover:border-purple-400 transition-colors truncate"
              >
                ⚖️ Judge
              </button>
              <button
                type="button"
                onClick={() => fillQuickTestAccount('volunteer')}
                className="text-[10px] py-1 px-1.5 rounded-lg bg-white hover:bg-emerald-50 text-navy font-bold border border-navy-200 text-center hover:border-emerald-400 transition-colors truncate"
              >
                🤝 Volunteer
              </button>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                {errorMessage.includes('not found') && (
                  <div className="mt-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.hash = 'register';
                      }}
                      className="text-xs text-orange-600 font-bold underline hover:text-orange-700 flex items-center gap-1"
                    >
                      Register Now for Free <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'login' ? (
              <>
                {loginMethod === 'student_email' ? (
                  /* Student Email Only Login */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                        Registered Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. yourname@gmail.com"
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                        Enter the email address you used during CrossFire registration to access your student pass and live events.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <span>Access Student Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-2">
                      <p className="text-[11px] text-gray-500">
                        Haven't registered yet?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            window.location.hash = 'register';
                          }}
                          className="font-bold text-orange-600 hover:underline"
                        >
                          Complete Free Registration
                        </button>
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Staff & Admin Login with Password */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                        Staff / Admin Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@crossfire.org"
                          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 bg-navy hover:bg-navy-light text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span>Sign In to Staff Panel</span>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Quick Register Mode */
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. Akash"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Pattnaik"
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-700 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-700 mb-1">Institute / School Name *</label>
                  <input
                    type="text"
                    required
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g. DAV Public School"
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Register & Access Dashboard</span>
                  )}
                </button>

                <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-[11px] text-orange-900 text-center">
                  <span>Want to choose your specific tracks & dietary preference? </span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.hash = 'register';
                    }}
                    className="font-bold underline hover:text-orange-950 block mt-1 mx-auto"
                  >
                    Open Official Comprehensive Form ➔
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Google OAuth Button */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 shadow-sm transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
