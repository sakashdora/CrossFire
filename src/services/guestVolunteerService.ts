import { GuestItem, VolunteerItem, GuestStatus, VolunteerAttendance } from '../types';

const GUESTS_STORAGE_KEY = 'crossfire_guests_records';
const VOLUNTEERS_STORAGE_KEY = 'crossfire_volunteers_records';

export const GUEST_UPDATED_EVENT = 'crossfire_guests_updated';
export const VOLUNTEER_UPDATED_EVENT = 'crossfire_volunteers_updated';

// Default official guests for CROSSFIRE 2026
const DEFAULT_GUESTS: GuestItem[] = [
  {
    id: 'gst-1',
    name: 'Prof. (Dr.) Saroj Kanta Choudhury',
    designation: 'Vice Chancellor / Chief Patron',
    organization: 'Utkal University of Culture, Odisha',
    category: 'Chief Guest',
    contact_number: '+91 9437012345',
    email: 'vc@uuc.ac.in',
    status: 'Confirmed',
    escort_volunteer: 'Subhashree Mohapatra (Lead)',
    arrival_time: '09:30 AM',
    vehicle_number: 'OD 02 AA 1001',
    dietary_preference: 'Veg',
    notes: 'Presiding over Inaugural Address & Trophy Presentation.',
    created_at: new Date().toISOString()
  },
  {
    id: 'gst-2',
    name: 'Sri Soumya Ranjan Patnaik',
    designation: 'Editor-in-Chief & Media Patron',
    organization: 'Sambad & Kanak News Network',
    category: 'Guest of Honour',
    contact_number: '+91 9861054321',
    email: 'editorial@sambad.in',
    status: 'Confirmed',
    escort_volunteer: 'Rudra Narayan Samal',
    arrival_time: '10:00 AM',
    vehicle_number: 'OD 02 BF 8800',
    dietary_preference: 'Veg',
    notes: 'Chief Speaker for Media & Youth Empowerment Session.',
    created_at: new Date().toISOString()
  },
  {
    id: 'gst-3',
    name: 'Dr. Meera Senapati',
    designation: 'Dean of Humanities & Academician',
    organization: 'BJB Autonomous College',
    category: 'Judge',
    contact_number: '+91 9823456789',
    email: 'judge@srusti.edu.in',
    status: 'Arrived',
    escort_volunteer: 'Pooja Mohanty',
    arrival_time: '09:00 AM',
    vehicle_number: 'OD 33 C 4521',
    dietary_preference: 'Veg',
    notes: 'Head Jury for State Debate & Ramp Walk Competitions.',
    created_at: new Date().toISOString()
  },
  {
    id: 'gst-4',
    name: 'Mr. Bibhuti Bhusan Pradhan',
    designation: 'General Manager (HR & CSR)',
    organization: 'Tata Consultancy Services (TCS), Bhubaneswar',
    category: 'Keynote Speaker',
    contact_number: '+91 9937088990',
    email: 'b.pradhan@tcs.com',
    status: 'Confirmed',
    escort_volunteer: 'Biswajit Sahoo',
    arrival_time: '11:00 AM',
    vehicle_number: 'OD 02 AK 9901',
    dietary_preference: 'Non-veg',
    notes: 'Delivering Keynote on Career Pathways in Tech & Management.',
    created_at: new Date().toISOString()
  }
];

