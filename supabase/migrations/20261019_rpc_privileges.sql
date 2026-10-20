-- This helper is used by authenticated policies only, not the public API.
revoke execute on function public.is_super_admin() from public,anon;
grant execute on function public.is_super_admin() to authenticated;
