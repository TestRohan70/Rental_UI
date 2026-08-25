import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const securityGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSecurity()) {
    return true;
  }

  if (auth.isSuperAdmin()) {
    return router.createUrlTree(['/padmin/society-configuration']);
  }

  if (auth.isSocietyAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  if (auth.isResident()) {
    return router.createUrlTree(['/resident/dashboard']);
  }

  return router.createUrlTree(['/login']);
};
