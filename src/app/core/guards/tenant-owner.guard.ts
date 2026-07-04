import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantOwnerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isTenantOrOwner()) {
    return true;
  }

  if (auth.isSecurityStaff()) {
    return router.createUrlTree(['/security/gate']);
  }

  return router.createUrlTree(['/resident/dashboard']);
};