// Default official student volunteers for CROSSFIRE 2026
const DEFAULT_VOLUNTEERS: VolunteerItem[] = [
  {
    id: 'vol-1',
    volunteer_id: 'VOL-101',
    password: 'volunteer123',
    name: 'Subhashree Mohapatra',
    contact_number: '+91 9437198765',
    email: 'volunteer@srusti.edu.in',
    assigned_station: 'Gate 1 Registration & Security',
    shift: 'Full Day (08:30 AM - 05:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-1 (Main Security & Entry)',
    notes: 'Chief Volunteer Coordinator • Managing admit card verification and barcode scanner.',
    created_at: new Date().toISOString()
  },
  {
    id: 'vol-2',
    volunteer_id: 'VOL-102',
    password: 'volunteer123',
    name: 'Rudra Narayan Samal',
    contact_number: '+91 7978123456',
    email: 'rudra.samal@srusti.edu.in',
    assigned_station: 'VIP & Guest Escort Protocol',
    shift: 'Full Day (08:30 AM - 05:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-2 (VIP Lounge & Hospitality)',
    notes: 'Assigned to escort Chief Guest & Sambad Media Team.',
    created_at: new Date().toISOString()
  },
  {
    id: 'vol-3',
    volunteer_id: 'VOL-103',
    password: 'volunteer123',
    name: 'Pooja Mohanty',
    contact_number: '+91 9123456780',
    email: 'pooja.mohanty@srusti.edu.in',
    assigned_station: 'Auditorium A (Quiz)',
    shift: 'Morning Shift (08:30 AM - 01:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-3 (Auditorium & Events)',
    notes: 'Buzzer round coordination & candidate score sheet tabulation.',
    created_at: new Date().toISOString()
  },
  {
    id: 'vol-4',
    volunteer_id: 'VOL-104',
    password: 'volunteer123',
    name: 'Biswajit Sahoo',
    contact_number: '+91 8249011223',
    email: 'biswajit.sahoo@srusti.edu.in',
    assigned_station: 'Food & Dining Courtyard',
    shift: 'Full Day (08:30 AM - 05:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-4 (Catering & Food Counters)',
    notes: 'Managing lunch buffet queues, token redemption QR scanning.',
    created_at: new Date().toISOString()
  },
  {
    id: 'vol-5',
    volunteer_id: 'VOL-105',
    password: 'volunteer123',
    name: 'Ankita Dash',
    contact_number: '+91 9439876543',
    email: 'ankita.dash@srusti.edu.in',
    assigned_station: 'Central Quad (Treasure Hunt)',
    shift: 'Afternoon Shift (01:00 PM - 05:30 PM)',
    attendance_status: 'Assigned',
    kit_issued: true,
    walkie_channel: 'CH-5 (Outdoor Quadrangle)',
    notes: 'Station 3 checkpoint clue master.',
    created_at: new Date().toISOString()
  },
  {
    id: 'vol-6',
    volunteer_id: 'VOL-106',
    password: 'volunteer123',
    name: 'Manish Kumar Panda',
    contact_number: '+91 7008991122',
    email: 'manish.panda@srusti.edu.in',
    assigned_station: 'Media Lab (Reels)',
    shift: 'Full Day (08:30 AM - 05:30 PM)',
    attendance_status: 'Present / On Duty',
    kit_issued: true,
    walkie_channel: 'CH-6 (AV & Media Team)',
    notes: 'Collecting drive links, managing projector playback.',
    created_at: new Date().toISOString()
  }
];

class GuestVolunteerService {
  // ==========================================
  // GUEST MANAGEMENT
  // ==========================================

