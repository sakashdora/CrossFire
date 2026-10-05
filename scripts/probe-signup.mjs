// Controlled end-to-end probe using ONLY the public anon key (same as the browser).
// Logs success/error/code/status/user.id/session-exists. Never logs password/tokens/keys.
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const email = `cf_probe_${Date.now()}@example.com`;
const password = `CrossFire@Probe${Date.now()}`;

const { data, error } = await sb.auth.signUp({
  email, password,
  options: { data: { app: 'crossfire', first_name: 'Probe', last_name: 'Test', contact_number: '9876543210',
    whatsapp_number: '9876543210', institute_name: 'Probe School', city_town: 'Bhubaneswar',
    course_stream: '12th Science', board: 'CBSE', food_preference: 'Veg', parent_consent: true, terms_accepted: true, role: 'student' } },
});
console.log('signUp ->', { ok: !error, message: error?.message, code: error?.code, status: error?.status,
  userId: data?.user?.id, sessionExists: !!data?.session, identities: data?.user?.identities?.length });

if (data?.session) {
  const { error: rpcErr } = await sb.rpc('submit_registration_form', {
    p_profile: { first_name: 'Probe', last_name: 'Test', contact_number: '9876543210', whatsapp_number: '9876543210',
      institute_name: 'Probe School', city_town: 'Bhubaneswar', course_stream: '12th Science', board: 'CBSE',
      food_preference: 'Veg', parent_consent: true, terms_accepted: true },
    p_event_slugs: ['quiz', 'debate'],
  });
  console.log('submit_registration_form ->', { ok: !rpcErr, message: rpcErr?.message, code: rpcErr?.code });
} else {
  console.log('No session returned -> RPC cannot run (auth.uid() would be null).');
}
console.log('probe email:', email);
