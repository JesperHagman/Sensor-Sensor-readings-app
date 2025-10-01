// src/app/core/token.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Do NOT attach token (and do NOT auto-redirect on 401) for auth endpoints
  // Adjust the prefix if your API base changes.
  const isAuthEndpoint =
    req.url.startsWith('/api/auth/') || req.url.includes('/auth/token');

  if (!isAuthEndpoint) {
    const token = localStorage.getItem('access_token');
    if (token) {
      req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    }
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only kick to /login for protected endpoints
      if (!isAuthEndpoint && (error.status === 401 || error.status === 403)) {
        localStorage.removeItem('access_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
