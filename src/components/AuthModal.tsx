import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, GraduationCap, LockKeyhole, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const backupForm = 'https://docs.google.com/forms/d/e/1FAIpQLSfIPctLilosmqJukeZze--Z9MKpcazZ3zJRq1pstA59bcfWzA/viewform';
export const AuthModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { login, isStudentPortalOpen } = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [staff, setStaff] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (isOpen) { dialog.current?.showModal(); setStaff(false); setPassword(''); setError(''); } }, [isOpen]);
  if (!isOpen) return null;
  const register = () => { onClose(); window.location.hash = 'register'; };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setBusy(true); setError('');
    try {
      const result = await login(email, password, staff ? 'staff' : 'student');
      if (!result.success) { setError(result.error || 'Unable to sign in.'); return; }
      setPassword(''); onClose();
      window.location.hash = result.role === 'judge' ? 'judge' : result.role === 'volunteer' ? 'volunteer' : ['admin', 'super_admin'].includes(result.role || '') ? 'admin' : 'dashboard';
    } catch { setError('Unable to sign in. Check your connection and try again.'); }
    finally { setBusy(false); }
  };
  const field = 'w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-orange-400';
  return <dialog ref={dialog} aria-labelledby="signin-title" onCancel={onClose} className="p-0 w-[calc(100%_-_32px)] max-w-[560px] max-h-[90dvh] overflow-y-auto rounded-2xl bg-white text-slate-900 backdrop:bg-slate-950/75">
    <header className="bg-navy text-white p-5 sm:p-7 flex items-start gap-3 justify-between">
      <div><p className="text-xs font-black tracking-[0.2em] text-orange-400 mb-2">CROSSFIRE</p><h2 id="signin-title" className="text-xl sm:text-2xl font-black text-white">CrossFire 2026 Portal Login</h2><p className="text-xs text-slate-300 mt-2">Srusti Academy of Graduate Studies · State-Level Talent Hunt</p></div>
      <button onClick={onClose} aria-label="Close sign in" className="p-1 shrink-0"><X size={22}/></button>
    </header>
    <div className="p-5 sm:p-7">
      <div role="tablist" aria-label="Portal login type" className="grid grid-cols-2 gap-2 mb-6">{[false, true].map(value => <button role="tab" aria-selected={staff === value} type="button" key={String(value)} disabled={busy} onClick={() => { setStaff(value); setPassword(''); setError(''); }} className={'rounded-xl px-2 py-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 ' + (staff === value ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600')}>
        {value ? <ShieldCheck size={18}/> : <GraduationCap size={18}/>} {value ? 'Staff & Admin' : 'Student Login (Email)'}
      </button>)}</div>
      {!staff && !isStudentPortalOpen ? <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center">
        <LockKeyhole className="mx-auto text-orange-600 mb-3" size={30}/>
        <h3 className="font-black text-navy text-base">Registration is Active · Portal Login Closed</h3>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">Participant registration for +2 students is open. Student portal access remains closed until the CrossFire Administration opens it.</p>
        <p className="text-sm text-slate-600 mt-3 leading-relaxed">After reviewing registrations, the college will send approved students their Student ID and a secure link to set a password through the configured official email sender. Keep your registered email and WhatsApp details accurate for college updates.</p>
        <button type="button" onClick={register} className="mt-5 w-full bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold py-3 px-3 inline-flex items-center justify-center gap-2">Register Free for Competitions Now <ArrowRight size={18}/></button>
      </section> : <>
        <p className="text-sm text-slate-600 mb-5">{staff ? 'Use your staff credentials, then verify with your authenticator.' : 'Use the email on your approved registration and the password you set from your official invitation.'}</p>
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-semibold">Email<input className={field + ' mt-1'} type="email" autoComplete="email" required maxLength={254} value={email} onChange={event=>setEmail(event.target.value)}/></label>
          <label className="block text-sm font-semibold">Password<input className={field + ' mt-1'} type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={event=>setPassword(event.target.value)}/></label>
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}
          <button disabled={busy} className="w-full bg-orange-500 text-white rounded-xl font-bold py-3 disabled:opacity-50">{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <p className="mt-4 text-xs text-slate-600">Lost your password? Contact the college administrator for account recovery.</p>
      </>}
      <div className="mt-6 pt-5 border-t text-center text-xs text-slate-600 space-y-3">
        <p>Haven’t registered for CrossFire 2026 yet? <button type="button" className="text-orange-600 font-bold" onClick={register}>Complete Free Registration</button></p>
        <p>Facing problems with online registration? <a href={backupForm} target="_blank" rel="noopener noreferrer" className="font-bold text-navy inline-flex items-center gap-1">Use Official Google Form Backup <ExternalLink size={12}/></a></p>
      </div>
    </div>
  </dialog>;
};
