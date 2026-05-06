import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { parseApiError } from '../../core/utils/api-error.util';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-heading">
        <span class="icon-badge material-symbols-outlined">group_add</span>
        <span class="badge badge-info">Team invitation</span>
        <h2>Join your team</h2>
        <p>Set a password to accept your invitation and access the workspace.</p>
      </div>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <label class="field icon-field">
          <span>Password</span>
          <span class="input-wrap">
            <i class="material-symbols-outlined">lock</i>
            <input class="control" type="password" formControlName="password" placeholder="8+ characters" autocomplete="new-password" />
          </span>
        </label>
        @if (message()) { <p class="alert alert-error">{{ message() }}</p> }
        <button class="btn btn-primary submit-btn" type="submit" [disabled]="form.invalid || loading()">
          @if (loading()) { <span class="material-symbols-outlined spin">progress_activity</span> Joining... }
          @else { Accept invitation <span class="material-symbols-outlined">arrow_forward</span> }
        </button>
      </form>
    </div>
  `,
  styles: [`
    .auth-page { display: grid; gap: 24px; animation: fadeInUp 0.4s ease both; }
    .auth-heading { display: grid; gap: 8px; }
    .icon-badge { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 16px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 28px; }
    h2 { margin: 0; color: var(--color-heading); font-size: 28px; font-weight: 800; letter-spacing: -0.02em; }
    .auth-heading p { margin: 0; color: var(--color-muted); font-size: 15px; line-height: 1.6; }
    .form-grid { gap: 20px; }
    .input-wrap { position: relative; display: block; }
    .input-wrap i { position: absolute; top: 50%; left: 14px; z-index: 1; transform: translateY(-50%); color: var(--color-muted); font-style: normal; font-size: 20px; }
    .icon-field .control { min-height: 52px; padding-left: 48px; font-size: 15px; }
    .submit-btn { width: 100%; min-height: 52px; font-size: 15px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; font-size: 18px; }
  `]
})
export class AcceptInvitationPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  readonly message = signal('');
  readonly loading = signal(false);
  readonly form = this.fb.group({ password: ['', [Validators.required, Validators.minLength(8)]] });

  submit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.loading.set(true);
    this.auth.acceptInvitation(token, this.form.controls.password.value).subscribe({
      next: () => {
        this.toast.success('Invitation accepted. Check your email to verify your account.');
        void this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.loading.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }
}
