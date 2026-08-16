import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.isPAdmin()) {
    return router.createUrlTree(['/padmin/society-configuration']);
  }

  if (auth.isAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (auth.isSecurityStaff()) {
    return router.createUrlTree(['/security/gate']);
  }

  if (auth.isResident()) {
    return router.createUrlTree(['/resident/dashboard']);
  }

  // Do not wipe sessions for valid pAdmin role stored at login
  const storedRole = auth.getRole()?.trim().toLowerCase();
  if (storedRole === 'padmin') {
    return router.createUrlTree(['/padmin/society-configuration']);
  }

  auth.clearSession();
  return true;
};
