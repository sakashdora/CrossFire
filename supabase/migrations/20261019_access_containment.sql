-- Close legacy browser entry points before activating the new production workflows.
-- No records are deleted and no unrelated application objects are changed.
do $$ declare object_name text; routine record; begin
  foreach object_name in array array['students_view','admins_view','staff_view'] loop
    if to_regclass('public.' || object_name) is not null then
      execute format('revoke all on public.%I from public, anon, authenticated', object_name);
    end if;
  end loop;
  for routine in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
    and p.proname=any(array['verify_volunteer_login','admin_upsert_volunteer','admin_delete_volunteer',
      'admin_upsert_guest','admin_delete_guest','admin_delete_student','admin_set_user_role']) loop
    execute format('revoke all on function %s from public, anon, authenticated',routine.signature);
  end loop;
end $$;

-- A client-controlled app label must never count as email verification.
-- Keep the trigger signature for compatibility; Supabase Auth owns confirmation.
create or replace function public.crossfire_auto_confirm_user()
returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin return new; end $$;
revoke all on function public.crossfire_auto_confirm_user() from public,anon,authenticated;
