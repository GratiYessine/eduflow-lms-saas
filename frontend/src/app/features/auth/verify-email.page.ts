import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { parseApiError } from '../../core/utils/api-error.util';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <div class="mobile-brand">
        <span class="material-symbols-outlined">school</span>
        <strong>EduFlow</strong>
      </div>
      <div class="auth-heading">
        <span class="icon-badge material-symbols-outlined">mark_email_read</span>
        <span class="badge badge-info">Email verification</span>
        <h2>Activate your account</h2>
        <p>{{ message() }}</p>
      </div>
      <button class="btn btn-primary submit-btn" type="button" (click)="verify()" [disabled]="loading()">
        @if (loading()) { <span class="material-symbols-outlined spin">progress_activity</span> Verifying... }
        @else { Verify email <span class="material-symbols-outlined">verified</span> }
      </button>
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
    .icon-badge { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 28px; }
    h2 { margin: 0; color: var(--color-heading); font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .auth-heading p { margin: 0; color: var(--color-muted); font-size: 15px; line-height: 1.6; }
    .submit-btn { width: 100%; min-height: 52px; font-size: 15px; }
    .back-link { display: inline-flex; align-items: center; gap: 6px; color: var(--color-primary); font-weight: 700; font-size: 14px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; font-size: 18px; }
    @media (max-width: 960px) { .mobile-brand { display: inline-flex; } }
  `]
})
export class VerifyEmailPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly message = signal('Click verify to confirm your email address.');
  readonly loading = signal(false);

  verify(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.loading.set(true);
    this.auth.verifyEmail(token).subscribe({
      next: (response) => {
        this.toast.success('Email verified.');
        const auth = response.data;
        if (auth?.accessToken) {
          void this.router.navigate(['/dashboard']);
          return;
        }
        if (auth?.user?.role === 'TRAINER') {
          void this.router.navigate(['/auth/trainer-pending'], { queryParams: { status: 'PENDING' } });
          return;
        }
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }
}
