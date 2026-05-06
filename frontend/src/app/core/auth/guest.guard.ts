import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { TokenStorageService } from './token-storage.service';

export const guestGuard: CanActivateFn = () => {
  const tokens = inject(TokenStorageService);
  const router = inject(Router);
  return tokens.accessToken ? router.createUrlTree(['/dashboard']) : true;
};
