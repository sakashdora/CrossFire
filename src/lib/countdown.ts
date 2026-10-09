export const CROSSFIRE_START = '2026-11-15T09:30:00+05:30';

/** Calculate from the clock each time so sleeping tabs never accumulate drift. */
export function getCountdown(targetDate: string, now = Date.now()) {
  const target = Date.parse(targetDate);
  const valid = Number.isFinite(target) && Number.isFinite(now);
  const total = valid ? Math.max(0, Math.floor((target - now) / 1000)) : 0;
  return {
    values: [Math.floor(total / 86400), Math.floor(total / 3600) % 24, Math.floor(total / 60) % 60, total % 60],
    status: !valid ? 'unavailable' : now >= target ? 'started' : 'upcoming',
  };
}
