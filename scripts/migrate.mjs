// Applies supabase/schema.sql to the database in DIRECT_URL inside one transaction.
// Server-side only. Usage: npm run db:migrate
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { getClient } from './db.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const sql = await readFile(path.join(dir, '..', 'supabase', 'schema.sql'), 'utf8');

const client = getClient();
try {
  await client.connect();
  await client.query('begin');
  await client.query(sql);
  await client.query('commit');
  // Ask PostgREST to reload its schema cache so new tables/functions are visible immediately.
  await client.query(`notify pgrst, 'reload schema'`);
  console.log('Schema applied successfully.');
} catch (err) {
  await client.query('rollback').catch(() => {});
  console.error('Migration failed:', err.message, err.position ? `(at char ${err.position})` : '');
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
