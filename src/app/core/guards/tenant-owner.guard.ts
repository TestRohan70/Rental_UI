import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantOwnerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isResident()) {
    return true;
  }

  if (auth.isSecurity()) {
    return router.createUrlTree(['/security/gate']);
  }

  return router.createUrlTree(['/resident/dashboard']);
};
