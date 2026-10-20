// Server-only helper: shared Postgres connection using DIRECT_URL from .env.
// Never import this from /src — it reads secrets that must not reach the browser.
import 'dotenv/config';
import pg from 'pg';

export function getClient() {
  const url = process.env.DIRECT_URL;
  if (!url) {
    throw new Error('DIRECT_URL is not set in .env');
  }
  // Require a verified TLS chain. A private CA may be supplied via NODE_EXTRA_CA_CERTS.
  const parsed = new URL(url);
  parsed.searchParams.delete('sslmode');
  return new pg.Client({
    connectionString: parsed.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000,
  });
}
