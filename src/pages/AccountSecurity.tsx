import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export function AccountSecurity() {
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [failed,setFailed]=useState(false);
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return;setMessage('');setFailed(false);
    if(password!==confirm){setFailed(true);setMessage('The passwords do not match.');return;}
    setBusy(true);
    try{
      const {data,error}=await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if(error||data?.currentLevel!=='aal2')throw new Error('Verify your authenticator before changing your password.');
      const {error:saveError}=await supabase.auth.updateUser({password});
      if(saveError)throw new Error('Your password was not changed. Sign in again and retry with a new password of at least 12 characters.');
      setPassword('');setConfirm('');
      const {error:signOutError}=await supabase.auth.signOut({scope:'others'});
      setMessage(signOutError?'Password updated. Other sessions could not be signed out; contact your administrator.':'Password updated and other refresh sessions ended.');
    }catch(error){setFailed(true);setMessage(error instanceof Error?error.message:'Your password change could not be verified.');}
    finally{setBusy(false);}
  };
  return <section className="max-w-lg mx-auto my-10 rounded-2xl bg-white border p-6 sm:p-8 text-slate-900"><p className="text-xs font-bold tracking-widest text-orange-600 uppercase">Staff account</p><h1 className="text-2xl font-black mt-2">Security settings</h1><p className="text-sm text-slate-600 mt-3 mb-6">Use a unique password stored in your password manager. Keep your authenticator on a device you control.</p><form onSubmit={submit} className="space-y-4">{[{label:'New password',value:password,set:setPassword},{label:'Confirm new password',value:confirm,set:setConfirm}].map(field=><label className="block text-sm font-semibold" key={field.label}>{field.label}<input type="password" autoComplete="new-password" minLength={12} maxLength={200} required value={field.value} onChange={event=>field.set(event.target.value)} className="mt-2 block w-full rounded-xl border px-4 py-3"/></label>)}<button disabled={busy} className="w-full rounded-xl bg-orange-500 text-white font-bold py-3 disabled:opacity-50">{busy?'Updating…':'Update password'}</button></form>{message&&<p role={failed?'alert':'status'} className={'text-sm mt-4 '+(failed?'text-red-700':'text-slate-700')}>{message}</p>}<p className="text-xs text-slate-500 mt-6">Lost your authenticator? Ask the college administrator to verify your identity and recover your account. Never share your password or verification codes.</p></section>;
}
