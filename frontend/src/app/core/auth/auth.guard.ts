import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';
import { TokenStorageService } from './token-storage.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const tokens = inject(TokenStorageService);
  const router = inject(Router);
  if (!tokens.accessToken) {
    return router.createUrlTree(['/auth/login']);
  }
  return auth.ensureCurrentUser().pipe(
    map(() => true),
    catchError(() => {
      tokens.clear();
      return of(router.createUrlTree(['/auth/login']));
    })
  );
};
