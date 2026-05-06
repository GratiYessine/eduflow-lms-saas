import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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
        <span class="badge badge-info">Secure reset</span>
        <h2>Choose a new password</h2>
        <p>Enter the email code and a strong password for your account.</p>
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
          <span>Reset code</span>
          <span class="input-wrap">
            <i class="material-symbols-outlined">pin</i>
            <input class="control code-input" formControlName="code" placeholder="123456" inputmode="numeric" maxlength="6" autocomplete="one-time-code" />
          </span>
        </label>
        <label class="field icon-field">
          <span>New password</span>
          <span class="input-wrap">
            <i class="material-symbols-outlined">lock</i>
            <input class="control" type="password" formControlName="password" placeholder="8+ characters" autocomplete="new-password" />
          </span>
        </label>
        @if (message()) { <p class="alert">{{ message() }}</p> }
        <button class="btn btn-primary submit-btn" type="submit" [disabled]="form.invalid || loading()">
          @if (loading()) { <span class="material-symbols-outlined spin">progress_activity</span> Resetting... }
          @else { Reset password <span class="material-symbols-outlined">arrow_forward</span> }
        </button>
      </form>
      <a routerLink="/auth/login" class="back-link">
        <span class="material-symbols-outlined">arrow_back</span> Back to login
      </a>
    </div>
  `,
  styles: [`
    .auth-page { display: grid; gap: 24px; animation: fadeInUp 0.4s ease both; }
    .mobile-brand { display: none; align-items: center; gap: 10px; color: var(--color-heading); font-size: 18px; font-weight: 800; }
    .mobile-brand span { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 20px; }
    .auth-heading { display: grid; gap: 8px; }
    h2 { margin: 0; color: var(--color-heading); font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .auth-heading p { margin: 0; color: var(--color-muted); font-size: 15px; }
    .form-grid { gap: 20px; }
    .input-wrap { position: relative; display: block; }
    .input-wrap i { position: absolute; top: 50%; left: 14px; z-index: 1; transform: translateY(-50%); color: var(--color-muted); font-style: normal; font-size: 20px; }
    .icon-field .control { min-height: 52px; padding-left: 48px; font-size: 15px; }
    .submit-btn { width: 100%; min-height: 52px; font-size: 15px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-weight: 700; font-size: 14px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; font-size: 18px; }
    @media (max-width: 960px) { .mobile-brand { display: inline-flex; } }
  `]
})
export class ResetPasswordPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly message = signal('');
  readonly loading = signal(false);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    code: ['', [Validators.required, Validators.pattern(/^\\d{6}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  submit(): void {
    this.loading.set(true);
    this.auth.resetPassword(this.form.controls.email.value, this.form.controls.code.value, this.form.controls.password.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.message.set('Password updated. You can now login.');
        this.toast.success('Password updated.');
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }
}
