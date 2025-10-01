// src/app/pages/register/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  loading = false;
  error: string | null = null;

  form = this.fb.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  submit() {
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.error = null;

    const { username, email, password } = this.form.value as {
      username: string; email: string; password: string;
    };

    this.api.register({ username, email, password }).pipe(
      // On success, immediately log in with the same credentials
      switchMap(() => this.auth.login(username, password))
    ).subscribe({
      next: () => {
        this.loading = false;
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/sensors';
        this.router.navigateByUrl(redirect);
      },
      error: (e) => {
        this.loading = false;
        // Try to surface a helpful error message
        this.error =
          e?.error?.detail ||
          e?.error?.message ||
          firstFieldError(e?.error) ||
          'Registration or auto-login failed';
        console.error(e);
      }
    });
  }
}

/** Extracts the first validation error message from a typical DRF error shape */
function firstFieldError(err: any): string | null {
  if (!err || typeof err !== 'object') return null;
  for (const key of Object.keys(err)) {
    const val = err[key];
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return null;
}
