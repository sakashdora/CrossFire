// Read-only verification of one registration by email (service role, server-side only).
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = {};
fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});
const s = createClient(env.SUPABASE_URL || env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const email = process.argv[2];
const { data: l } = await s.auth.admin.listUsers({ perPage: 200 });
const u = l.users.find((x) => x.email === email);
console.log('auth', u && { id: u.id, email: u.email, created: u.created_at });
if (u) {
  const { data: p, error: pe } = await s.from('users').select('id,role,pass_number,created_at').eq('id', u.id);
  console.log('profile', p, pe?.message);
  const { data: r, error: re } = await s.from('registrations').select('id,event_id,user_id,created_at').eq('user_id', u.id);
  console.log('regs', r, re?.message);
}
