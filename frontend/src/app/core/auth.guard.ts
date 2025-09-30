// src/app/core/auth.guard.ts
import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  private auth = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    if (this.auth.isAuthenticated()) return true;
    this.router.navigateByUrl('/login');
    return false;
  }
}

// för Routes-arrayen ovan kan du använda klassen direkt (Angular 17 stödjer detta)
export const canActivate: CanActivateFn = () => inject(AuthGuard).canActivate();
