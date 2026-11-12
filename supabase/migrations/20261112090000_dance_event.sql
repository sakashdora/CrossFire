-- Add one event only. Existing profiles, registrations, passes and event rows are untouched.
-- The all-day bounds identify the event date for operations; no performance time is announced.
-- Empty criteria intentionally prevent judging until organisers supply an approved rubric.
insert into public.events (
  name, slug, event_group, description, event_icon, event_type, team_size,
  max_participants, prize_pool, prize_distribution, scoring_rubric,
  start_time, end_time, registration_deadline, venue_location, status
) values (
  'Dance', 'dance', 'Group A',
  'Solo dance competition. Own the stage at CrossFire 2026. First prize ₹3,000, second prize ₹2,000 and third prize ₹1,000. Performance time, stage and judging criteria will be announced by the organisers.',
  'Music', 'solo', 1,
  100, 6000, '{"1st":3000,"2nd":2000,"3rd":1000}', '{"criteria":[]}',
  '2026-11-15T00:00:00+05:30', '2026-11-15T23:59:59+05:30',
  '2026-11-14T23:59:59+05:30', 'Srusti Campus — stage to be announced', 'open'
)
on conflict (slug) do nothing;

-- 100 is the existing nominal capacity default, not a new hard admission limit:
-- existing registration rules flag overflow for staff review and remain unchanged.
