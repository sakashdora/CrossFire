// Staging proof: a real Supabase Auth identity can stay locked while its student
// has a working gate pass. One command: npm run stage:auth-proof
// Exit codes: 0 all proven; 1 a required case failed or was skipped, a positive
// control failed, or a forbidden session succeeded; 2 configuration missing or the
// target was refused; 3 provider lock and current CrossFire paths proven, but the
// business-rule gap cases (category "gap") failed on the tested target.
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { readStageConfig, REQUIRED, OPTIONAL, compareLedger, STAGE_LOAD_ORDER } from './guard.mjs';
import { openStage, preflight, cleanup } from './context.mjs';
import { runProviderProof } from './provider-lock.mjs';
import { runCrossfirePaths } from './crossfire-paths.mjs';
import { Report, REQUIRED_CASES, categoryOf, safeFailure } from './report.mjs';

const { config, errors } = readStageConfig(process.env);
if (errors.length) {
  console.error('REFUSED: staging configuration');
  for (const error of errors) console.error(' - ' + error);
  console.error(`Required: ${REQUIRED.join(', ')}. Optional: ${OPTIONAL.join(', ')}.`);
  console.error('Provider proof not run.');
  process.exit(2);
}

const report = new Report();
let stage;
try {
  stage = await openStage(config);
  await preflight(stage);
} catch (error) {
  console.error('REFUSED: ' + (error?.safeMessage || 'the stage target could not be validated.'));
  console.error('Provider proof not run. No fixtures were created.');
  if (stage?.created.length) await cleanup(stage).catch(() => {});
  await stage?.db.end().catch(() => {});
  process.exit(2);
}
console.log('Stage versions: ' + Object.entries(stage.versions).map(([key, value]) => `${key}=${value}`).join('; '));
const history = JSON.parse(readFileSync(new URL('../../supabase/deployed-migration-history.json', import.meta.url), 'utf8'));
const files = Object.fromEntries(STAGE_LOAD_ORDER.map(name => [name, readFileSync(new URL('../../supabase/migrations/' + name, import.meta.url))]));
const ledger = compareLedger(history, files);
report.note(`Repository vs deployed ledger: ${ledger.filter(item => item.status === 'match').length} match, ${ledger.filter(item => item.status === 'differs').map(item => item.name).join(', ') || 'none'} differ, ${ledger.filter(item => item.status === 'unrecorded').length} have no recorded production checksum.`);

let cleaned = 'not run';
try {
  await runProviderProof(stage, report);
  await runCrossfirePaths(stage, report);
} catch (error) {
  report.note('Harness stopped early: ' + safeFailure(error));
} finally {
  cleaned = await cleanup(stage).catch(() => 'cleanup incomplete');
  await stage.db.end().catch(() => {});
}
for (const id of REQUIRED_CASES) if (!report.cases.some(item => item.id === id)) report.block(id, categoryOf(id), 'Required case', 'run', 'skipped: not reached');

const decisions = report.decisions();
const exitCode = report.exitCode();
console.log('\n' + report.table());
console.log(`\nProvider lock proven on this version: ${decisions.providerLockProven ? 'YES' : 'NO'}`);
console.log(`CrossFire authorization fully proven: ${decisions.crossfireFullyProven ? 'YES' : 'NO'}`);
console.log(`Fixtures: ${cleaned}. Forbidden session observed: ${report.forbiddenSession ? 'YES' : 'no'}. Exit code ${exitCode}.`);
const folder = new URL('../../artifacts/stage-auth-proof/', import.meta.url);
await mkdir(folder, { recursive: true });
const file = new URL(`${new Date().toISOString().replace(/[:.]/g, '-')}.json`, folder);
await writeFile(file, JSON.stringify({ versions: stage.versions, decisions, exitCode, forbiddenSession: report.forbiddenSession, notes: report.notes, cases: report.cases }, null, 2));
console.log('Evidence (no secrets, ignored by git): artifacts/stage-auth-proof/' + file.pathname.split('/').pop());
process.exit(exitCode);
