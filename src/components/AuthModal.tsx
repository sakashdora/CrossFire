import React, { useEffect, useRef, useState } from 'react';
import { X, ShieldCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isEmailAuthReady } from '../lib/supabase';

export const AuthModal: React.FC<{isOpen:boolean;onClose:()=>void}> = ({isOpen,onClose}) => {
  const {login,requestEmailCode,verifyEmailCode} = useAuth();
  const dialog = useRef<HTMLDialogElement>(null);
  const [staff,setStaff]=useState(!isEmailAuthReady);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [code,setCode]=useState('');
  const [sent,setSent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  useEffect(()=>{if(isOpen){dialog.current?.showModal();setPassword('');setCode('');setSent(false);setError('');}},[isOpen]);
  if(!isOpen)return null;
  const navigate=(role?:string)=>{onClose();window.location.hash=role==='judge'?'judge':role==='volunteer'?'volunteer':role==='admin'||role==='super_admin'?'admin':'dashboard';};
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault(); if(busy)return; setBusy(true);setError('');
    try{
      if(staff){
        const result=await login(email,password);
        if(!result.success){setError(result.error||'Unable to sign in.');return;}
        setPassword('');navigate(result.role);
      }else if(!sent){
        const result=await requestEmailCode(email);
        if(result.success)setSent(true);else setError(result.error||'Unable to send code.');
      }else{
        const result=await verifyEmailCode(email,code);
        if(!result.success){setError(result.error||'Unable to verify code.');return;}
        setCode('');navigate(result.role);
      }
    }catch{setError('Unable to sign in. Check your connection and try again.');}finally{setBusy(false);}
  };
  const field='w-full border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-orange-400';
  return <dialog ref={dialog} aria-labelledby="signin-title" onCancel={onClose} className="p-0 w-[calc(100%_-_32px)] max-w-[440px] rounded-2xl bg-white text-slate-900 backdrop:bg-slate-950/75">
    <header className="bg-navy text-white p-6 flex items-start justify-between"><div><h2 id="signin-title" className="text-xl font-black text-white">{isEmailAuthReady?'CrossFire sign in':'Staff sign in'}</h2><p className="text-xs text-slate-300 mt-1">Srusti Academy · Event portal</p></div><button onClick={onClose} aria-label="Close sign in" className="p-2"><X size={20}/></button></header>
    <div className="p-6">{isEmailAuthReady && <div className="grid grid-cols-2 gap-2 mb-5">{[false,true].map(value=><button type="button" key={String(value)} onClick={()=>{setStaff(value);setSent(false);setCode('');setPassword('');setError('');}} className={'rounded-xl py-3 text-sm font-bold flex justify-center gap-2 '+(staff===value?'bg-navy text-white':'bg-slate-100 text-slate-600')}>{value?<ShieldCheck size={17}/>:<GraduationCap size={17}/>} {value?'Staff':'Email code'}</button>)}</div>}
      <p className="text-sm text-slate-600 mb-5">{staff?'Use your staff credentials, then verify with your authenticator.':isEmailAuthReady?'We will send a one-time code to your registered email. No password needed.':'Email sign-in is not open yet. Contact the college organisers for registration support.'}</p>
      <form onSubmit={submit} className="space-y-4"><label className="block text-sm font-semibold">Email<input className={field+' mt-1'} type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>{setEmail(e.target.value);setSent(false);setCode('');}}/></label>
        {staff?<label className="block text-sm font-semibold">Password<input className={field+' mt-1'} type="password" autoComplete="current-password" required maxLength={200} value={password} onChange={e=>setPassword(e.target.value)}/></label>:sent&&<label className="block text-sm font-semibold">Email verification code<input className={field+' mt-1'} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" required maxLength={10} value={code} onChange={e=>setCode(e.target.value)}/><span className="text-xs text-slate-500 font-normal">If this email has an account, check its inbox and spam folder.</span></label>}
        {error&&<p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">{error}</p>}
        <button disabled={busy||(!staff&&!isEmailAuthReady)} className="w-full bg-orange-500 text-white rounded-xl font-bold py-3 disabled:opacity-50">{busy?'Please wait…':staff?'Sign in':sent?'Verify and sign in':'Send sign-in code'}</button>
        {sent&&!staff&&<button type="button" disabled={busy} onClick={()=>{setSent(false);setCode('');}} className="text-sm underline text-slate-600">Request another code</button>}
      </form><div className="mt-5 pt-4 border-t text-sm text-slate-600">{staff && <p>{isEmailAuthReady?'Lost your password? Use the Email code tab to verify your registered email and open your account. Your authenticator is still required.':'Lost your password? Contact the college administrator for account recovery.'}</p>}{(!staff || !isEmailAuthReady) && <button type="button" className="mt-3 text-orange-600 font-bold" onClick={()=>{onClose();window.location.hash='register';}}>Student registration →</button>}</div>
    </div>
  </dialog>;
};
