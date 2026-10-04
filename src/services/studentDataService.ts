import { UserProfile, CourseStream, FoodPreference, SchoolBoard } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface StudentRegistrationRecord {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  whatsapp_number: string;
  institute_name: string;
  city_town: string;
  course_stream: CourseStream;
  board: SchoolBoard;
  food_preference: FoodPreference;
  selected_competitions: string[];
  status: 'registered' | 'confirmed' | 'disqualified';
  parent_consent: boolean;
  terms_accepted: boolean;
  checked_in_at: string | null;
  food_redeemed_at: string | null;
  created_at: string;
}

const STORAGE_KEY = 'crossfire_student_records';
export const REGISTRATION_EVENT_KEY = 'crossfire_registration_updated';

// Realistic initial dataset representing +2 final year students across Odisha colleges
const INITIAL_STUDENTS: StudentRegistrationRecord[] = [
  {
    id: 'CF26-1001',
    first_name: 'Akash',
    last_name: 'Pattnaik',
    email: 'imazureakash@gmail.com',
    contact_number: '+91 9876543210',
    whatsapp_number: '+91 9876543210',
    institute_name: 'DAV Public School, Chandrasekharpur',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Quiz', 'Ramp Walk'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString()
  },
  {
    id: 'CF26-1002',
    first_name: 'Ananya',
    last_name: 'Dash',
    email: 'ananya.dash@gmail.com',
    contact_number: '+91 9437012345',
    whatsapp_number: '+91 9437012345',
    institute_name: "Mother's Public School",
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Debate', 'Poster Making'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
  },
  {
    id: 'CF26-1003',
    first_name: 'Rohan',
    last_name: 'Mohanty',
    email: 'rohan.m@yahoo.com',
    contact_number: '+91 9861234567',
    whatsapp_number: '+91 9861234567',
    institute_name: 'Buxi Jagabandhu English Medium School (BJEM)',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CBSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Quiz', 'Treasure Hunt'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'CF26-1004',
    first_name: 'Debasish',
    last_name: 'Swain',
    email: 'debasish.swain@rediffmail.com',
    contact_number: '+91 7008123456',
    whatsapp_number: '+91 7008123456',
    institute_name: 'Stewart School',
    city_town: 'Cuttack',
    course_stream: '12th Science',
    board: 'ICSE',
    food_preference: 'Veg',
    selected_competitions: ['Debate'],
    status: 'registered',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 18).toISOString()
  },
  {
    id: 'CF26-1005',
    first_name: 'Priyanka',
    last_name: 'Tripathy',
    email: 'priyanka.tripathy@outlook.com',
    contact_number: '+91 9439988776',
    whatsapp_number: '+91 9439988776',
    institute_name: 'KIIT International School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Arts',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Poster Making', 'Reels'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'CF26-1006',
    first_name: 'Siddharth',
    last_name: 'Rout',
    email: 'siddharth.rout@gmail.com',
    contact_number: '+91 8455112233',
    whatsapp_number: '+91 8455112233',
    institute_name: 'BJB Higher Secondary School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CHSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Treasure Hunt'],
    status: 'registered',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  },
  {
    id: 'CF26-1007',
    first_name: 'Tanvi',
    last_name: 'Agarwal',
    email: 'tanvi.agarwal@gmail.com',
    contact_number: '+91 9777654321',
    whatsapp_number: '+91 9777654321',
    institute_name: 'SAI International School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Ramp Walk'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'CF26-1008',
    first_name: 'Ayush',
    last_name: 'Ray',
    email: 'ayush.ray@gmail.com',
    contact_number: '+91 9124567890',
    whatsapp_number: '+91 9124567890',
    institute_name: 'Ravenshaw Higher Secondary School',
    city_town: 'Cuttack',
    course_stream: '12th Science',
    board: 'CHSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Quiz', 'Reels'],
    status: 'registered',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: null,
    food_redeemed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

class StudentDataService {
  private memoryCache: StudentRegistrationRecord[] | null = null;

