import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
}) => {
  const { login, loginWithEmail } = useAuth();
  const [loginMethod, setLoginMethod] = useState<'student_email' | 'staff_password'>('student_email');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (loginMethod === 'student_email') {
        // Student Email-Only Login
        const cleanEmail = email.trim();
        if (!cleanEmail) {
          setErrorMessage('Please enter your registered email address.');
          setIsSubmitting(false);
          return;
        }

        const res = await loginWithEmail(cleanEmail);
        if (res.success) {
          setSuccessMessage('Welcome back! Opening your student portal...');
          setTimeout(() => {
            onClose();
            window.location.hash = 'dashboard';
          }, 600);
        } else {
          setErrorMessage(res.error || 'Student registration not found. Please register first.');
        }
      } else {
        // Staff / Admin Password Login
        const cleanEmail = email.trim();
        const res = await login(cleanEmail, password);
        if (res.success) {
          setSuccessMessage('Authentication successful!');
          setTimeout(() => {
            onClose();
            const lower = cleanEmail.toLowerCase();
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
          setErrorMessage(res.error || 'Invalid staff credentials');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigateToRegister = () => {
    onClose();
    window.location.hash = 'register';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200">
        
        {/* Header banner */}
        <div className="bg-navy text-white px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <img src="/Logo.png" alt="CrossFire Logo" className="w-10 h-10 object-contain bg-white rounded-full p-0.5" />
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                CrossFire 2026 Portal Login
              </h3>
              <p className="text-[11px] text-gray-300">
                Srusti Academy of Graduate Studies • State-Level Talent Hunt
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          {/* Method Toggle: Student Email vs Staff Password */}
          <div className="flex p-1 bg-gray-100 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => { setLoginMethod('student_email'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === 'student_email'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-orange-500" />
              <span>Student Login (Email)</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginMethod('staff_password'); setErrorMessage(null); setSuccessMessage(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                loginMethod === 'staff_password'
                  ? 'bg-white text-navy shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Staff & Admin</span>
            </button>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <span>{errorMessage}</span>
                {errorMessage.toLowerCase().includes('not found') && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={handleNavigateToRegister}
                      className="text-xs text-orange-600 font-bold underline hover:text-orange-700 inline-flex items-center gap-1"
                    >
                      Complete Free Registration ➔
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'student_email' ? (
              /* Student Email Login */
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
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1.5 leading-normal">
                    Enter the email address you used when registering on the portal to access your student dashboard & pass.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
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
              </div>
            ) : (
              /* Staff & Admin Password Login */
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
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
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
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-navy hover:bg-navy-light disabled:opacity-60 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Sign In to Staff Panel</span>
                  )}
                </button>
              </div>
            )}
          </form>

          {/* Registration Link Footer */}
          <div className="mt-5 pt-4 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-500">
              Haven't registered for CrossFire 2026 yet?{' '}
              <button
                type="button"
                onClick={handleNavigateToRegister}
                className="font-bold text-orange-600 hover:text-orange-700 underline transition-colors"
              >
                Complete Free Registration
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
