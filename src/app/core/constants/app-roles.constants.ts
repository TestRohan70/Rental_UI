export const AppRoles = {
  SuperAdmin: 'SUPERADMIN',
  SocietyAdmin: 'SOCIETYADMIN',
  Resident: 'RESIDENT',
  Security: 'SECURITY'
} as const;

export type AppRole = typeof AppRoles[keyof typeof AppRoles];
