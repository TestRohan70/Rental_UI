import { Resident } from '../models/resident.model';

type ResidentLike = Pick<Resident, 'role' | 'wing' | 'flatNo'> & {
  Role?: string;
};

export function normalizeResident(resident: Resident & ResidentLike): Resident {
  return {
    ...resident,
    role: resident.role ?? resident.Role
  };
}

export function resolveResidentRole(resident: ResidentLike): string | undefined {
  const role = resident.role ?? resident.Role;

  if (role) {
    return role;
  }

  if (resident.wing === '—' && resident.flatNo === 0) {
    return 'Security';
  }

  if (resident.wing === '-' && resident.flatNo === 0) {
    return 'Security';
  }

  return undefined;
}

export function isSecurityResident(resident: ResidentLike): boolean {
  return resolveResidentRole(resident) === 'Security';
}

export function getResidentRoleLabel(resident: ResidentLike): string {
  return resolveResidentRole(resident) ?? 'Unknown';
}

export function getResidentRoleClass(resident: ResidentLike): string {
  switch (resolveResidentRole(resident)) {
    case 'Security':
      return 'role-badge role-badge--security';
    case 'Tenant':
      return 'role-badge role-badge--tenant';
    case 'Owner':
      return 'role-badge role-badge--owner';
    default:
      return 'role-badge role-badge--unknown';
  }
}

export function getResidentUnitLabel(resident: ResidentLike): string | null {
  if (isSecurityResident(resident)) {
    return null;
  }

  return `Wing ${resident.wing} · Flat ${resident.flatNo}`;
}

export function getResidentLocationLabel(resident: ResidentLike): string {
  if (isSecurityResident(resident)) {
    return 'Security Staff';
  }

  const parts = [`Wing ${resident.wing}`, `Flat ${resident.flatNo}`];
  const role = resolveResidentRole(resident);

  if (role) {
    parts.push(role);
  }

  return parts.join(' · ');
}
