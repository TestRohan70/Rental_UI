export type ResidentRole = 'Security' | 'Tenant' | 'Owner';

export const SECURITY_ROLE: ResidentRole = 'Security';

export const RESIDENT_ROLE_OPTIONS: readonly ResidentRole[] = [
  'Security',
  'Tenant',
  'Owner'
] as const;

export function requiresUnitDetails(role: string): boolean {
  return !!role && role !== SECURITY_ROLE;
}