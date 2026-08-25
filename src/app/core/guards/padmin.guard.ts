import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const padminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSuperAdmin()) {
    return true;
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

  return router.createUrlTree(['/login']);
};
