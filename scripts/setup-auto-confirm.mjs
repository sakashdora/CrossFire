import pg from 'pg';
import fs from 'node:fs';

const env = Object.fromEntries(
  fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split(/\r?\n/).filter(l => /^\s*[A-Za-z_]+\s*=/.test(l))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; })
);

const client = new pg.Client({
  connectionString: env.DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const sql = `
create or replace function public.crossfire_auto_confirm_user()
returns trigger as $$
begin
  if (new.raw_user_meta_data->>'app' = 'crossfire') then
    new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_crossfire_auto_confirm on auth.users;
create trigger tr_crossfire_auto_confirm
  before insert on auth.users
  for each row
  execute function public.crossfire_auto_confirm_user();
`;

await client.query(sql);
console.log('Trigger created successfully on auth.users!');
await client.end();
