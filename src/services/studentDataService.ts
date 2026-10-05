import { UserProfile, CourseStream, FoodPreference, SchoolBoard, LeaderboardEntry } from '../types';
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
  date_of_birth?: string;
  food_preference: FoodPreference;
  selected_competitions: string[];
  status: 'registered' | 'confirmed' | 'disqualified';
  parent_consent: boolean;
  terms_accepted: boolean;
  checked_in_at: string | null;
  food_redeemed_at: string | null;
  media_urls?: Record<string, string>; // slug -> url
  scores?: Record<string, { total: number; rubric: Record<string, number>; comments?: string; locked: boolean }>; // slug -> score details
  room_reported?: Record<string, boolean>; // slug -> boolean
  created_at: string;
}

const STORAGE_KEY = 'crossfire_student_records';
export const REGISTRATION_EVENT_KEY = 'crossfire_registration_updated';

// Default initial registered delegates representing Odisha +2 colleges
const INITIAL_STUDENTS: StudentRegistrationRecord[] = [
  {
    id: 'CF26-1001',
    first_name: 'Akash',
    last_name: 'Pattnaik',
    email: 'akash.pattnaik@gmail.com',
    contact_number: '+91 9876543210',
    whatsapp_number: '+91 9876543210',
    institute_name: 'DAV Public School, Chandrasekharpur',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Quiz', 'Reels'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T08:45:00+05:30',
    food_redeemed_at: null,
    media_urls: { 'reels': 'https://youtube.com/shorts/srusti-crossfire-cinematic' },
    scores: {
      'quiz': { total: 88, rubric: { 'Accuracy': 36, 'Speed': 26, 'Final Round Answers': 26 }, comments: 'Great performance in buzzer round', locked: true }
    },
    room_reported: { 'quiz': true, 'reels': true },
    created_at: '2026-10-01T10:00:00+05:30'
  },
  {
    id: 'CF26-1002',
    first_name: 'Rohan',
    last_name: 'Mohanty',
    email: 'rohan.mohanty@yahoo.com',
    contact_number: '+91 9876543211',
    whatsapp_number: '+91 9876543211',
    institute_name: 'Buxi Jagabandhu English Medium School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CBSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Quiz', 'Treasure Hunt'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T08:52:00+05:30',
    food_redeemed_at: '2026-11-15T13:15:00+05:30',
    scores: {
      'quiz': { total: 92, rubric: { 'Accuracy': 38, 'Speed': 28, 'Final Round Answers': 26 }, comments: 'Excellent buzzer reflex during Round 3 bonus question.', locked: true },
      'treasure-hunt': { total: 96.5, rubric: { 'Speed (Checkpoint Finish)': 48, 'Accuracy (Clues & Riddles)': 48.5, 'Bonus Checkpoint Points': 0 }, locked: true }
    },
    room_reported: { 'quiz': true, 'treasure-hunt': true },
    created_at: '2026-10-02T11:15:00+05:30'
  },
  {
    id: 'CF26-1003',
    first_name: 'Ananya',
    last_name: 'Dash',
    email: 'ananya.dash@gmail.com',
    contact_number: '+91 9876543212',
    whatsapp_number: '+91 9876543212',
    institute_name: 'Mothers Public School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Ramp Walk', 'Debate'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T09:05:00+05:30',
    food_redeemed_at: '2026-11-15T13:20:00+05:30',
    scores: {
      'ramp-walk': { total: 91, rubric: { 'Appearance & Confidence': 28, 'Stage Presence': 28, 'Personality & Expression': 35 }, comments: 'Outstanding poise and confidence.', locked: true },
      'debate': { total: 93, rubric: { 'Argumentation & Logic': 38, 'Clarity & Expression': 28, 'Rebuttal Strength': 27 }, comments: 'Brilliant logical presentation on economic globalization.', locked: true }
    },
    room_reported: { 'ramp-walk': true, 'debate': true },
    created_at: '2026-10-02T14:30:00+05:30'
  },
  {
    id: 'CF26-1004',
    first_name: 'Debasish',
    last_name: 'Swain',
    email: 'debasish.swain@rediffmail.com',
    contact_number: '+91 9876543213',
    whatsapp_number: '+91 9876543213',
    institute_name: 'Stewart School, Cuttack',
    city_town: 'Cuttack',
    course_stream: '12th Arts',
    board: 'ICSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Debate', 'Poster Making'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T09:10:00+05:30',
    food_redeemed_at: null,
    scores: {
      'debate': { total: 86, rubric: { 'Argumentation & Logic': 34, 'Clarity & Expression': 26, 'Rebuttal Strength': 26 }, comments: 'Good argumentation framework.', locked: true },
      'poster-making': { total: 89, rubric: { 'Design & Aesthetics': 31, 'Message Clarity': 31, 'Creativity & Innovation': 27 }, locked: true }
    },
    room_reported: { 'debate': true, 'poster-making': true },
    created_at: '2026-10-03T09:20:00+05:30'
  },
  {
    id: 'CF26-1005',
    first_name: 'Tanvi',
    last_name: 'Agarwal',
    email: 'tanvi.agarwal@gmail.com',
    contact_number: '+91 9876543214',
    whatsapp_number: '+91 9876543214',
    institute_name: 'SAI International School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Commerce',
    board: 'CBSE',
    food_preference: 'Veg',
    selected_competitions: ['Poster Making', 'Debate'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T09:12:00+05:30',
    food_redeemed_at: null,
    media_urls: { 'poster-making': 'https://drive.google.com/file/d/poster-digital-artwork-srusti' },
    scores: {
      'poster-making': { total: 91.5, rubric: { 'Design & Aesthetics': 33, 'Message Clarity': 32.5, 'Creativity & Innovation': 26 }, comments: 'Superb color blending and creative tagline.', locked: true }
    },
    room_reported: { 'poster-making': true, 'debate': true },
    created_at: '2026-10-03T16:40:00+05:30'
  },
  {
    id: 'CF26-1006',
    first_name: 'Siddharth',
    last_name: 'Rout',
    email: 'siddharth.rout@gmail.com',
    contact_number: '+91 9876543215',
    whatsapp_number: '+91 9876543215',
    institute_name: 'BJB Higher Secondary School',
    city_town: 'Bhubaneswar',
    course_stream: '12th Science',
    board: 'CHSE',
    food_preference: 'Non-veg',
    selected_competitions: ['Treasure Hunt'],
    status: 'confirmed',
    parent_consent: true,
    terms_accepted: true,
    checked_in_at: '2026-11-15T09:15:00+05:30',
    food_redeemed_at: null,
    scores: {
      'treasure-hunt': { total: 94, rubric: { 'Speed (Checkpoint Finish)': 47, 'Accuracy (Clues & Riddles)': 47, 'Bonus Checkpoint Points': 0 }, locked: true }
    },
    room_reported: { 'treasure-hunt': true },
    created_at: '2026-10-04T12:00:00+05:30'
  }
];

class StudentDataService {
  // Retrieve all student records from persistent storage
  public getAllStudents(): StudentRegistrationRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Failed to parse stored student records:', e);
    }

    // Initialize with standard roster if empty
    this.saveStudents(INITIAL_STUDENTS);
    return INITIAL_STUDENTS;
  }

  // Save student records and broadcast update event
  public saveStudents(records: StudentRegistrationRecord[]): void {
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

  // Find student by ID, contact number or email
  public findStudentByIdOrContact(query: string): StudentRegistrationRecord | undefined {
    if (!query) return undefined;
    const cleanQuery = query.trim().toLowerCase();
    const cleanPhone = query.replace(/\D/g, '');
    const students = this.getAllStudents();
    return students.find(s => 
      s.id.toLowerCase() === cleanQuery ||
      s.email.toLowerCase() === cleanQuery ||
      (cleanPhone.length >= 7 && (s.contact_number.replace(/\D/g, '').includes(cleanPhone) || s.whatsapp_number.replace(/\D/g, '').includes(cleanPhone))) ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(cleanQuery)
    );
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
    date_of_birth?: string;
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
          date_of_birth: formData.date_of_birth || students[existingIndex].date_of_birth,
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
          date_of_birth: formData.date_of_birth,
          food_preference: formData.food_preference,
          selected_competitions: formData.selected_competitions,
          status: 'registered',
          parent_consent: formData.parent_consent ?? true,
          terms_accepted: formData.terms_accepted ?? true,
          checked_in_at: null,
          food_redeemed_at: null,
          created_at: new Date().toISOString()
        };
        students.unshift(record);
      }

      this.saveStudents(students);

      // Async sync with Supabase if online
      if (isSupabaseConfigured) {
        this.syncWithSupabase(record).catch(err => {
          console.warn('[CROSSFIRE] Supabase async sync note:', err);
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
      console.warn('[CROSSFIRE] Supabase RPC sync notice:', err);
    }
  }

  // Update student status
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

  // Record candidate score submitted by Judge
  public recordScore(
    studentId: string, 
    eventSlug: string, 
    rubricScores: Record<string, number>, 
    totalScore: number, 
    comments?: string
  ): boolean {
    const students = this.getAllStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index >= 0) {
      const currentScores = students[index].scores || {};
      students[index].scores = {
        ...currentScores,
        [eventSlug]: {
          total: totalScore,
          rubric: rubricScores,
          comments: comments || '',
          locked: true
        }
      };
      this.saveStudents(students);
      return true;
    }
    return false;
  }

  // Unlock score for revision (Admin action)
  public unlockScore(studentId: string, eventSlug: string): boolean {
    const students = this.getAllStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index >= 0 && students[index].scores?.[eventSlug]) {
      students[index].scores![eventSlug].locked = false;
      this.saveStudents(students);
      return true;
    }
    return false;
  }

  // Save student media URL (Reels / Poster Making)
  public saveMediaUrl(studentId: string, eventSlug: string, url: string): boolean {
    const students = this.getAllStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index >= 0) {
      students[index].media_urls = {
        ...(students[index].media_urls || {}),
        [eventSlug]: url
      };
      this.saveStudents(students);
      return true;
    }
    return false;
  }

  // Mark room reported status
  public setRoomReported(studentId: string, eventSlug: string, reported: boolean): boolean {
    const students = this.getAllStudents();
    const index = students.findIndex(s => s.id === studentId);
    if (index >= 0) {
      students[index].room_reported = {
        ...(students[index].room_reported || {}),
        [eventSlug]: reported
      };
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

  // Get Leaderboard computed from all scored student registrations
  public getComputedLeaderboard(): LeaderboardEntry[] {
    const students = this.getAllStudents();
    const entries: LeaderboardEntry[] = [];

    students.forEach(s => {
      const scores = s.scores || {};
      const scoreValues = Object.values(scores).filter(sc => typeof sc.total === 'number');
      if (scoreValues.length > 0) {
        const totalScore = scoreValues.reduce((sum, sc) => sum + sc.total, 0);
        entries.push({
          rank: 0,
          user_id: s.id,
          participant_name: `${s.first_name} ${s.last_name || ''}`.trim(),
          school_name: s.institute_name,
          board: s.board,
          events_count: scoreValues.length,
          total_score: Math.round(totalScore * 10) / 10,
          trend: 'same'
        });
      }
    });

    entries.sort((a, b) => b.total_score - a.total_score);
    return entries.map((entry, idx) => ({ ...entry, rank: idx + 1 }));
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
      date_of_birth: student.date_of_birth,
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
    const totalRegistrations = students.reduce((acc, s) => acc + (s.selected_competitions?.length || 0), 0);
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayRegistrations = students.filter(s => new Date(s.created_at) >= startOfToday).length;
    const checkedInCount = students.filter(s => Boolean(s.checked_in_at)).length;
    const foodRedeemedCount = students.filter(s => Boolean(s.food_redeemed_at)).length;

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
      foodRedeemedCount,
      eventsStats,
      streamCounts,
      recentRegistrations: students.slice(0, 10)
    };
  }

  // Generate clean standard CSV with CrossFire Metadata Header
  public generateCSV(): string {
    const students = this.getAllStudents();
    const now = new Date();
    const timestampFormatted = now.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'full',
      timeStyle: 'medium'
    });

    const lines: string[] = [];
    lines.push('\uFEFF'); // UTF-8 BOM
    lines.push('# ==============================================================================');
    lines.push('# CROSSFIRE 2026 | SRUSTI ACADEMY OF GRADUATE STUDIES (AUTONOMOUS)');
    lines.push('# STATE-LEVEL INTER-COLLEGE TALENT HUNT - OFFICIAL STUDENT ROSTER');
    lines.push(`# EXPORT TIMESTAMP: ${timestampFormatted}`);
    lines.push('# OFFICIAL LOGO: https://crossfire2026.sags.ac.in/Logo.png');
    lines.push('# VENUE: Srusti Campus, Chandrasekharpur, Bhubaneswar, Odisha');
    lines.push(`# TOTAL REGISTERED STUDENTS: ${students.length}`);
    lines.push('# ==============================================================================');
    lines.push('');

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
      'Gate Checked-In',
      'Meal Redeemed'
    ];
    lines.push(headers.map(h => `"${h}"`).join(','));

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
        s.checked_in_at ? 'YES' : 'NO',
        s.food_redeemed_at ? 'YES' : 'NO'
      ];
      lines.push(row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','));
    });

    return lines.join('\r\n');
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

  // Trigger CSV download
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
}

export const studentDataService = new StudentDataService();
