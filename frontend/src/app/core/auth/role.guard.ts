import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { Role } from '../models/api.models';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = (route.data['roles'] ?? []) as Role[];
  if (roles.length === 0) {
    return true;
  }
  return auth.ensureCurrentUser().pipe(
    map(() => (auth.hasRole(roles) ? true : router.createUrlTree(['/dashboard']))),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );
};
