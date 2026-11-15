-- Local PGlite fixture for the Supabase Vault interface. Only the test database owner can access it.
create schema vault;
create table vault.secrets(id uuid primary key default gen_random_uuid(),name text unique,description text not null default '',secret text not null,key_id uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create view vault.decrypted_secrets as select id,name,description,secret,secret as decrypted_secret,key_id,created_at,updated_at from vault.secrets;
create function vault.create_secret(new_secret text,new_name text default null,new_description text default '',new_key_id uuid default null) returns uuid language sql as $$insert into vault.secrets(name,description,secret,key_id) values(new_name,coalesce(new_description,''),new_secret,new_key_id) returning id$$;
