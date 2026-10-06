import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);

const adminClient = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const admins = [
  {
    email: env.SUPER_ADMIN_EMAIL || 'trueinspire@gmail.com',
    password: env.SUPER_ADMIN_PASSWORD || 'ChangeMeSuperAdmin@2026!',
    role: 'super_admin',
    first_name: 'TrueInspire',
    last_name: 'SuperAdmin'
  },
  {
    email: env.ADMIN_EMAIL || 'crossfire@gmail.com',
    password: env.ADMIN_PASSWORD || 'ChangeMeAdmin@2026!',
    role: 'admin',
    first_name: 'CrossFire',
    last_name: 'CollegeAdmin'
  }
];

for (const a of admins) {
  console.log(`Processing admin: ${a.email} (${a.role})...`);
  
  // 1. Check if user already exists in auth.users
  const { data: { users }, error: listErr } = await adminClient.auth.admin.listUsers();
  const existing = users?.find(u => u.email?.toLowerCase() === a.email.toLowerCase());
  
  let userId = existing?.id;

  if (existing) {
    console.log(`Updating existing auth user ${userId}...`);
    const { data: updated, error: updErr } = await adminClient.auth.admin.updateUserById(userId, {
      password: a.password,
      email_confirm: true,
      user_metadata: {
        app: 'crossfire',
        role: a.role,
        first_name: a.first_name,
        last_name: a.last_name
      }
    });
    if (updErr) console.warn('Update auth user warning:', updErr);
  } else {
    console.log(`Creating new auth user...`);
    const { data: created, error: crErr } = await adminClient.auth.admin.createUser({
      email: a.email,
      password: a.password,
      email_confirm: true,
      user_metadata: {
        app: 'crossfire',
        role: a.role,
        first_name: a.first_name,
        last_name: a.last_name
      }
    });
    if (crErr) throw crErr;
    userId = created.user.id;
  }

  // 2. Upsert into public.users with exact role
  const { error: upsertErr } = await adminClient.from('users').upsert({
    id: userId,
    email: a.email,
    first_name: a.first_name,
    last_name: a.last_name,
    role: a.role,
    contact_number: '+919861000000',
    whatsapp_number: '+919861000000',
    institute_name: 'Srusti Academy of Graduate Studies',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    parent_consent: true,
    terms_accepted: true,
    updated_at: new Date().toISOString()
  });

  if (upsertErr) console.warn(`Error upserting public.users for ${a.email}:`, upsertErr);
  else console.log(`✓ public.users updated for ${a.email} with role '${a.role}'.`);
}

// 3. Verify logins with anon client
const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
for (const a of admins) {
  const { data: loginRes, error: loginErr } = await anonClient.auth.signInWithPassword({
    email: a.email,
    password: a.password
  });
  console.log(`Login verification for ${a.email}:`, {
    ok: !loginErr,
    userId: loginRes?.user?.id,
    error: loginErr?.message
  });
}

console.log('Admin provisioning completed successfully!');
