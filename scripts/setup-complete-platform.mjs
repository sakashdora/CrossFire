// Provisions official Super Admin, College Admin, Judge, and Volunteer accounts in Supabase Auth & public.users
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const ACCOUNTS = [
  {
    email: 'chandanmahapatra2400@gmail.com',
    password: '8328863317@',
    role: 'super_admin',
    first_name: 'Chandan',
    last_name: 'Mahapatra',
    contact_number: '+918328863317',
    institute_name: 'Srusti Academy of Graduate Studies'
  },
  {
    email: 'admin@srusti.edu.in',
    password: 'CrossFire@Admin2026',
    role: 'admin',
    first_name: 'Srusti College',
    last_name: 'Admin',
    contact_number: '+917008671339',
    institute_name: 'Srusti Academy of Graduate Studies'
  },
  {
    email: 'volunteer@srusti.edu.in',
    password: 'volunteer123',
    role: 'volunteer',
    first_name: 'Subhashree',
    last_name: 'Mohapatra',
    contact_number: '+919437198765',
    institute_name: 'Srusti Academy of Graduate Studies'
  },
  {
    email: 'judge@srusti.edu.in',
    password: 'judge123',
    role: 'judge',
    first_name: 'Dr. Meera',
    last_name: 'Senapati',
    contact_number: '+919823456789',
    institute_name: 'Srusti Academy of Graduate Studies'
  }
];

async function provisionAccounts() {
  console.log('Starting account provisioning on Supabase project:', new URL(supabaseUrl).hostname.split('.')[0]);

  for (const acc of ACCOUNTS) {
    console.log(`\nProcessing ${acc.role.toUpperCase()}: ${acc.email}...`);

    let userId;
    // 1. Try to create user in Supabase Auth
    const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
      email: acc.email,
      password: acc.password,
      email_confirm: true,
      user_metadata: {
        app: 'crossfire',
        first_name: acc.first_name,
        last_name: acc.last_name,
        role: acc.role
      }
    });

    if (createData?.user) {
      userId = createData.user.id;
      console.log(` Created auth user with ID: ${userId}`);
    } else if (createError && (createError.message.includes('already registered') || createError.code === 'user_already_exists')) {
      // Find existing user
      const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users:', listError.message);
        continue;
      }
      const existing = listData.users.find(u => u.email.toLowerCase() === acc.email.toLowerCase());
      if (!existing) {
        console.error('Could not find existing user record for', acc.email);
        continue;
      }
      userId = existing.id;
      // Update password and confirm email
      await adminClient.auth.admin.updateUserById(userId, {
        password: acc.password,
        email_confirm: true
      });
      console.log(` Existing user found with ID: ${userId}, password refreshed.`);
    } else {
      console.error(` Failed to create auth user: ${createError?.message}`);
      continue;
    }

    // 2. Ensure profile in public.users has correct role and fields
    const { error: upsertError } = await adminClient.from('users').upsert({
      id: userId,
      email: acc.email.toLowerCase(),
      first_name: acc.first_name,
      last_name: acc.last_name,
      contact_number: acc.contact_number,
      whatsapp_number: acc.contact_number,
      institute_name: acc.institute_name,
      city_town: 'Bhubaneswar',
      course_stream: '12th Science',
      board: 'CHSE',
      food_preference: 'Veg',
      role: acc.role,
      parent_consent: true,
      terms_accepted: true
    });

    if (upsertError) {
      console.error(` Failed to update public.users profile: ${upsertError.message}`);
    } else {
      console.log(` Assigned role "${acc.role}" to ${acc.email} in public.users!`);
    }
  }

  // 3. Verify public.users table contents
  const { data: allUsers, error: userError } = await adminClient
    .from('users')
    .select('id, email, role, first_name, last_name, created_at')
    .order('created_at');

  if (userError) {
    console.error('Error fetching public.users:', userError);
  } else {
    console.log('\n================ OFFICIAL DATABASE USERS ================');
    console.table(allUsers);
  }

  // 4. Verify system_settings table
  const { data: settings } = await adminClient.from('system_settings').select('*');
  console.log('\n================ SYSTEM SETTINGS ================');
  console.table(settings);

  // 5. Verify volunteers table
  const { data: volunteers } = await adminClient.from('volunteers').select('volunteer_id, name, email, assigned_station');
  console.log('\n================ VOLUNTEERS ================');
  console.table(volunteers);

  // 6. Verify guests table
  const { data: guests } = await adminClient.from('guests').select('name, designation, category, status');
  console.log('\n================ GUESTS ================');
  console.table(guests);
}

provisionAccounts().catch(console.error);
