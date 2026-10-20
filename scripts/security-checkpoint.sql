begin read only;
select jsonb_build_object(
  'captured_at', now(),
  'grants',(select jsonb_agg(to_jsonb(g)) from information_schema.table_privileges g where table_schema='public' and table_name=any(array['users','registrations','scores','judge_assignments','events','volunteers','guests','incidents','audit_logs','notifications','system_settings','students_view','admins_view','staff_view'])),
  'policies',(select jsonb_agg(to_jsonb(p)) from pg_policies p where schemaname='public' and tablename=any(array['users','registrations','scores','judge_assignments','events','volunteers','guests','incidents','audit_logs','notifications','system_settings'])),
  'functions',(select jsonb_agg(jsonb_build_object('signature',p.oid::regprocedure::text,'definition',pg_get_functiondef(p.oid),'acl',p.proacl)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and (p.proname like 'crossfire_%' or p.proname in ('current_user_role','_require_role','ensure_profile','submit_registration_form','submit_score','get_leaderboard','get_system_setting','is_staff','is_admin','is_super_admin','is_ops_staff','registrations_before_insert','registrations_sync_participants','_sync_student_events','verify_volunteer_login','admin_delete_student','admin_delete_guest','admin_delete_volunteer')))
) as checkpoint;
commit;
