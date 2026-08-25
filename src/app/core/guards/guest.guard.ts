import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return true;
  }

  if (auth.isSuperAdmin()) {
    return router.createUrlTree(['/padmin/society-configuration']);
  }

  if (auth.isSocietyAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (auth.isSecurity()) {
    return router.createUrlTree(['/security/gate']);
  }

  if (auth.isResident()) {
    return router.createUrlTree(['/resident/dashboard']);
  }

  auth.clearSession();
  return true;
};
