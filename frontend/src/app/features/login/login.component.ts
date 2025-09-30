// src/app/features/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
  <div class="container">
    <h1>Login</h1>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>Username</label>
      <input formControlName="username" />
      <label>Password</label>
      <input type="password" formControlName="password" />
      <button [disabled]="form.invalid || loading">Sign in</button>
      <p class="error" *ngIf="error">{{ error }}</p>
    </form>
  </div>
  `,
  styles: [`.container{max-width:380px;margin:64px auto;display:flex;flex-direction:column;gap:12px}
  form{display:flex;flex-direction:column;gap:8px} .error{color:#b00020}`]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';
  form = this.fb.group({
    username: ['demo', Validators.required],
    password: ['demo1234', Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { username, password } = this.form.value as any;
    this.auth.login(username, password).subscribe({
      next: () => this.router.navigateByUrl('/'),
      error: (e) => { this.error = 'Login failed'; this.loading = false; }
    });
  }
}
