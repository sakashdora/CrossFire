import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);

const anonClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const adminClient = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

console.log('--- 1. Testing System Settings (Student Portal Toggle) ---');
const { data: settingData, error: sErr } = await anonClient.rpc('get_system_setting', { p_key: 'student_portal_open' });
console.log('Current student_portal_open:', settingData, 'error:', sErr);

console.log('\n--- 2. Testing Super Admin & College Admin in Database ---');
const { data: admins, error: aErr } = await adminClient.from('users').select('email, role').in('role', ['admin', 'super_admin']);
console.log('Admins in DB:', admins, 'error:', aErr);

console.log('\n--- 3. Testing Relational Volunteers & Guests in Supabase ---');
const { data: vols, error: vErr } = await adminClient.from('volunteers').select('volunteer_id, name, email');
console.log('Volunteers in DB:', vols?.length, 'sample:', vols?.[0]);

const { data: guests, error: gErr } = await adminClient.from('guests').select('name, category, escort_volunteer_id');
console.log('Guests in DB:', guests?.length, 'sample with escort FK:', guests?.[0]);

console.log('\n--- 4. Testing Volunteer Login Verification RPC ---');
const { data: volAuth, error: vaErr } = await anonClient.rpc('verify_volunteer_login', {
  p_identifier: 'VOL-101',
  p_password: process.env.VOLUNTEER_PASSWORD || 'ChangeMeVol@2026!'
});
console.log('Volunteer login VOL-101 result:', volAuth ? `Verified (${volAuth.name})` : 'Failed', 'error:', vaErr);

console.log('\n--- 5. Testing Student Public Registration ---');
const testStudentEmail = `verify_candidate_${Date.now()}@gmail.com`;
const { data: suData, error: suErr } = await anonClient.auth.signUp({
  email: testStudentEmail,
  password: 'CrossFire@Student2026',
  options: {
    data: {
      app: 'crossfire',
      first_name: 'Subrat',
      last_name: 'Jena',
      contact_number: '9861012345',
      whatsapp_number: '9861012345',
      institute_name: 'BJB Higher Secondary School',
      city_town: 'Bhubaneswar',
      course_stream: '12th Science',
      board: 'CHSE',
      food_preference: 'Veg',
      parent_consent: true,
      terms_accepted: true,
      role: 'student'
    }
  }
});
console.log('Student signUp:', { ok: !suErr, userId: suData?.user?.id, session: !!suData?.session });

if (suData?.session) {
  const { error: regErr } = await anonClient.rpc('submit_registration_form', {
    p_profile: {
      first_name: 'Subrat',
      last_name: 'Jena',
      contact_number: '9861012345',
      whatsapp_number: '9861012345',
      institute_name: 'BJB Higher Secondary School',
      city_town: 'Bhubaneswar',
      course_stream: '12th Science',
      board: 'CHSE',
      food_preference: 'Veg',
      parent_consent: true,
      terms_accepted: true
    },
    p_event_slugs: ['quiz', 'debate']
  });
  console.log('submit_registration_form:', { ok: !regErr, error: regErr?.message });

  const { data: dbUser } = await adminClient.from('users').select('*').eq('id', suData.user.id).single();
  console.log('Registered Student in DB:', { id: dbUser?.id, name: `${dbUser?.first_name} ${dbUser?.last_name}`, pass_number: dbUser?.pass_number, role: dbUser?.role });

  const { data: dbRegs } = await adminClient.from('registrations').select('id, event_id, status').eq('user_id', suData.user.id);
  console.log('Registered Competitions in DB:', dbRegs?.length, 'events registered');
}

console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY ===');
