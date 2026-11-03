// Case ledger for the staging proof. Prints case names and outcomes only.
// Categories: control (positive controls), provider (Auth lock), crossfire
// (CrossFire data paths), gap (the two authorization regressions required at cutover).
export const REQUIRED_CASES = ['A-C1', 'A-C2', 'A-C3', 'A-L0', 'A-L1', 'A-L2', 'A-L3', 'A-L4', 'A-L5', 'A-L6', 'A-L7', 'A-L8', 'A-L9',
  'B-D1', 'B-D2', 'B-D3', 'B-S1', 'B-S2', 'B-R1', 'B-R2', 'B-R3', 'B-G1', 'B-G2', 'B-G3', 'B-M1', 'B-X1', 'B-P1', 'B-X2', 'B-S3'];
export const categoryOf = id => id.startsWith('A-C') ? 'control' : id.startsWith('A-') ? 'provider' : id.startsWith('B-X') ? 'gap' : 'crossfire';
// Where an unexpected error was thrown, without its message (which may echo data).
const location = error => (String(error?.stack || '').match(/scripts[\\/]stage[\\/][\w-]+\.mjs:\d+/) || ['unknown location'])[0].replace(/\\/g, '/');
export const safeFailure = error => error?.safeMessage || `${error?.name || 'Error'} at ${location(error)}`;

export class Report {
  constructor() { this.cases = []; this.forbiddenSession = false; this.notes = []; }
  record(id, category, name, expected, observed, status) {
    if (!['pass', 'fail', 'blocked'].includes(status)) throw new Error('Unknown status');
    this.cases.push({ id, category, name, expected, observed, status });
    console.log(`${status.toUpperCase().padEnd(7)} ${id} ${name} :: ${observed}`);
  }
  // Runs one case; an exception means the case could not be evaluated.
  async run(id, category, name, expected, fn) {
    try {
      const { observed, ok, blocked = false } = await fn();
      this.record(id, category, name, expected, observed, blocked ? 'blocked' : ok ? 'pass' : 'fail');
    } catch (error) {
      this.record(id, category, name, expected, 'harness error: ' + safeFailure(error), 'blocked');
    }
  }
  block(id, category, name, expected, reason) { this.record(id, category, name, expected, reason, 'blocked'); }
  forbidden() { this.forbiddenSession = true; }
  note(text) { this.notes.push(text); console.log('NOTE    ' + text); }
  of(category) { return this.cases.filter(item => item.category === category); }
  allPass(categories) { const items = this.cases.filter(item => categories.includes(item.category)); return items.length > 0 && items.every(item => item.status === 'pass'); }

  decisions() {
    const providerLockProven = !this.forbiddenSession && this.allPass(['control', 'provider']);
    const crossfireFullyProven = providerLockProven && this.allPass(['crossfire', 'gap']);
    return { providerLockProven, crossfireFullyProven };
  }
  // 0 everything proven; 1 a required case failed, was blocked or a forbidden session
  // succeeded; 3 controls, provider and current CrossFire paths pass but business-rule
  // gaps remain. (2 is reserved for refused or missing configuration.)
  exitCode() {
    if (this.forbiddenSession) return 1;
    if (this.cases.some(item => item.category !== 'gap' && item.status !== 'pass')) return 1;
    if (this.of('gap').some(item => item.status === 'blocked')) return 1;
    return this.of('gap').every(item => item.status === 'pass') ? 0 : 3;
  }
  table() {
    const rows = this.cases.map(item => `| ${item.id} | ${item.category} | ${item.name} | ${item.expected} | ${item.observed} | ${item.status} |`);
    return ['| Case | Category | Name | Expected | Observed | Status |', '| --- | --- | --- | --- | --- | --- |', ...rows].join('\n');
  }
}

// Thrown by the harness with a message that is safe to print.
export class StageError extends Error {
  constructor(safeMessage) { super(safeMessage); this.safeMessage = safeMessage; }
}
