-- Only announcements explicitly published to the homepage enter this feed.
create table if not exists public.crossfire_homepage_announcements (
  id uuid primary key,
  sequence bigint generated always as identity unique,
  title text not null check (char_length(title) between 1 and 150),
  message text not null check (char_length(message) between 1 and 2000),
  published_at timestamptz not null default now()
);
alter table public.crossfire_homepage_announcements enable row level security;
revoke all on public.crossfire_homepage_announcements from public, anon, authenticated;
grant select on public.crossfire_homepage_announcements to anon, authenticated;
drop policy if exists homepage_announcements_read on public.crossfire_homepage_announcements;
create policy homepage_announcements_read on public.crossfire_homepage_announcements
  for select to anon, authenticated using (true);

create or replace function public.crossfire_publish_homepage_announcement(p_id uuid, p_title text, p_message text)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_title text := btrim(coalesce(p_title, ''));
  v_message text := btrim(coalesce(p_message, ''));
begin
  perform public._require_role('admin', 'super_admin');
  if p_id is null or char_length(v_title) not between 1 and 150 or char_length(v_message) not between 1 and 2000 then
    raise exception 'Enter a title (1–150 characters) and a message (1–2000 characters).';
  end if;
  insert into public.crossfire_homepage_announcements(id, title, message) values(p_id, v_title, v_message)
    on conflict (id) do nothing;
  if found then
    perform public._audit('announcement.published', 'homepage_announcement', p_id, null, jsonb_build_object('title',v_title));
  elsif not exists(select 1 from public.crossfire_homepage_announcements where id=p_id and title=v_title and message=v_message) then
    raise exception 'This announcement was already published. Compose a new announcement to send different text.';
  end if;
end $$;
revoke all on function public.crossfire_publish_homepage_announcement(uuid,text,text) from public, anon, authenticated;
grant execute on function public.crossfire_publish_homepage_announcement(uuid,text,text) to authenticated;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime' and not puballtables)
    and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime'
      and schemaname='public' and tablename='crossfire_homepage_announcements') then
    alter publication supabase_realtime add table public.crossfire_homepage_announcements;
  end if;
end $$;
