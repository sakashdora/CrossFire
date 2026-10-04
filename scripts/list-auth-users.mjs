// Read-only: list auth users' emails/providers (no secrets) to locate the admin account.
import { getClient } from './db.mjs';
const c = getClient();
await c.connect();
const r = await c.query(`select id, email, raw_app_meta_data->>'provider' as provider, email_confirmed_at is not null as confirmed, created_at from auth.users order by created_at`);
console.table(r.rows.map(x => ({ ...x, id: x.id.slice(0, 8) })));
await c.end();
