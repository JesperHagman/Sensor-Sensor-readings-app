// src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const router = inject(Router);
  const auth = inject(AuthService);

  // Dessa routes är publika OM guarden nånsin skulle appliceras fel
  const publicPaths = new Set(['login', 'register']);
  const thisPath = route.routeConfig?.path ?? '';
  if (publicPaths.has(thisPath)) return true;

  if (auth.isAuthenticated()) return true;

  // Skicka till login och spara var vi var på väg
  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};
