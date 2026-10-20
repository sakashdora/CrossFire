-- Public event discovery must not invoke a private staff-role helper.
drop policy if exists events_select on public.events;
drop policy if exists events_public_select on public.events;
drop policy if exists events_authenticated_select on public.events;
create policy events_public_select on public.events for select to anon using(status<>'draft');
create policy events_authenticated_select on public.events for select to authenticated using(status<>'draft' or public.is_admin());