  // Retrieve all student records from persistent storage
  public getAllStudents(): StudentRegistrationRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Failed to parse stored student records, initializing defaults:', e);
    }

    // Default initialization
    this.memoryCache = [...INITIAL_STUDENTS];
    this.saveStudents(this.memoryCache);
    return this.memoryCache;
  }

  // Save student records
  public saveStudents(records: StudentRegistrationRecord[]): void {
    this.memoryCache = records;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      window.dispatchEvent(new CustomEvent(REGISTRATION_EVENT_KEY, { detail: records }));
    } catch (e) {
      console.error('[CROSSFIRE] Failed to save student records:', e);
    }
  }

  // Find student by email (case-insensitive)
  public findStudentByEmail(email: string): StudentRegistrationRecord | undefined {
    if (!email) return undefined;
    const cleanEmail = email.trim().toLowerCase();
    const students = this.getAllStudents();
    return students.find(s => s.email.toLowerCase() === cleanEmail);
  }

  // Register or update student
  public async registerStudent(formData: {
    first_name: string;
    last_name?: string;
    email: string;
    contact_number: string;
    whatsapp_number?: string;
    institute_name: string;
    city_town: string;
    course_stream: CourseStream;
    board?: SchoolBoard;
    food_preference: FoodPreference;
    selected_competitions: string[];
    parent_consent?: boolean;
    terms_accepted?: boolean;
  }): Promise<{ success: boolean; student: StudentRegistrationRecord; error?: string }> {
    try {
      const students = this.getAllStudents();
      const cleanEmail = formData.email.trim().toLowerCase();
      const existingIndex = students.findIndex(s => s.email.toLowerCase() === cleanEmail);

      let record: StudentRegistrationRecord;

      if (existingIndex >= 0) {
        // Update existing student
        record = {
          ...students[existingIndex],
          first_name: formData.first_name.trim(),
          last_name: (formData.last_name || '').trim(),
          contact_number: formData.contact_number.trim(),
          whatsapp_number: (formData.whatsapp_number || formData.contact_number).trim(),
          institute_name: formData.institute_name.trim(),
          city_town: formData.city_town.trim(),
          course_stream: formData.course_stream,
          board: formData.board || 'CBSE',
          food_preference: formData.food_preference,
          selected_competitions: formData.selected_competitions,
          parent_consent: formData.parent_consent ?? true,
          terms_accepted: formData.terms_accepted ?? true,
        };
        students[existingIndex] = record;
      } else {
        // Create new student
        const passNum = 1000 + students.length + 1;
        record = {
          id: `CF26-${passNum}`,
          first_name: formData.first_name.trim(),
          last_name: (formData.last_name || '').trim(),
          email: cleanEmail,
          contact_number: formData.contact_number.trim(),
          whatsapp_number: (formData.whatsapp_number || formData.contact_number).trim(),
          institute_name: formData.institute_name.trim(),
          city_town: formData.city_town.trim(),
          course_stream: formData.course_stream,
          board: formData.board || 'CBSE',
          food_preference: formData.food_preference,
          selected_competitions: formData.selected_competitions,
          status: 'registered',
          parent_consent: formData.parent_consent ?? true,
          terms_accepted: formData.terms_accepted ?? true,
          checked_in_at: null,
          food_redeemed_at: null,
          created_at: new Date().toISOString()
        };
        students.unshift(record); // Add to beginning of list
      }

      this.saveStudents(students);

      // Async sync with Supabase if online/available
      if (isSupabaseConfigured) {
        this.syncWithSupabase(record).catch(err => {
          console.warn('[CROSSFIRE] Supabase async sync skipped/errored:', err);
        });
      }

      return { success: true, student: record };
    } catch (err: any) {
      return { success: false, student: null as any, error: err.message || 'Registration failed' };
    }
  }

  // Sync to Supabase in background
  private async syncWithSupabase(student: StudentRegistrationRecord): Promise<void> {
    try {
      const slugMap: Record<string, string> = {
        'Quiz': 'quiz',
        'Debate': 'debate',
        'Poster Making': 'poster-making',
        'Treasure Hunt': 'treasure-hunt',
        'Ramp Walk': 'ramp-walk',
        'Reels': 'reels'
      };

      const eventSlugs = student.selected_competitions
        .map(c => slugMap[c] || c.toLowerCase().replace(/[^a-z0-9]/g, '-'))
        .filter(Boolean);

      // Call submit_registration_form RPC if authenticated session exists
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.rpc('submit_registration_form', {
          p_profile: {
            first_name: student.first_name,
            last_name: student.last_name,
            contact_number: student.contact_number,
            whatsapp_number: student.whatsapp_number,
            institute_name: student.institute_name,
            city_town: student.city_town,
            course_stream: student.course_stream,
            board: student.board,
            food_preference: student.food_preference,
            parent_consent: student.parent_consent,
            terms_accepted: student.terms_accepted,
          },
          p_event_slugs: eventSlugs
        });
      }
    } catch (err) {
      console.warn('[CROSSFIRE] Background Supabase sync notice:', err);
    }
  }

  // Update student status (e.g. registered -> confirmed, or check in)
  public updateStudentStatus(id: string, updates: Partial<StudentRegistrationRecord>): boolean {
    const students = this.getAllStudents();
    const index = students.findIndex(s => s.id === id);
    if (index >= 0) {
      students[index] = { ...students[index], ...updates };
      this.saveStudents(students);
      return true;
    }
    return false;
  }

  // Delete student registration
  public deleteStudent(id: string): boolean {
    const students = this.getAllStudents();
    const filtered = students.filter(s => s.id !== id);
    if (filtered.length !== students.length) {
      this.saveStudents(filtered);
      return true;
    }
    return false;
  }

  // Convert student record to UserProfile format for AuthContext
  public toUserProfile(student: StudentRegistrationRecord): UserProfile {
    return {
      id: student.id,
      email: student.email,
      first_name: student.first_name,
      last_name: student.last_name,
      contact_number: student.contact_number,
      whatsapp_number: student.whatsapp_number,
      mobile_number: student.contact_number,
      institute_name: student.institute_name,
      school_name: student.institute_name,
      city_town: student.city_town,
      course_stream: student.course_stream,
      board: student.board,
      food_preference: student.food_preference,
      role: 'student',
      parent_consent: student.parent_consent,
      terms_accepted: student.terms_accepted,
      selected_competitions: student.selected_competitions,
      created_at: student.created_at,
    };
  }

  // Calculate detailed Admin Metrics
  public getMetrics() {
    const students = this.getAllStudents();
    const totalUsers = students.length;
    
    // Total event slots taken
    const totalRegistrations = students.reduce((acc, s) => acc + (s.selected_competitions?.length || 0), 0);
    
    // Today's signups
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRegistrations = students.filter(s => new Date(s.created_at) >= startOfToday).length;

    // Checked-in count
    const checkedInCount = students.filter(s => Boolean(s.checked_in_at)).length;

    // Capacity & Track breakdown
    const eventCapacities: Record<string, { id: string; name: string; capacity: number; group: 'Group A' | 'Group B' }> = {
      'Quiz': { id: 'quiz', name: 'Quiz', capacity: 60, group: 'Group A' },
      'Debate': { id: 'debate', name: 'Debate', capacity: 40, group: 'Group A' },
      'Poster Making': { id: 'poster-making', name: 'Poster Making', capacity: 60, group: 'Group A' },
      'Treasure Hunt': { id: 'treasure-hunt', name: 'Treasure Hunt', capacity: 90, group: 'Group B' },
      'Ramp Walk': { id: 'ramp-walk', name: 'Ramp Walk', capacity: 50, group: 'Group B' },
      'Reels': { id: 'reels', name: 'Reels', capacity: 80, group: 'Group B' },
    };

    const eventCounts: Record<string, number> = {
      'Quiz': 0,
      'Debate': 0,
      'Poster Making': 0,
      'Treasure Hunt': 0,
      'Ramp Walk': 0,
      'Reels': 0,
    };

    students.forEach(s => {
      s.selected_competitions?.forEach(comp => {
        if (eventCounts[comp] !== undefined) {
          eventCounts[comp]++;
        } else {
          // Check substring matches
          Object.keys(eventCounts).forEach(key => {
            if (comp.toLowerCase().includes(key.toLowerCase())) {
              eventCounts[key]++;
            }
          });
        }
      });
    });

    const eventsStats = Object.keys(eventCapacities).map(key => ({
      id: eventCapacities[key].id,
      name: eventCapacities[key].name,
      group: eventCapacities[key].group,
      capacity: eventCapacities[key].capacity,
      registered: eventCounts[key] || 0
    }));

    // Stream distribution
    const streamCounts = {
      '12th Science': students.filter(s => s.course_stream === '12th Science').length,
      '12th Commerce': students.filter(s => s.course_stream === '12th Commerce').length,
      '12th Arts': students.filter(s => s.course_stream === '12th Arts').length,
    };

    return {
      totalUsers,
      totalRegistrations,
      todayRegistrations,
      checkedInCount,
      eventsStats,
      streamCounts,
      recentRegistrations: students.slice(0, 10)
    };
  }

  // Generate clean, standard CSV with CrossFire Logo URL & Metadata Header
  public generateCSV(): string {
    const students = this.getAllStudents();
    const now = new Date();
    const timestampFormatted = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const lines: string[] = [];

    // UTF-8 BOM for flawless Excel opening
    lines.push('\uFEFF');

    // Header metadata block with Logo reference & Time
    lines.push('# ==============================================================================');
    lines.push('# CROSSFIRE 2026 | SRUSTI ACADEMY OF GRADUATE STUDIES (AUTONOMOUS)');
    lines.push('# STATE-LEVEL INTER-COLLEGE TALENT HUNT - OFFICIAL STUDENT ROSTER');
    lines.push(`# EXPORT TIMESTAMP: ${timestampFormatted}`);
    lines.push('# OFFICIAL LOGO: https://crossfire2026.sags.ac.in/Logo.png');
    lines.push('# VENUE: Srusti Campus, Chandrasekharpur, Bhubaneswar, Odisha');
    lines.push(`# TOTAL REGISTERED STUDENTS: ${students.length}`);
    lines.push('# ==============================================================================');
    lines.push('');

    // Column Headers
    const headers = [
      'Registration ID',
      'Registered Date & Time (IST)',
      'Student Name',
      'Email Address',
      'Contact Number',
      'WhatsApp Number',
      'Institute / School Name',
      'City / Town',
      'Course Stream',
      'Education Board',
      'Food Preference',
      'Selected Competitions',
      'Registration Status',
      'Checked-In Status'
    ];
    lines.push(headers.map(h => `"${h}"`).join(','));

    // Student Rows
    students.forEach(s => {
      const regDate = new Date(s.created_at).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      const row = [
        s.id,
        regDate,
        `${s.first_name} ${s.last_name || ''}`.trim(),
        s.email,
        s.contact_number,
        s.whatsapp_number || s.contact_number,
        s.institute_name,
        s.city_town,
        s.course_stream,
        s.board || 'CBSE',
        s.food_preference,
        s.selected_competitions.join(' & '),
        s.status.toUpperCase(),
        s.checked_in_at ? 'CHECKED-IN' : 'PENDING'
      ];
      lines.push(row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','));
    });

    return lines.join('\r\n');
  }

  // Trigger CSV download directly in browser
  public downloadCSV(): void {
    const csvContent = this.generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.setAttribute('download', `CrossFire_2026_Official_Student_Roster_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Print/Save Official Branded Report with CrossFire Logo & Header
  public printOfficialReportWithLogo(): void {
    const students = this.getAllStudents();
    const metrics = this.getMetrics();
    const now = new Date();
    const timestampFormatted = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const reportWindow = window.open('', '_blank', 'width=1200,height=850');
    if (!reportWindow) {
      alert('Pop-up was blocked. Please allow pop-ups for this website to view the printable roster.');
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CROSSFIRE 2026 | Official Master Registration Directory</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      padding: 16px;
      font-size: 11px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid #ff5722;
      padding-bottom: 14px;
      margin-bottom: 14px;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-logo {
      width: 72px;
      height: 72px;
      object-fit: contain;
    }
    .org-title {
      font-size: 13px;
      font-weight: 800;
      color: #0a192f;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .event-title {
      font-size: 22px;
      font-weight: 900;
      color: #ff5722;
      letter-spacing: 1px;
      margin: 2px 0;
    }
    .event-subtitle {
      font-size: 11px;
      color: #475569;
      font-weight: 600;
    }
    .header-meta {
      text-align: right;
      font-size: 10px;
      color: #475569;
      line-height: 1.5;
    }
    .meta-badge {
      display: inline-block;
      background: #ff5722;
      color: #fff;
      font-weight: bold;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 10px;
      margin-bottom: 4px;
    }
    .kpi-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 14px;
    }
    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      border-radius: 8px;
      text-align: center;
    }
    .kpi-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
    .kpi-value { font-size: 16px; font-weight: 900; color: #0a192f; margin-top: 2px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin-top: 6px;
    }
    th {
      background: #0a192f;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 6px 8px;
      border-bottom: 1px solid #e2e8f0;
      vertical-align: middle;
    }
    tr:nth-child(even) { background-color: #f8fafc; }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .badge-event {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
      margin-right: 4px;
      margin-bottom: 2px;
    }
    .badge-confirmed {
      background: #ecfdf5;
      color: #047857;
      border: 1px solid #a7f3d0;
    }
    .badge-registered {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }
    .footer-signatures {
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      padding-top: 14px;
      border-top: 1px dashed #cbd5e1;
    }
    .signature-block {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-bottom: 1px solid #0f172a;
      height: 24px;
      margin-bottom: 4px;
    }
    .signature-title {
      font-size: 9.5px;
      font-weight: 700;
      color: #0a192f;
    }
    .signature-desc {
      font-size: 8.5px;
      color: #64748b;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #fffbeb; border: 1px solid #fef08a; padding: 10px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 11px; color: #854d0e; font-weight: bold;">
      Official CrossFire 2026 Student Roster Document. Ready to Save as PDF or Print.
    </span>
    <button onclick="window.print()" style="background: #ff5722; color: #fff; border: none; padding: 6px 14px; font-weight: bold; border-radius: 6px; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <div class="header">
    <div class="header-left">
      <img src="${window.location.origin}/Logo.png" alt="Crossfire Logo" class="header-logo" onerror="this.src='/Logo.png'" />
      <div>
        <div class="org-title">Srusti Academy of Graduate Studies (Autonomous)</div>
        <div class="event-title">CROSSFIRE 2026</div>
        <div class="event-subtitle">State-Level Inter-College Talent Hunt | Master Registration Directory</div>
      </div>
    </div>
    <div class="header-meta">
      <span class="meta-badge">OFFICIAL VERIFIED ROSTER</span><br>
      <strong>Generated:</strong> ${timestampFormatted}<br>
      <strong>Event Date:</strong> November 15, 2026 | 09:30 AM<br>
      <strong>Venue:</strong> Srusti Campus, Chandrasekharpur, Bhubaneswar
    </div>
  </div>

  <div class="kpi-strip">
    <div class="kpi-card">
      <div class="kpi-label">Total Registered Students</div>
      <div class="kpi-value">${metrics.totalUsers}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Total Competition Slots</div>
      <div class="kpi-value">${metrics.totalRegistrations}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Science / Commerce / Arts</div>
      <div class="kpi-value" style="font-size: 12px; margin-top: 4px;">
        ${metrics.streamCounts['12th Science']} / ${metrics.streamCounts['12th Commerce']} / ${metrics.streamCounts['12th Arts']}
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Active Competitions</div>
      <div class="kpi-value">6 Tracks</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 75px;">Pass ID</th>
        <th>Student Name</th>
        <th>Contact & WhatsApp</th>
        <th>Institute / School</th>
        <th>City</th>
        <th>Stream</th>
        <th>Registered Competitions</th>
        <th>Food</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${students.map(s => `
        <tr>
          <td style="font-weight: 800; color: #0a192f;">${s.id}</td>
          <td>
            <strong>${s.first_name} ${s.last_name || ''}</strong><br>
            <span style="color: #64748b; font-size: 9px;">${s.email}</span>
          </td>
          <td>
            ${s.contact_number}<br>
            <span style="color: #16a34a; font-size: 9px;">WA: ${s.whatsapp_number || s.contact_number}</span>
          </td>
          <td>${s.institute_name}</td>
          <td>${s.city_town}</td>
          <td>${s.course_stream} (${s.board || 'CBSE'})</td>
          <td>
            ${s.selected_competitions.map(c => `<span class="badge badge-event">${c}</span>`).join('')}
          </td>
          <td>${s.food_preference}</td>
          <td>
            <span class="badge ${s.status === 'confirmed' ? 'badge-confirmed' : 'badge-registered'}">
              ${s.status}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer-signatures">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-title">Mr. N.R. Swain</div>
      <div class="signature-desc">Event Coordinator (SAGS)</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-title">Mr. A. Meher</div>
      <div class="signature-desc">Co-coordinator (SAGS)</div>
    </div>
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-title">Prof. (Dr.) Principal</div>
      <div class="signature-desc">Srusti Academy of Graduate Studies</div>
    </div>
  </div>
</body>
</html>
    `;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  }
}

export const studentDataService = new StudentDataService();
