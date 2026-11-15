-- Volunteer and coordinator logins are issued by an admin or super admin with a
-- fixed ID (email) and password. The crew member never resets it; the admin can
-- view it again to share it. Other roles (judge, VIP guest, admin, super admin)
-- keep the single-use initial password and must choose their own.
--
-- The password itself lives only in Supabase Vault (encrypted at rest with a key
-- the database tables never hold). The table below keeps a reference to it.
do $$
begin
  if to_regprocedure('vault.create_secret(text,text,text,uuid)') is null or to_regclass('vault.decrypted_secrets') is null then
    raise exception 'Supabase Vault is required to keep crew passwords encrypted.';
  end if;
end $$;

create table if not exists public.crossfire_staff_credentials (
  user_id uuid primary key references public.users(id) on delete cascade,
  login_id text not null,
  secret_id uuid not null,
  issued_by uuid references public.users(id) on delete set null,
  issued_at timestamptz not null default now()
);
alter table public.crossfire_staff_credentials enable row level security;
revoke all on public.crossfire_staff_credentials from public, anon, authenticated;

-- Whenever a credential row goes (cleared, role change, account deleted), its
-- vault secret goes with it.
create or replace function public._crossfire_forget_crew_secret() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end $$;
revoke all on function public._crossfire_forget_crew_secret() from public, anon, authenticated;
drop trigger if exists crossfire_forget_crew_secret on public.crossfire_staff_credentials;
create trigger crossfire_forget_crew_secret after delete on public.crossfire_staff_credentials
  for each row execute function public._crossfire_forget_crew_secret();

-- A saved password only means something while the account is crew.
create or replace function public._crossfire_drop_crew_credential() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from public.crossfire_staff_credentials where user_id = new.id;
  return new;
end $$;
revoke all on function public._crossfire_drop_crew_credential() from public, anon, authenticated;
drop trigger if exists crossfire_drop_crew_credential on public.users;
create trigger crossfire_drop_crew_credential after update of role on public.users
  for each row when (new.role not in ('volunteer', 'coordinator') and old.role is distinct from new.role)
  execute function public._crossfire_drop_crew_credential();

-- Encrypts the password in Vault and points the credential row at it. The old
-- secret is removed only after the new one is in place.
create or replace function public._crossfire_store_crew_secret(p_user uuid, p_login text, p_password text, p_actor uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_old uuid; v_new uuid;
begin
  select secret_id into v_old from public.crossfire_staff_credentials where user_id = p_user for update;
  v_new := vault.create_secret(p_password, 'crossfire-crew-login-' || p_user || '-' || replace(gen_random_uuid()::text, '-', ''), 'CrossFire volunteer or coordinator login');
  insert into public.crossfire_staff_credentials(user_id, login_id, secret_id, issued_by) values (p_user, p_login, v_new, p_actor)
    on conflict (user_id) do update set login_id = excluded.login_id, secret_id = excluded.secret_id, issued_by = excluded.issued_by, issued_at = now();
  if v_old is not null then delete from vault.secrets where id = v_old; end if;
end $$;
revoke all on function public._crossfire_store_crew_secret(uuid, text, text, uuid) from public, anon, authenticated;

-- Wrap the installed provisioning function (re-runnable): the original keeps
-- every identity, role and rate-limit check; the wrapper only adds the fixed login.
do $$
begin
  if to_regprocedure('public._crossfire_provision_base(jsonb)') is null then
    alter function public.crossfire_ops_provision(jsonb) rename to _crossfire_provision_base;
  end if;
end $$;
revoke all on function public._crossfire_provision_base(jsonb) from public, anon, authenticated;

create or replace function public.crossfire_ops_provision(p_data jsonb)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id uuid; v_role text := p_data->>'role'; v_password text := p_data->>'password'; v_actor uuid := public._require_role('admin','super_admin'); v_email text;
begin
  v_id := public._crossfire_provision_base(p_data - 'password');
  if v_role in ('volunteer', 'coordinator') then
    -- Raising here rolls back the whole provisioning transaction.
    if char_length(coalesce(v_password, '')) not between 12 and 72 then raise exception 'Enter a password of 12 to 72 characters.'; end if;
    select email into v_email from public.users where id = v_id;
    update public.users set must_change_password = false where id = v_id;
    delete from public.crossfire_temporary_passwords where user_id = v_id;
    perform public._crossfire_store_crew_secret(v_id, v_email, v_password, v_actor);
  end if;
  return v_id;
end $$;

-- Admin-only: the ID and password of one volunteer or coordinator. Each view is logged.
create or replace function public.crossfire_staff_credential(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare c public.crossfire_staff_credentials; u public.users; v_password text;
begin
  perform public._require_role('admin','super_admin');
  select * into u from public.users where id = p_user and role in ('volunteer', 'coordinator');
  if not found then raise exception 'Only volunteer and coordinator logins have a saved password.'; end if;
  select * into c from public.crossfire_staff_credentials where user_id = p_user;
  if found then select decrypted_secret into v_password from vault.decrypted_secrets where id = c.secret_id; end if;
  if v_password is null then raise exception 'No password is saved for this login yet. Set a new password to share.'; end if;
  perform public._audit('staff.credentials.viewed', 'staff', p_user, null, null);
  return jsonb_build_object('login_id', u.email, 'password', v_password, 'issued_at', c.issued_at);
end $$;

-- Called by the provision-staff function before it changes the Auth password, so a
-- failure part-way can never leave an old password on screen as if it were current.
create or replace function public.crossfire_clear_staff_credential(p_user uuid)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform public._require_role('admin','super_admin');
  delete from public.crossfire_staff_credentials where user_id = p_user;
  if found then perform public._audit('staff.credentials.cleared', 'staff', p_user, null, null); end if;
end $$;

-- Called by the provision-staff function after it has changed the Auth password.
create or replace function public.crossfire_save_staff_credential(p_user uuid, p_password text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare v_actor uuid := public._require_role('admin','super_admin'); u public.users;
begin
  if char_length(coalesce(p_password, '')) not between 12 and 72 then raise exception 'Enter a password of 12 to 72 characters.'; end if;
  select * into u from public.users where id = p_user and role in ('volunteer', 'coordinator') for update;
  if not found then raise exception 'Only volunteer and coordinator logins can use a fixed password.'; end if;
  perform public._crossfire_store_crew_secret(p_user, u.email, p_password, v_actor);
  update public.users set must_change_password = false where id = p_user;
  delete from public.crossfire_temporary_passwords where user_id = p_user;
  perform public._crossfire_revoke_sessions(p_user);
  perform public._audit('staff.password.set', 'staff', p_user, null, null);
end $$;

revoke all on function public.crossfire_ops_provision(jsonb), public.crossfire_staff_credential(uuid), public.crossfire_clear_staff_credential(uuid), public.crossfire_save_staff_credential(uuid, text) from public, anon, authenticated;
grant execute on function public.crossfire_ops_provision(jsonb), public.crossfire_staff_credential(uuid), public.crossfire_clear_staff_credential(uuid), public.crossfire_save_staff_credential(uuid, text) to authenticated;
