-- Keep the deployed action and its grants intact. Only account-linked records
-- require an active volunteer login when a manager edits the roster.
do $migration$
declare
  definition text := pg_get_functiondef('public.crossfire_ops_action(text,jsonb)'::regprocedure);
  original_guard constant text := $guard$if not exists(select 1 from public.users where id=v_vol.user_id and role='volunteer' and active) then raise exception 'Link an active volunteer account before assigning duties.'; end if;$guard$;
  linked_guard constant text := $guard$if v_vol.user_id is not null and not exists(select 1 from public.users where id=v_vol.user_id and role='volunteer' and active) then raise exception 'The linked volunteer account must be active before assigning duties.'; end if;$guard$;
begin
  if strpos(definition, original_guard) > 0 then
    execute replace(definition, original_guard, linked_guard);
  elsif strpos(definition, linked_guard) = 0 then
    raise exception 'Unexpected volunteer assignment guard. Review crossfire_ops_action before applying this migration.';
  end if;
end
$migration$;
