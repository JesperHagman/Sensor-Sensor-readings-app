import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { RegisterOut } from '../../core/models';

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

    this.api.register({ username, email, password }).subscribe({
      next: (res: RegisterOut) => {
        // Sätt JWT direkt från register-svaret
        localStorage.setItem('access_token', res.access);

        this.loading = false;
        const redirect = this.route.snapshot.queryParamMap.get('redirect') || '/sensors';
        this.router.navigateByUrl(redirect);
      },
      error: (e) => {
        this.loading = false;
        this.error =
          e?.error?.detail ||
          e?.error?.message ||
          firstFieldError(e?.error) ||
          'Registration failed';
        console.error(e);
      }
    });
  }
}

/** Plockar första valideringsfelet från typiska DRF/Ninja-felobjekt */
function firstFieldError(err: any): string | null {
  if (!err || typeof err !== 'object') return null;
  for (const key of Object.keys(err)) {
    const val = err[key];
    if (Array.isArray(val) && val.length) return String(val[0]);
    if (typeof val === 'string') return val;
  }
  return null;
}
