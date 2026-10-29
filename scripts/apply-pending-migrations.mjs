/**
 * Applies pending migrations that db push cannot handle due to same-date-prefix collisions.
 * Migrations are applied directly via pg, then their entries are upserted into
 * supabase_migrations.schema_migrations so the CLI stays in sync.
 *
 * Usage:
 *   $env:DIRECT_URL="postgresql://postgres.<ref>:<password>@<host>/postgres"
 *   node scripts/apply-pending-migrations.mjs
 */
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_URL = process.env.DIRECT_URL;
if (!DB_URL) {
  console.error('ERROR: DIRECT_URL environment variable is not set.');
  console.error('  PowerShell: $env:DIRECT_URL="postgresql://postgres.<ref>:<password>@<host>/postgres"');
  console.error('  bash/zsh:   export DIRECT_URL="postgresql://..."');
  process.exit(1);
}

// Migrations to apply in order ΓÇö only those not yet recorded remotely.
const PENDING = [
  '20261019_public_event_access.sql',
  '20261019_rpc_privileges.sql',
  '20261020_student_invitations.sql',
  '20261020_registration_intake.sql',
  '20261029_live_ops_and_access.sql',
];

const MIGRATIONS_DIR = path.join(__dirname, '..', 'supabase', 'migrations');

async function main() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connected to remote database.');

  // Fetch already-recorded migration names from the Supabase tracking table.
  const { rows: recorded } = await client.query(
    `SELECT name FROM supabase_migrations.schema_migrations ORDER BY version`
  );
  const recordedNames = new Set(recorded.map(r => r.name));
  console.log('Already recorded:', [...recordedNames]);

  for (const filename of PENDING) {
    if (recordedNames.has(filename)) {
      console.log(`  SKIP (already recorded): ${filename}`);
      continue;
    }
    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Derive the version (numeric prefix) from the filename.
    const version = filename.replace(/[^0-9].*$/, '');

    console.log(`\nApplying ${filename} (version=${version}) ...`);
    try {
      await client.query('BEGIN');
      await client.query(sql);
      // Split into individual statements for the statements array Supabase stores.
      const statements = sql
        .split(/;\s*\n/)
        .map(s => s.trim())
        .filter(Boolean);
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
         VALUES ($1, $2, $3)
         ON CONFLICT (version) DO UPDATE SET name=EXCLUDED.name, statements=EXCLUDED.statements`,
        [version, filename, statements]
      );
      await client.query('COMMIT');
      console.log(`  Γ£ô Applied and recorded: ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  Γ£ù FAILED: ${filename}\n  ${err.message}`);
      process.exit(1);
    }
  }

  // Print final state.
  const { rows: final } = await client.query(
    `SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version, name`
  );
  console.log('\nFinal migration state on remote:');
  final.forEach(r => console.log(`  [${r.version}] ${r.name}`));

  await client.end();
  console.log('\nDone.');
}

main().catch(err => { console.error(err); process.exit(1); });
