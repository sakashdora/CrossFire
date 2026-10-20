import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// TOTP is verified by Supabase Auth. Database policies independently require aal2.
export function StaffVerification() {
  const { refreshAuth, logout } = useAuth();
  const [factor, setFactor] = useState('');
  const [uri, setUri] = useState('');
  const [code, setCode] = useState('');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;
    void supabase.auth.mfa.listFactors().then(({data,error: failure}) => {
      if (!alive) return;
      if (failure) setError('Your authenticator settings could not be loaded. Refresh and try again.');
      else { setFactor(data?.totp.find(item=>item.status==='verified')?.id || ''); setReady(true); }
    });
    return () => { alive=false; };
  }, []);
  const enroll = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try {
      // Supabase limits enrolled factors. Remove only this user's unfinished TOTP enrollments.
      const {data: factors,error: listError}=await supabase.auth.mfa.listFactors();
      if(listError)throw listError;
      for(const item of factors?.all || []) if(item.factor_type==='totp' && item.status==='unverified') await supabase.auth.mfa.unenroll({factorId:item.id});
      const {data,error: failure}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'CrossFire staff',issuer:'CrossFire'});
      if(failure)throw failure;
      setFactor(data.id);setUri(data.totp.uri);
    } catch { setError('Authenticator setup failed. Try again.'); } finally { setBusy(false); }
  };
  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); if(busy)return;
    setBusy(true);setError('');
    try {
      const {error: failure}=await supabase.auth.mfa.challengeAndVerify({factorId:factor,code});
      if(failure){setError('The code is invalid or expired. Check your authenticator and try again.');return;}
      setCode('');setUri('');await refreshAuth();
    } catch { setError('Verification failed. Check your connection and try again.'); } finally { setBusy(false); }
  };
  return <section className="max-w-md mx-auto my-12 rounded-2xl border bg-white p-6 sm:p-8 text-slate-900 shadow-sm">
    <p className="text-xs text-orange-600 uppercase tracking-widest font-bold">Staff security</p><h1 className="text-2xl font-black mt-2">Verify your authenticator</h1>
    <p className="text-sm text-slate-600 my-4">A second verification step protects student information and staff controls. Use an authenticator app on your own device.</p>
    {uri&&<div className="rounded-xl border p-5 my-4"><QRCodeSVG value={uri} size={200} className="mx-auto"/><p className="text-xs text-slate-500 mt-3">Scan this code with your authenticator. Keep it private.</p></div>}
    {factor?<form onSubmit={verify} className="space-y-4"><label className="block text-sm font-semibold">Six-digit authenticator code<input className="w-full mt-2 rounded-xl border px-4 py-3" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label><button disabled={busy} className="w-full rounded-xl bg-orange-500 text-white font-bold p-3 disabled:opacity-50">{busy?'Verifying…':'Verify and continue'}</button></form>:<button disabled={!ready||busy} onClick={enroll} className="w-full rounded-xl bg-orange-500 text-white font-bold p-3 disabled:opacity-50">{busy?'Preparing…':'Set up authenticator'}</button>}
    {error&&<p role="alert" className="text-sm text-red-700 mt-4">{error}</p>}<p className="text-xs text-slate-500 mt-5">Lost access to your authenticator? Contact your college administrator for identity verification and account recovery.</p>
    <button className="mt-4 text-sm underline" onClick={()=>void logout().catch(()=>setError('Sign-out could not be confirmed. Close this browser on shared devices.'))}>Sign out</button>
  </section>;
}
