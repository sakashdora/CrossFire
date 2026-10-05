import { getClient } from './db.mjs';

const client = getClient();
await client.connect();

const res = await client.query(`
  SELECT tablename, indexname, indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
  ORDER BY tablename, indexname;
`);

console.log('== EXISTING POSTGRESQL INDEXES ==');
res.rows.forEach(r => {
  console.log(`[${r.tablename}] ${r.indexname} -> ${r.indexdef}`);
});

await client.end();
