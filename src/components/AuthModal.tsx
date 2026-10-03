import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { SchoolBoard } from '../types';
import { X, CheckCircle, AlertCircle, Eye, EyeOff, Lock, Mail, Phone, Calendar, School, User as UserIcon } from 'lucide-react';

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
  const { login, signUp, loginWithGoogle, isConfigured } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
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
  const [dob, setDob] = useState('2008-05-15'); // Defaults to age 18 in 2026
  const [schoolName, setSchoolName] = useState('');
  const [board, setBoard] = useState<SchoolBoard>('CBSE');
  const [parentConsent, setParentConsent] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);

  if (!isOpen) return null;

  // Password strength check
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'Empty', color: 'bg-gray-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, text: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score: 2, text: 'Medium', color: 'bg-amber-500' };
    return { score: 3, text: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMessage('Successfully authenticated!');
          setTimeout(() => {
            onClose();
          }, 600);
        } else {
          setErrorMessage(res.error || 'Invalid credentials');
        }
      } else {
        // Validation check
        if (!termsAccepted) {
          setErrorMessage('You must accept the terms and conditions.');
          setIsSubmitting(false);
          return;
        }

        const res = await signUp({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          contact_number: mobileNumber,
          whatsapp_number: mobileNumber,
          mobile_number: mobileNumber,
          date_of_birth: dob,
          institute_name: schoolName,
          school_name: schoolName,
          city_town: 'Bhubaneswar',
          course_stream: '12th Science',
          food_preference: 'Veg',
          board,
          parent_consent: parentConsent,
          terms_accepted: termsAccepted,
          selected_competitions: [],
        });

        if (res.success) {
          setSuccessMessage('Account registered successfully! Welcome to CrossFire 2026.');
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setErrorMessage(res.error || 'Failed to complete registration');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset loader for test accounts
  const fillQuickTestAccount = (testRole: 'student' | 'judge' | 'admin') => {
    if (testRole === 'student') {
      setEmail('student@srusti.edu.in');
      setPassword('Crossfire2026!');
    } else if (testRole === 'judge') {
      setEmail('judge@crossfire.org');
      setPassword('JudgePass123!');
    } else {
      setEmail('admin@crossfire.org');
      setPassword('AdminPass123!');
    }
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto border border-gray-200">
        
        {/* Header banner */}
        <div className="bg-navy text-white px-6 py-5 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="Logo" className="w-9 h-9 object-contain bg-white rounded-full p-0.5" />
            <div>
              <h3 className="text-lg font-bold text-white">
                {mode === 'login' ? 'Welcome to CrossFire 2026' : 'Join CrossFire 2026'}
              </h3>
              <p className="text-xs text-gray-300">
                {mode === 'login' ? 'Sign in with your Supabase credentials' : 'State-level registration for +2 final year students'}
              </p>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-6">

          {/* Quick Test Demo Helpers */}
          <div className="mb-5 bg-navy-50 border border-navy-100 rounded-xl p-3">
            <p className="text-[11px] font-bold text-navy-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Quick Test Credentials ({isConfigured ? 'Supabase Live' : 'Demo Mode'}):</span>
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickTestAccount('student')}
                className="text-[11px] py-1 px-2 rounded bg-white hover:bg-orange-50 text-navy font-semibold border border-navy-200 text-center hover:border-orange-400 transition-colors"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => fillQuickTestAccount('judge')}
                className="text-[11px] py-1 px-2 rounded bg-white hover:bg-purple-50 text-navy font-semibold border border-navy-200 text-center hover:border-purple-400 transition-colors"
              >
                ⚖️ Judge
              </button>
              <button
                type="button"
                onClick={() => fillQuickTestAccount('admin')}
                className="text-[11px] py-1 px-2 rounded bg-white hover:bg-blue-50 text-navy font-semibold border border-navy-200 text-center hover:border-blue-400 transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 shadow-sm transition-all mb-4"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative flex py-2 items-center mb-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-3 text-gray-400 text-xs uppercase tracking-wider font-semibold">Or with Email</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      First Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Mobile Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                      Date of Birth (16-18) *
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    School / College Name (+2 Institution) *
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g. DAV Public School, Unit 8"
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                    Council / Education Board *
                  </label>
                  <select
                    value={board}
                    onChange={(e) => setBoard(e.target.value as SchoolBoard)}
                    className="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy bg-white"
                  >
                    <option value="CBSE">CBSE (Central Board of Secondary Education)</option>
                    <option value="ICSE">ICSE / ISC (Council for Indian School Certificate)</option>
                    <option value="CHSE">CHSE (Council of Higher Secondary Education, Odisha)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@srusti.edu.in"
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase text-gray-700">
                  Password *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => alert('Password reset link will be dispatched via Supabase Auth email service.')}
                    className="text-[11px] text-orange-600 hover:underline font-semibold"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'register' && password && (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-grow h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full ${strength.color}`}
                      style={{ width: `${(strength.score / 3) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">{strength.text}</span>
                </div>
              )}
            </div>

            {mode === 'register' && (
              <div className="space-y-2 pt-1 text-xs text-gray-600">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={parentConsent}
                    onChange={(e) => setParentConsent(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>I confirm I am in +2 Final Year and have parental consent to take part in CrossFire 2026.</span>
                </label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span>I accept the Srusti Campus Code of Conduct and event guidelines.</span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg hover:shadow-orange-500/25 transition-all text-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : mode === 'login' ? (
                'Sign In to Dashboard'
              ) : (
                'Complete Registration'
              )}
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="mt-5 text-center text-xs text-gray-600">
            {mode === 'login' ? (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setErrorMessage(null); }}
                  className="text-orange-600 font-bold hover:underline"
                >
                  Register here (2 mins)
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMessage(null); }}
                  className="text-orange-600 font-bold hover:underline"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
