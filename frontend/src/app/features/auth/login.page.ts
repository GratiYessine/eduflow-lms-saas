import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, Validators, NonNullableFormBuilder } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { parseApiError } from '../../core/utils/api-error.util';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="mobile-brand">
        <span class="material-symbols-outlined">school</span>
        <strong>EduFlow</strong>
      </div>

      <div class="auth-heading">
        <h2>Welcome back</h2>
        <p>Sign in to access your workspace.</p>
      </div>

      <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field icon-field">
          <span>Email address</span>
          <span class="input-wrap">
            <i class="material-symbols-outlined">mail</i>
            <input class="control" type="email" formControlName="email" placeholder="name@company.com" autocomplete="email" />
          </span>
        </label>

        <label class="field icon-field">
          <span class="password-row">
            Password
            <a routerLink="/auth/forgot-password">Forgot?</a>
          </span>
          <span class="input-wrap">
            <i class="material-symbols-outlined">lock</i>
            <input class="control" type="password" formControlName="password" placeholder="Enter your password" autocomplete="current-password" />
          </span>
        </label>

        @if (message()) {
          <p class="alert alert-error">{{ message() }}</p>
        }

        <button class="btn btn-primary sign-in" type="submit" [disabled]="form.invalid || loading()">
          @if (loading()) {
            <span class="material-symbols-outlined spin">progress_activity</span>
            Signing in...
          } @else {
            Sign In
            <span class="material-symbols-outlined">arrow_forward</span>
          }
        </button>
      </form>

      <div class="auth-divider">
        <span>or</span>
      </div>

      <p class="auth-switch">
        New to EduFlow?
        <a routerLink="/auth/register">Create an account</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-page {
      display: grid;
      gap: 24px;
      animation: fadeInUp 0.4s ease both;
    }

    .mobile-brand {
      display: none;
      align-items: center;
      gap: 10px;
      color: var(--color-heading);
      font-size: 18px;
      font-weight: 800;
    }

    .mobile-brand span {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: #fff;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      font-size: 20px;
    }

    .auth-heading { display: grid; gap: 6px; }

    h2 {
      margin: 0;
      color: var(--color-heading);
      font-size: 28px;
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .auth-heading p,
    .auth-switch {
      margin: 0;
      color: var(--color-muted);
      font-size: 15px;
      line-height: 1.5;
    }

    .form-grid { gap: 20px; }

    .password-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
    }

    .password-row a,
    .auth-switch a {
      color: var(--color-primary);
      font-weight: 700;
      font-size: 13px;
    }

    .input-wrap {
      position: relative;
      display: block;
    }

    .input-wrap i {
      position: absolute;
      top: 50%;
      left: 14px;
      z-index: 1;
      transform: translateY(-50%);
      color: var(--color-muted);
      font-style: normal;
      font-size: 20px;
    }

    .icon-field .control {
      min-height: 52px;
      padding-left: 48px;
      font-size: 15px;
    }

    .sign-in {
      min-height: 52px;
      width: 100%;
      font-size: 15px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .spin {
      animation: spin 0.8s linear infinite;
      font-size: 18px;
    }

    .auth-divider {
      display: flex;
      align-items: center;
      gap: 16px;
      color: var(--color-muted);
      font-size: 12px;
      font-weight: 600;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-border);
    }

    .auth-switch { text-align: center; }
    .auth-switch a { font-size: 15px; }

    @media (max-width: 960px) {
      .mobile-brand { display: inline-flex; }
    }
  `]
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly message = signal('');
  readonly loading = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.loading.set(true);
    this.message.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.toast.success('Login successful.');
        void this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }
}
