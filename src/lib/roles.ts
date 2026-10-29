import type { UserRole } from '../types';

export const ROLE_LABELS: Record<UserRole, string> = { super_admin: 'Super Admin', admin: 'Admin', student: 'Student', volunteer: 'Volunteer', vip_guest: 'VIP Guest', judge: 'Judge' };
// Signs in through the staff tab; students use the student tab.
export const PROVISIONED_ROLES: UserRole[] = ['super_admin', 'admin', 'volunteer', 'vip_guest', 'judge'];

// The landing view for each role. Every view also checks the role on the server.
export function dashboardFor(role: UserRole | undefined): string {
  if (role === 'admin' || role === 'super_admin') return 'admin';
  if (role === 'judge') return 'judge';
  if (role === 'volunteer') return 'volunteer';
  if (role === 'vip_guest') return 'vip';
  return 'dashboard';
}
