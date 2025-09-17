import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const roleGuard = (roles: string[]): CanMatchFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.user();
    if (user && user.roles?.some(r => roles.includes(r))) return true;
    router.navigate(['/']);
    return false;
  };
};