  public getAllGuests(): GuestItem[] {
    try {
      const raw = localStorage.getItem(GUESTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Error parsing guest records:', e);
    }
    // Initialize with default official guests
    this.saveGuests(DEFAULT_GUESTS);
    return DEFAULT_GUESTS;
  }

  public saveGuests(guests: GuestItem[]): void {
    try {
      localStorage.setItem(GUESTS_STORAGE_KEY, JSON.stringify(guests));
      window.dispatchEvent(new CustomEvent(GUEST_UPDATED_EVENT, { detail: guests }));
    } catch (e) {
      console.error('[CROSSFIRE] Error saving guest records:', e);
    }
  }

  public addGuest(guestData: Omit<GuestItem, 'id' | 'created_at'>): GuestItem {
    const guests = this.getAllGuests();
    const newGuest: GuestItem = {
      ...guestData,
      id: `gst-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    guests.unshift(newGuest);
    this.saveGuests(guests);
    return newGuest;
  }

  public updateGuest(id: string, updates: Partial<GuestItem>): boolean {
    const guests = this.getAllGuests();
    const idx = guests.findIndex(g => g.id === id);
    if (idx >= 0) {
      guests[idx] = { ...guests[idx], ...updates };
      this.saveGuests(guests);
      return true;
    }
    return false;
  }

  public updateGuestStatus(id: string, status: GuestStatus): boolean {
    const guest = this.findGuestById(id);
    return this.updateGuest(id, { 
      status, 
      ...(status === 'Arrived' && (!guest?.arrival_time || guest.arrival_time === '') 
        ? { arrival_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } 
        : {})
    });
  }

  public deleteGuest(id: string): boolean {
    const guests = this.getAllGuests();
    const filtered = guests.filter(g => g.id !== id);
    if (filtered.length !== guests.length) {
      this.saveGuests(filtered);
      return true;
    }
    return false;
  }

  public findGuestById(id: string): GuestItem | undefined {
    return this.getAllGuests().find(g => g.id === id);
  }

  // ==========================================
  // VOLUNTEER MANAGEMENT
  // ==========================================

  public getAllVolunteers(): VolunteerItem[] {
    try {
      const raw = localStorage.getItem(VOLUNTEERS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasMissing = false;
          const normalized = parsed.map((v: VolunteerItem, idx: number) => {
            if (!v.volunteer_id || !v.password) {
              hasMissing = true;
              return {
                ...v,
                volunteer_id: v.volunteer_id || `VOL-${101 + idx}`,
                password: v.password || 'volunteer123'
              };
            }
            return v;
          });
          if (hasMissing) {
            this.saveVolunteers(normalized);
          }
          return normalized;
        }
      }
    } catch (e) {
      console.warn('[CROSSFIRE] Error parsing volunteer records:', e);
    }
    // Initialize with default official volunteers
    this.saveVolunteers(DEFAULT_VOLUNTEERS);
    return DEFAULT_VOLUNTEERS;
  }

  public saveVolunteers(volunteers: VolunteerItem[]): void {
    try {
      localStorage.setItem(VOLUNTEERS_STORAGE_KEY, JSON.stringify(volunteers));
      window.dispatchEvent(new CustomEvent(VOLUNTEER_UPDATED_EVENT, { detail: volunteers }));
    } catch (e) {
      console.error('[CROSSFIRE] Error saving volunteer records:', e);
    }
  }

  public addVolunteer(volData: Omit<VolunteerItem, 'id' | 'created_at'>): VolunteerItem {
    const volunteers = this.getAllVolunteers();
    const volunteerCount = volunteers.length + 1;
    const volId = volData.volunteer_id || `VOL-${100 + volunteerCount}`;
    const newVol: VolunteerItem = {
      ...volData,
      id: `vol-${Date.now()}`,
      volunteer_id: volId,
      created_at: new Date().toISOString()
    };
    volunteers.unshift(newVol);
    this.saveVolunteers(volunteers);
    return newVol;
  }

  public updateVolunteer(id: string, updates: Partial<VolunteerItem>): boolean {
    const volunteers = this.getAllVolunteers();
    const idx = volunteers.findIndex(v => v.id === id);
    if (idx >= 0) {
      volunteers[idx] = { ...volunteers[idx], ...updates };
      this.saveVolunteers(volunteers);
      return true;
    }
    return false;
  }

  public updateVolunteerAttendance(id: string, status: VolunteerAttendance): boolean {
    return this.updateVolunteer(id, { attendance_status: status });
  }

  public toggleVolunteerKit(id: string): boolean {
    const vol = this.findVolunteerById(id);
    if (vol) {
      return this.updateVolunteer(id, { kit_issued: !vol.kit_issued });
    }
    return false;
  }

  public deleteVolunteer(id: string): boolean {
    const volunteers = this.getAllVolunteers();
    const filtered = volunteers.filter(v => v.id !== id);
    if (filtered.length !== volunteers.length) {
      this.saveVolunteers(filtered);
      return true;
    }
    return false;
  }

  public findVolunteerById(id: string): VolunteerItem | undefined {
    return this.getAllVolunteers().find(v => v.id === id);
  }

  public findVolunteerByEmailOrId(identifier: string): VolunteerItem | undefined {
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    return this.getAllVolunteers().find(v => 
      v.email.toLowerCase() === clean || 
      (v.volunteer_id && v.volunteer_id.toLowerCase() === clean) ||
      v.id.toLowerCase() === clean
    );
  }

  public verifyVolunteerCredentials(identifier: string, password = ''): VolunteerItem | null {
    const vol = this.findVolunteerByEmailOrId(identifier);
    if (!vol) return null;
    if (vol.password) {
      if (vol.password === password) return vol;
      return null;
    }
    // Default fallback password if none set by admin
    if (password === 'volunteer123' || password === 'CrossFire@2026' || !password) {
      return vol;
    }
    return null;
  }

  // Summary Metrics for Admin Dashboard
  public getGuestMetrics() {
    const guests = this.getAllGuests();
    return {
      total: guests.length,
      confirmed: guests.filter(g => g.status === 'Confirmed').length,
      arrived: guests.filter(g => g.status === 'Arrived').length,
      pending: guests.filter(g => g.status === 'Invited').length,
      judges: guests.filter(g => g.category === 'Judge').length,
      vips: guests.filter(g => g.category === 'Chief Guest' || g.category === 'Guest of Honour' || g.category === 'VIP Dignitary').length,
    };
  }

  public getVolunteerMetrics() {
    const volunteers = this.getAllVolunteers();
    return {
      total: volunteers.length,
      onDuty: volunteers.filter(v => v.attendance_status === 'Present / On Duty').length,
      kitsIssued: volunteers.filter(v => v.kit_issued).length,
      assigned: volunteers.filter(v => v.attendance_status === 'Assigned').length,
      absent: volunteers.filter(v => v.attendance_status === 'Absent').length,
    };
  }
}

export const guestVolunteerService = new GuestVolunteerService();
