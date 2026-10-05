import { getClient } from './db.mjs';

const client = getClient();

async function test() {
  await client.connect();
  console.log('[TEST] Connected to PostgreSQL...');

  try {
    // 1. Check current volunteers
    const vols = await client.query('SELECT volunteer_id, name, email FROM public.volunteers');
    console.log('[TEST] Current volunteers in DB:', vols.rows);

    // 2. Check current guests
    const guests = await client.query('SELECT name, category, organization FROM public.guests LIMIT 3');
    console.log('[TEST] Sample guests in DB:', guests.rows);

    // 3. Test creating a new volunteer directly in Supabase
    const testVolId = `VOL-${Date.now().toString().slice(-4)}`;
    const insertVol = await client.query(`
      INSERT INTO public.volunteers (volunteer_id, name, contact_number, email, password, assigned_station, shift)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, volunteer_id, name
    `, [testVolId, 'Live Test Volunteer', '9876543210', `test_${Date.now()}@srusti.edu.in`, 'volpass123', 'Gate 1', 'Morning']);
    console.log('[TEST] Successfully inserted volunteer in DB:', insertVol.rows[0]);

    // 4. Test deleting the volunteer
    const delVol = await client.query(`DELETE FROM public.volunteers WHERE id = $1 RETURNING id`, [insertVol.rows[0].id]);
    console.log('[TEST] Successfully deleted volunteer from DB:', delVol.rowCount === 1);

    // 5. Test creating a new guest directly in Supabase
    const insertGuest = await client.query(`
      INSERT INTO public.guests (name, designation, organization, category, contact_number, email)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, organization
    `, ['Dr. Live Guest', 'Director', 'IIT Bhubaneswar', 'Chief Guest', '9988776655', `guest_${Date.now()}@iit.ac.in`]);
    console.log('[TEST] Successfully inserted guest in DB:', insertGuest.rows[0]);

    // 6. Test deleting the guest
    const delGuest = await client.query(`DELETE FROM public.guests WHERE id = $1 RETURNING id`, [insertGuest.rows[0].id]);
    console.log('[TEST] Successfully deleted guest from DB:', delGuest.rowCount === 1);

  } catch (err) {
    console.error('[ERROR] Test failed:', err);
  } finally {
    await client.end().catch(() => {});
  }
}

test();
