import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAdmin() {
  const email = 'chandanmahapatra2400@gmail.com';
  
  // Find the auth user
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) return console.error(listError);
  
  const existing = users.users.find(u => u.email === email);
  if (!existing) return console.error('User not found in auth');
  
  // Insert/Update public.users
  const { error: upsertError } = await supabase.from('users').upsert({
    id: existing.id,
    email: email,
    first_name: 'Chandan',
    last_name: 'Admin',
    role: 'admin',
    contact_number: '+910000000000',
    whatsapp_number: '+910000000000',
    institute_name: 'Srusti Academy',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    parent_consent: true,
    terms_accepted: true
  });
  
  if (upsertError) {
    console.error('Error upserting to public.users:', upsertError);
  } else {
    console.log('Successfully made user an admin in public.users!');
  }
}

fixAdmin();
