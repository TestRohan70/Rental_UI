import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const residentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isResident()) {
    return true;
  }

  if (auth.isSecurity()) {
    return router.createUrlTree(['/security/gate']);
  }

  if (auth.isSuperAdmin()) {
    return router.createUrlTree(['/padmin/society-configuration']);
  }

  if (auth.isSocietyAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return router.createUrlTree(['/login']);
};
