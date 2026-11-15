-- Event-day timetable for Sunday 15 November 2026 (IST). Only start_time and end_time change;
-- registrations, passes and every other event field are untouched. Safe to run twice.
--   10:15 entry          10:30 Quiz (written round) and Dance
--   11:00-12:00 Debate and Poster Making      12:00-13:00 Reels      12:30-14:00 Treasure Hunt
--   14:00-14:30 lunch    14:30-15:15 Ramp Walk    15:15-16:15 Quiz final    16:15-17:15 closing ceremony
-- Quiz is one event with two rounds, so its window runs from the written round (10:30) to the end of the final (16:15).
-- No end time was announced for the Quiz written round or for Dance; Dance is saved as 10:30-11:00 (next slot start).
update public.events e set start_time = v.start_time::timestamptz, end_time = v.end_time::timestamptz
from (values
  ('quiz',          '2026-11-15T10:30:00+05:30', '2026-11-15T16:15:00+05:30'),
  ('dance',         '2026-11-15T10:30:00+05:30', '2026-11-15T11:00:00+05:30'),
  ('debate',        '2026-11-15T11:00:00+05:30', '2026-11-15T12:00:00+05:30'),
  ('poster-making', '2026-11-15T11:00:00+05:30', '2026-11-15T12:00:00+05:30'),
  ('reels',         '2026-11-15T12:00:00+05:30', '2026-11-15T13:00:00+05:30'),
  ('treasure-hunt', '2026-11-15T12:30:00+05:30', '2026-11-15T14:00:00+05:30'),
  ('ramp-walk',     '2026-11-15T14:30:00+05:30', '2026-11-15T15:15:00+05:30')
) as v(slug, start_time, end_time)
where e.slug = v.slug and (e.start_time, e.end_time) is distinct from (v.start_time::timestamptz, v.end_time::timestamptz);
