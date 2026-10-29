import { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CalendarDays, Download, RefreshCw, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { downloadQrPng } from '../lib/qrDownload';

interface VipInvitation { pass_code: string; name: string; designation: string; organization: string; category: string; status: string; arrival_time: string; dietary_preference: string; arrived_at: string | null; departed_at: string | null; meal_redeemed_at: string | null; escort: string | null }
interface VipSnapshot { profile: { name: string; email: string; contact_number: string }; invitation: VipInvitation | null; events: { id: string; name: string; venue: string; start_time: string; end_time: string; status: string }[]; fetched_at: string }
const time = (value: string | null) => value ? new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';

// The server returns only this guest's own invitation and the public schedule.
export function VipDashboard() {
  const [data, setData] = useState<VipSnapshot | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const qr = useRef<SVGSVGElement>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: snapshot, error: failure } = await supabase.rpc('crossfire_vip_snapshot');
      if (failure || !snapshot?.profile) throw new Error('Your invitation could not be loaded. Refresh, or contact the organisers.');
      setData(snapshot as VipSnapshot); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Your invitation could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); const timer = window.setInterval(() => { if (!document.hidden) void load(); }, 60000); return () => clearInterval(timer); }, [load]);
  if (!data) return <section className="max-w-lg mx-auto my-16 p-8 bg-white rounded-2xl border text-center" role={error ? 'alert' : 'status'}>{loading ? 'Loading your invitation…' : <>{error}<button className="block mx-auto mt-4 text-orange-600 font-bold" onClick={() => void load()}>Retry</button></>}</section>;
  const invite = data.invitation;
  return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
    {error && <p role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</p>}
    <section className="rounded-3xl bg-navy text-white p-6 sm:p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
      <div className="space-y-2 text-center md:text-left">
        <p className="text-xs font-black tracking-[0.2em] text-orange-400 flex items-center gap-2 justify-center md:justify-start"><Star size={14} /> CROSSFIRE 2026 · INVITED GUEST</p>
        <h1 className="text-2xl sm:text-3xl font-black">{invite?.name || data.profile.name}</h1>
        {invite && <p className="text-sm text-slate-300">{invite.designation} · {invite.organization}</p>}
        <p className="text-xs text-slate-400">{data.profile.email}</p>
      </div>
      {invite && <div className="bg-white rounded-2xl p-3 text-navy text-center">
        <QRCodeSVG ref={qr} value={JSON.stringify({ guest_pass: invite.pass_code })} size={150} marginSize={3} role="img" aria-label="Guest pass QR" />
        <code className="block text-[10px] mt-1 break-all">{invite.pass_code}</code>
        <button type="button" className="mt-1 inline-flex items-center gap-1 text-xs font-bold" onClick={() => void downloadQrPng(qr.current, 'crossfire-guest-pass.png').catch(cause => setError(cause instanceof Error ? cause.message : 'Download failed.'))}><Download size={13} /> Download</button>
      </div>}
    </section>
    {!invite ? <section className="p-6 bg-white rounded-2xl border text-center text-slate-600">Your login is ready, but no active invitation is linked to it. Please contact the CrossFire organisers.</section> :
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {([['Invitation', invite.status], ['Category', invite.category], ['Expected arrival', invite.arrival_time || 'To be confirmed'], ['Your escort', invite.escort || 'VIP & guest desk'], ['Meal', `${invite.dietary_preference} · ${invite.meal_redeemed_at ? 'served' : 'not yet served'}`], ['Arrived', time(invite.arrived_at)], ['Departed', time(invite.departed_at)]] as const).map(([label, value]) => <div key={label} className="p-4 bg-white rounded-2xl border"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p><p className="font-bold text-navy mt-1">{value}</p></div>)}
      </section>}
    <section className="p-5 sm:p-6 bg-white rounded-2xl border">
      <div className="flex items-center justify-between mb-4"><h2 className="font-black text-navy flex items-center gap-2"><CalendarDays size={18} /> Event schedule</h2><button className="text-xs inline-flex items-center gap-1 text-slate-500" onClick={() => void load()} disabled={loading}><RefreshCw size={13} /> {loading ? 'Refreshing…' : 'Refresh'}</button></div>
      {data.events.length ? <ul className="divide-y">{data.events.map(event => <li key={event.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1"><div><strong className="text-navy">{event.name}</strong><p className="text-xs text-slate-500">{event.venue}</p></div><span className="text-xs text-slate-600">{time(event.start_time)} · {event.status.split('_').join(' ')}</span></li>)}</ul> : <p className="text-sm text-slate-500">The schedule will be published soon.</p>}
      <p className="text-xs text-slate-500 mt-4">Show your guest pass at the VIP desk. The desk confirms your invitation against the live record. Updated {time(data.fetched_at)}.</p>
    </section>
  </div>;
}
