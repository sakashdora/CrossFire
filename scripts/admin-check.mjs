// Approved: promote admin@srusti.edu.in to role 'admin', then simulate the Admin Panel's
// RLS-gated reads using a REAL admin session (anon key + password sign-in, like the browser).
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = {};
fs.readFileSync('.env', 'utf8').split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
});
const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL;
const svc = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY);
const email = 'admin@srusti.edu.in';
const { data: l } = await svc.auth.admin.listUsers({ perPage: 200 });
const u = l.users.find((x) => x.email === email);
console.log('auth admin row:', u && u.id);
if (!u) process.exit(1);
if (process.argv[2] === 'promote') {
  const { error } = await svc.from('users').update({ role: 'admin' }).eq('id', u.id);
  console.log('promote error:', error?.message ?? null);
}
const { data: prof } = await svc.from('users').select('id,role').eq('id', u.id);
console.log('profile', prof);

const anon = createClient(url, env.VITE_SUPABASE_ANON_KEY);
for (const pw of ['CrossFire@Admin2026', 'admin123']) {
  const { data, error } = await anon.auth.signInWithPassword({ email, password: pw });
  console.log('signIn with candidate', pw === 'admin123' ? '#2' : '#1', error ? 'FAIL ' + error.message : 'OK');
  if (!error && data.session) {
    const { data: us, error: ue } = await anon.from('users').select('id,email,role');
    console.log('admin SELECT users ->', us?.length, ue?.message ?? '');
    const { data: rs, error: re } = await anon.from('registrations').select('id');
    console.log('admin SELECT registrations ->', rs?.length, re?.message ?? '');
    const seen = us?.some((x) => x.email === process.argv[3]);
    console.log('E2E user visible to admin:', seen);
    break;
  }
}
