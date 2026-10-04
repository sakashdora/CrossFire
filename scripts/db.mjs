// Server-only helper: shared Postgres connection using DIRECT_URL from .env.
// Never import this from /src — it reads secrets that must not reach the browser.
import 'dotenv/config';
import pg from 'pg';

export function getClient() {
  const url = process.env.DIRECT_URL;
  if (!url) {
    throw new Error('DIRECT_URL is not set in .env');
  }
  // pg treats sslmode=require as verify-full; strip it and configure TLS explicitly.
  const parsed = new URL(url);
  parsed.searchParams.delete('sslmode');
  return new pg.Client({
    connectionString: parsed.toString(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
}
