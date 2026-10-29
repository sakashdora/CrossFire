import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Provisioned accounts receive a single-use initial password. The database
// blocks every other request until this account holds a password of its own.
export function PasswordChangeRequired() {
  const { user, refreshAuth, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (busy) return;
    setError('');
    if (password.length < 12 || password.length > 72) { setError('Use 12 to 72 characters.'); return; }
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    if (user?.email && password.toLowerCase().includes(user.email.split('@')[0].toLowerCase())) { setError('Do not include your email name in your password.'); return; }
    setBusy(true);
    try {
      const { error: saveError } = await supabase.auth.updateUser({ password });
      if (saveError) throw new Error(saveError.code === 'same_password' ? 'Choose a password different from the one you were given.' : 'Your password was not changed. Try a different password, or sign in again and retry.');
      const { error: confirmError } = await supabase.rpc('crossfire_complete_password_change');
      if (confirmError) throw new Error(confirmError.code === 'P0001' ? confirmError.message : 'Your new password was saved but could not be confirmed. Refresh the page.');
      setPassword(''); setConfirm('');
      await supabase.auth.signOut({ scope: 'others' });
      await refreshAuth();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your password could not be changed.'); }
    finally { setBusy(false); }
  };
  return <section className="max-w-md mx-auto my-12 rounded-2xl border bg-white p-6 sm:p-8 text-slate-900 shadow-sm">
    <KeyRound className="text-orange-500 mb-3" size={30}/>
    <p className="text-xs text-orange-600 uppercase tracking-widest font-bold">Account setup</p>
    <h1 className="text-2xl font-black mt-2">Choose your own password</h1>
    <p className="text-sm text-slate-600 my-4">You signed in with an initial password from the organisers. It works only once. Choose a new private password to continue.</p>
    <form onSubmit={submit} className="space-y-4">
      {[{label:'New password',value:password,set:setPassword},{label:'Confirm new password',value:confirm,set:setConfirm}].map(field=><label className="block text-sm font-semibold" key={field.label}>{field.label}<input type="password" autoComplete="new-password" minLength={12} maxLength={72} required value={field.value} onChange={event=>field.set(event.target.value)} disabled={busy} className="mt-2 block w-full rounded-xl border px-4 py-3"/></label>)}
      <p className="text-xs text-slate-500">At least 12 characters. A password manager is recommended.</p>
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}
      <button disabled={busy} className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 disabled:opacity-50">{busy ? 'Saving…' : 'Save password and continue'}</button>
    </form>
    <button className="mt-4 text-sm underline" onClick={()=>void logout()}>Sign out</button>
  </section>;
}
