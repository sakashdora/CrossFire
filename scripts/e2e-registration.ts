// Runs the REAL studentDataService.registerStudent against the live project (via vite-node so import.meta.env works).
// Browser globals are shimmed. Never prints secrets.
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
};
(globalThis as any).window = { dispatchEvent: () => true, addEventListener() {}, removeEventListener() {} };
(globalThis as any).CustomEvent = class { constructor(public type: string, public init?: any) {} };

const { studentDataService } = await import('../src/services/studentDataService');
const { isSupabaseConfigured } = await import('../src/lib/supabase');
console.log('isSupabaseConfigured:', isSupabaseConfigured);

// getAllStudents() purges storage the first time; trigger it so our record survives.
studentDataService.getAllStudents();

const email = `cf_e2e_${Date.now()}@example.com`;
const base = {
  first_name: 'E2E', last_name: 'Probe', email, contact_number: '9876543210', whatsapp_number: '9876543210',
  institute_name: 'Probe School', city_town: 'Bhubaneswar', course_stream: '12th Science' as const,
  board: 'CBSE' as const, food_preference: 'Veg' as const, selected_competitions: ['Quiz', 'Debate'],
  parent_consent: true, terms_accepted: true,
};

const r1 = await studentDataService.registerStudent(base);
console.log('REG #1 ->', { success: r1.success, error: r1.error, id: r1.student?.id });
console.log('local cache has record:', !!studentDataService.findStudentByEmail(email));

const r2 = await studentDataService.registerStudent(base);
console.log('REG #2 (same email, same browser/id) ->', { success: r2.success, error: r2.error });

const r3 = await studentDataService.registerStudent({ ...base, email: 'not-an-email' });
console.log('REG #3 (invalid email) ->', { success: r3.success, error: r3.error });

// Existing email from a different "browser" (empty local store => different generated credential)
store.clear(); studentDataService.getAllStudents();
const r4 = await studentDataService.registerStudent({ ...base });
console.log('REG #4 (same email, other browser) ->', { success: r4.success, error: r4.error });
console.log('EMAIL=' + email);
