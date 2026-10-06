// Update public.events with the exact verified prize pool & distribution breakdown.
import { getClient } from './db.mjs';

const c = getClient();
try {
  await c.connect();
  console.log('Connected to database.');

  const updates = [
    {
      slug: 'quiz',
      prize_pool: 18000,
      prize_distribution: { '1st': 6000, '2nd': 4000, '3rd': 3500, '4th': 1500, '5th': 1500, '6th': 1500 }
    },
    {
      slug: 'treasure-hunt',
      prize_pool: 6000,
      prize_distribution: { '1st': 3000, '2nd': 2000, '3rd': 1000 }
    },
    {
      slug: 'ramp-walk',
      prize_pool: 6000,
      prize_distribution: { '1st': 3000, '2nd': 2000, '3rd': 1000 }
    },
    {
      slug: 'reels',
      prize_pool: 6000,
      prize_distribution: { '1st': 3000, '2nd': 2000, '3rd': 1000 }
    },
    {
      slug: 'debate',
      prize_pool: 7000,
      prize_distribution: { '1st': 4000, '2nd': 2000, '3rd': 1000 }
    },
    {
      slug: 'poster-making',
      prize_pool: 7000,
      prize_distribution: { '1st': 4000, '2nd': 2000, '3rd': 1000 }
    }
  ];

  for (const u of updates) {
    const res = await c.query(
      `UPDATE public.events 
       SET prize_pool = $1, prize_distribution = $2::jsonb 
       WHERE slug = $3`,
      [u.prize_pool, JSON.stringify(u.prize_distribution), u.slug]
    );
    console.log(`Updated ${u.slug}: ${res.rowCount} row(s) updated (Prize Pool: ₹${u.prize_pool})`);
  }

  const check = await c.query('SELECT name, slug, team_size, prize_pool, prize_distribution FROM public.events ORDER BY name');
  console.log('\n== Current Events Table in Supabase ==');
  console.table(check.rows);

  const total = await c.query('SELECT SUM(prize_pool)::int as total_prize FROM public.events');
  console.log(`\nVerified Total Prize Pool in DB: ₹${total.rows[0].total_prize}`);

} catch (err) {
  console.error('Error updating event prizes:', err);
  process.exitCode = 1;
} finally {
  await c.end().catch(() => {});
}
