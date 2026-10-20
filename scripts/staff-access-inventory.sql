-- Read only. Export only CrossFire admin identity fields, never passwords/hashes.
begin read only;
select u.role,u.email,u.id as auth_user_id,u.active,(a.email_confirmed_at is not null) as email_confirmed
from public.users u join auth.users a on a.id=u.id
where u.role in ('admin','super_admin') order by u.role,u.id;
commit;
