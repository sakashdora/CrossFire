import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmin() {
  const { data: users, error } = await supabase.from('users').select('id, email, role, first_name, last_name');
  if (error) console.error(error);
  else {
      console.log('Users in DB:');
      console.table(users);
  }
}
checkAdmin();
