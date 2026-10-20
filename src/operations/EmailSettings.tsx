import { useEffect, useState, type FormEvent } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Settings = { sender_name: string; sender_email: string; reply_to: string; enabled: boolean };
export async function invitationRequest(body: object) {
  const result = await supabase.functions.invoke('invite-student', { body });
  if (result.error) {
    let message = 'The invitation service could not be reached. Refresh the request status before retrying.';
    try { const details = await result.error.context?.json(); if (typeof details?.error === 'string') message = details.error; } catch { /* network error has no JSON */ }
    throw new Error(message);
  }
  if (result.data?.error) throw new Error(result.data.error);
  return result.data;
}

export function EmailSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [provider, setProvider] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const load = async () => {
    setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: failure } = await supabase.rpc('crossfire_mail_configuration');
      if (failure) throw failure;
      setSettings({ sender_name: data.sender_name, sender_email: data.sender_email, reply_to: data.reply_to, enabled: data.enabled });
      const status = await invitationRequest({ action: 'status' });
      setProvider(status.configured === true);
    } catch { setProvider(null); setError('Unable to verify email configuration. Check your admin access, authenticator session and connection.'); }
    finally { setBusy(false); }
  };
  useEffect(() => { void load(); }, []);
  const save = async (event: FormEvent) => {
    event.preventDefault(); if (!settings || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const { data, error: failure } = await supabase.rpc('crossfire_mail_configuration', { p_settings: settings });
      if (failure) throw failure;
      setSettings({ sender_name: data.sender_name, sender_email: data.sender_email, reply_to: data.reply_to, enabled: data.enabled });
      setNotice('Official sender settings saved. Send student invitations individually from Registration review.');
    } catch (cause) { const failure = cause as { code?: string; message?: string }; setError(failure.code === 'P0001' ? failure.message || 'Check the sender details.' : 'Settings could not be confirmed. Refresh before retrying.'); }
    finally { setBusy(false); }
  };
  return <section className="ops-panel">
    <div className="ops-panel-head"><h2><Mail size={20} /> Official college email</h2><button disabled={busy} onClick={()=>void load()}><RefreshCw size={16}/> Refresh</button></div>
    <p className="ops-panel-note">Send approved students their Student ID, Pass ID and a private link to choose or recover a password. Passwords are never sent by email. Invitations are available after the super admin opens the student portal.</p>
    <p className={`ops-message ${provider ? 'success' : 'error'}`} role="status">{provider === null ? 'Email service connection has not been verified.' : provider ? 'Server email configuration is present. The sender domain must also be verified with Resend before sending.' : 'Email sending is not connected yet. The project owner must verify the college sender domain in Resend and add its API key to the server configuration.'}</p>
    {error && <p role="alert" className="ops-message error">{error}</p>}
    {notice && <p role="status" className="ops-message success">{notice}</p>}
    {settings && <form onSubmit={save} className="ops-form">
      <div className="ops-fields">
        <label>Sender name<input required minLength={2} maxLength={100} value={settings.sender_name} disabled={busy} onChange={e=>setSettings({...settings,sender_name:e.target.value})}/></label>
        <label>Official sender email<input type="email" required maxLength={254} placeholder="Use your verified college domain" value={settings.sender_email} disabled={busy} onChange={e=>setSettings({...settings,sender_email:e.target.value})}/></label>
        <label>Reply-to email<input type="email" required maxLength={254} value={settings.reply_to} disabled={busy} onChange={e=>setSettings({...settings,reply_to:e.target.value})}/><small>Students can contact this inbox for help.</small></label>
        <label><span>Enable student invitations</span><input type="checkbox" checked={settings.enabled} disabled={busy || provider !== true} onChange={e=>setSettings({...settings,enabled:e.target.checked})}/><small>The sender must be verified before enabling.</small></label>
      </div><footer><button type="submit" className="primary" disabled={busy}>{busy?'Saving…':'Save official sender'}</button></footer>
    </form>}
    <p className="ops-panel-note">Workflow: review registration → open student portal → send invitation → student sets password → sign in. “Accepted by provider” does not confirm delivery to the inbox. WhatsApp messages are not sent by this feature.</p>
  </section>;
}
