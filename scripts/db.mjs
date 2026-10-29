// Server-only helper: shared Postgres connection using DIRECT_URL from .env.
// Never import this from /src — it reads secrets that must not reach the browser.
import 'dotenv/config';
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const caPath = path.resolve(__dirname, '..', 'certs', 'supabase-ca.pem');

export function getClient() {
  const url = process.env.DIRECT_URL;
  if (!url) {
    throw new Error('DIRECT_URL is not set in .env');
  }
  // Require a verified TLS chain. A private CA may be supplied via NODE_EXTRA_CA_CERTS or certs/supabase-ca.pem.
  const parsed = new URL(url);
  parsed.searchParams.delete('sslmode');
  const sslOptions = { rejectUnauthorized: true };
  if (fs.existsSync(caPath)) {
    sslOptions.ca = fs.readFileSync(caPath, 'utf8');
  }
  return new pg.Client({
    connectionString: parsed.toString(),
    ssl: sslOptions,
    connectionTimeoutMillis: 15000,
  });
}
