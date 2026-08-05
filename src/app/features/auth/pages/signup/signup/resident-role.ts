export type ResidentRole = 'Security' | 'Tenant' | 'Owner';

export type SignupAccountType = 'Resident' | 'Secretary';

export const SIGNUP_ACCOUNT_OPTIONS: readonly SignupAccountType[] = [
  'Resident',
  'Secretary'
] as const;

export const SECURITY_ROLE: ResidentRole = 'Security';

export function mapSignupRoleToApiRole(signupRole: SignupAccountType): ResidentRole {
  return signupRole === 'Secretary' ? 'Security' : 'Owner';
}

export function requiresUnitDetails(signupRole: SignupAccountType): boolean {
  return signupRole === 'Resident';
}

export function signupRoleHint(signupRole: SignupAccountType): string {
  return signupRole === 'Secretary'
    ? 'Secretary staff do not need wing or flat details.'
    : 'Residents must provide wing and flat number for their unit.';
}
