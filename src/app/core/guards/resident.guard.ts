import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const residentGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isSecurityStaff()) {
    return router.createUrlTree(['/security/gate']);
  }

  if (auth.isResident()) {
    return true;
  }

  if (auth.isAdmin()) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return router.createUrlTree(['/login']);
};
