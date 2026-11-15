import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Megaphone, X } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import './homepage-announcements.css';

const table = 'crossfire_homepage_announcements';
const time = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true });
const date = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' });
interface Announcement { sequence: number; title: string; message: string; published_at: string }

function getUpdates(limit: number, before?: number) {
  const query = supabase.from(table).select('sequence,title,message,published_at').order('sequence', { ascending: false }).limit(limit);
  return (before === undefined ? query : query.lt('sequence', before)).returns<Announcement[]>();
}

function PublishedTime({ value, full = false }: { value: string; full?: boolean }) {
  const published = new Date(value);
  const showDate = full || date.format(published) !== date.format(new Date());
  return <time dateTime={value}>{showDate && date.format(published) + ' · '}{time.format(published).toUpperCase()} IST</time>;
}

function UpdateList({ latest }: { latest: Announcement }) {
  const [older, setOlder] = useState<Announcement[]>([]);
  const [cursor, setCursor] = useState(latest.sequence);
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<'loading' | 'more' | 'done' | 'error'>('loading');
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const { data, error } = await getUpdates(21, cursor);
        if (!active) return;
        if (error || !data) throw new Error();
        setOlder(rows => [...rows, ...data.slice(0, 20)]);
        setState(data.length > 20 ? 'more' : 'done');
      } catch { if (active) setState('error'); }
    };
    void load();
    return () => { active = false; };
  }, [cursor, retry]);
  return <>
    <ol>{[latest, ...older].map(item => <li key={item.sequence}>
      <PublishedTime value={item.published_at} full /><h3>{item.title}</h3><p>{item.message}</p>
    </li>)}</ol>
    {state === 'error' && <p role="status">Earlier updates could not be loaded.</p>}
    {(state === 'more' || state === 'error') && <button className="cf-updates-more" onClick={() => {
      setState('loading');
      if (state === 'error') setRetry(value => value + 1);
      else setCursor(older[older.length - 1].sequence);
    }}>{state === 'error' ? 'Retry' : 'Load earlier updates'}</button>}
  </>;
}

export function HomepageAnnouncements() {
  const [latest, setLatest] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    let revision = 0;
    const refresh = async () => {
      if (document.hidden) return;
      const current = ++revision;
      try {
        const { data, error } = await getUpdates(1);
        if (active && current === revision && !error && data) {
          setLatest(data[0] ?? null);
          if (!data.length) setOpen(false);
        }
      } catch { /* Keep the last confirmed notice while reconnecting. */ }
    };
    void refresh();
    const channel = supabase.channel('homepage-announcements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, refresh)
      .subscribe(status => { if (status === 'SUBSCRIBED') void refresh(); });
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      void supabase.removeChannel(channel);
    };
  }, []);
  if (!latest) return null;
  return <section className="cf-announcements" aria-label="Latest public announcement">
    <div className="cf-notice-inner">
      <span className="cf-notice-icon"><Megaphone size={23} aria-hidden="true" /></span>
      <div className="cf-notice-copy" aria-live="polite" aria-atomic="true">
        <div className="cf-notice-meta"><strong>Live announcement</strong><PublishedTime value={latest.published_at} /></div>
        <p>{latest.title}</p>
      </div>
      <button className="cf-notice-all" aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
        All updates <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
    <dialog className="cf-updates-panel" ref={dialog} aria-labelledby="cf-updates-title" onClose={() => setOpen(false)}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientY < rect.top) dialog.current?.close();
      }}>
      <header><h2 id="cf-updates-title">Event updates</h2><button aria-label="Close updates" onClick={() => dialog.current?.close()}><X size={18} /></button></header>
      {open && <UpdateList key={latest.sequence} latest={latest} />}
    </dialog>
  </section>;
}
