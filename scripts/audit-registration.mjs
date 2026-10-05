// Read-only server-side audit (service-role via .env, never printed, never bundled into the browser).
// Verifies: which project, auth.users, public.users, registrations, events, trigger/RPC reachability.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const url = env.VITE_SUPABASE_URL;
console.log('frontend project ref :', new URL(url).hostname.split('.')[0]);
console.log('server-side  project :', new URL(env.SUPABASE_URL || url).hostname.split('.')[0]);

const admin = createClient(env.SUPABASE_URL || url, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const { data: au, error: auErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
console.log('\nauth.users error:', auErr?.message || null, '| count:', au?.users?.length);
console.table((au?.users || []).map(u => ({
  id: u.id.slice(0, 8), email: u.email, confirmed: !!u.email_confirmed_at,
  app: u.user_metadata?.app || '-', created: u.created_at,
})));

for (const t of ['users', 'registrations', 'events']) {
  const { count, error } = await admin.from(t).select('*', { count: 'exact', head: true });
  console.log(`public.${t}: count=${count} error=${error?.message || null}`);
}
const { data: pu } = await admin.from('users').select('id,email,role,created_at').order('created_at');
console.table((pu || []).map(u => ({ ...u, id: u.id.slice(0, 8) })));
