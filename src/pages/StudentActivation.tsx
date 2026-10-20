import { useEffect, useRef, useState, type FormEvent } from 'react';
import { LockKeyhole } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function StudentActivation() {
  const { refreshAuth, logout } = useAuth();
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] || '').get('token_hash') || '');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  useEffect(() => {
    const capture = () => {
      if (window.location.hash.split('?')[0] !== '#activate') return;
      const next = new URLSearchParams(window.location.hash.split('?')[1] || '').get('token_hash');
      if (next) { setToken(next); setReady(false); setDone(false); setError(''); }
      window.history.replaceState(null, '', window.location.pathname + window.location.search + '#activate');
    };
    capture();
    window.addEventListener('hashchange', capture);
    return () => window.removeEventListener('hashchange', capture);
  }, []);
  const verify = async () => {
    if (saving.current) return;
    saving.current = true; setBusy(true); setError('');
    try {
      // Explicit interaction avoids consuming one-time links in email scanners.
      await logout();
      const { data, error: failure } = await supabase.auth.verifyOtp({ token_hash: token, type: 'magiclink' });
      if (failure || !data.user) throw new Error('This setup link is invalid, expired or already used. Ask the college for a new setup link.');
      const { data: profile, error: access } = await supabase.rpc('crossfire_current_profile');
      if (access || profile?.role !== 'student' || !profile?.active) { await logout(); throw new Error('This student account is unavailable. Contact the college organisers.'); }
      setEmail(data.user.email || ''); setReady(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'The setup link could not be verified. Try again.'); }
    finally { saving.current = false; setBusy(false); }
  };
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (saving.current) return;
    if (password.length < 12 || password.length > 200 || password !== confirm) { setError('Use 12–200 characters and enter the same password twice.'); return; }
    saving.current = true; setBusy(true); setError('');
    try {
      const { error: failure } = await supabase.auth.updateUser({ password });
      if (failure) throw failure;
      setPassword(''); setConfirm(''); setDone(true); await refreshAuth();
    } catch { setError('Your password could not be saved. Check your connection and the password requirements, then retry. If this session has expired, request a new setup link.'); }
    finally { saving.current = false; setBusy(false); }
  };
  return <section className="max-w-lg mx-auto my-10 px-4">
    <div className="rounded-2xl border bg-white p-6 sm:p-8 shadow-sm">
      <LockKeyhole className="text-orange-500 mb-4" size={30}/>
      <p className="text-xs font-bold text-orange-600 tracking-widest">CROSSFIRE 2026</p>
      <h1 className="text-2xl text-navy font-black mt-2">{done ? 'Your password is ready' : 'Set your student password'}</h1>
      {error && <p role="alert" className="mt-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">{error}</p>}
      {done ? <><p className="my-4 text-slate-600">Use your registered email and this password for Student Login. Your Pass ID is for event entry.</p><button className="w-full p-3 bg-navy text-white rounded-xl font-bold" onClick={()=>window.location.hash='dashboard'}>Open student portal</button></> :
        ready ? <form onSubmit={save} className="space-y-4 mt-5"><p className="text-sm text-slate-600 break-all">{email}</p>
          <label className="block text-sm font-bold">New password<input className="block border rounded-xl p-3 w-full mt-1" type="password" autoComplete="new-password" minLength={12} maxLength={200} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/></label>
          <label className="block text-sm font-bold">Confirm password<input className="block border rounded-xl p-3 w-full mt-1" type="password" autoComplete="new-password" minLength={12} maxLength={200} required value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>
          <p className="text-xs text-slate-500">Use a unique password with at least 12 characters.</p><button className="w-full p-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50" disabled={busy}>{busy?'Saving…':'Save password'}</button>
        </form> : <><p className="mt-4 mb-5 text-slate-600">{token ? 'Continue to verify your invitation and choose a private password. This will replace any current sign-in session on this device.' : 'Open the secure setup link from your official CrossFire invitation email. If it expired, contact the college for a new link.'}</p>{token && <button className="w-full p-3 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50" disabled={busy} onClick={()=>void verify()}>{busy?'Verifying…':'Continue securely'}</button>}</>}
    </div>
  </section>;
}
