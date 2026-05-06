import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { TrainerVerificationStatus } from '../../core/models/api.models';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pending-page">
      <a class="mobile-brand" routerLink="/">
        <span class="material-symbols-outlined">school</span>
        <strong>EduFlow</strong>
      </a>
      <section class="pending-card">
        <span class="status-icon material-symbols-outlined">{{ content().icon }}</span>
        <span class="status-badge" [class.pending]="status() === 'PENDING'" [class.approved]="status() === 'APPROVED'" [class.rejected]="status() === 'REJECTED'">{{ status() }}</span>
        <h2>{{ content().title }}</h2>
        <p>{{ content().body }}</p>
        <p class="notice">{{ content().notice }}</p>

        <div class="timeline">
          @for (step of timeline(); track step.label) {
            <div class="timeline-step" [class.done]="step.state === 'done'" [class.active]="step.state === 'active'" [class.rejected]="step.state === 'rejected'">
              <span class="dot material-symbols-outlined">{{ step.icon }}</span>
              <div>
                <strong>{{ step.label }}</strong>
                <small>{{ step.copy }}</small>
              </div>
            </div>
          }
        </div>

        <a class="btn btn-primary action-btn" routerLink="/auth/login">
          Back to login
          <span class="material-symbols-outlined">arrow_forward</span>
        </a>
      </section>
    </div>
  `,
  styles: [`
    .pending-page { display: grid; gap: 24px; animation: fadeInUp 0.4s ease both; }
    .mobile-brand { display: none; align-items: center; gap: 10px; color: var(--color-heading); font-size: 18px; font-weight: 800; }
    .mobile-brand span { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 20px; }

    .pending-card {
      display: grid; justify-items: center; gap: 12px;
      padding: 32px 24px;
      border: 1px solid rgba(215, 227, 248, 0.7);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08);
      text-align: center;
    }

    .status-icon { display: grid; place-items: center; width: 60px; height: 60px; border-radius: 18px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 30px; }
    .status-badge { padding: 5px 12px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em; }
    .status-badge.pending { color: #92400e; background: #fef3c7; }
    .status-badge.approved { color: #047857; background: #d1fae5; }
    .status-badge.rejected { color: #b91c1c; background: #fee2e2; }

    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
    p { max-width: 50ch; color: var(--color-muted); font-size: 14px; line-height: 1.6; }
    .notice { color: var(--color-heading); font-weight: 700; font-size: 13px; }

    .timeline { width: min(100%, 480px); display: grid; gap: 0; margin: 8px 0; text-align: left; }
    .timeline-step { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 12px; position: relative; padding: 8px 0; }
    .timeline-step:not(:last-child)::after { content: ''; position: absolute; left: 16px; top: 38px; bottom: -8px; width: 2px; background: var(--color-border); }
    .timeline-step.done:not(:last-child)::after, .timeline-step.active:not(:last-child)::after { background: var(--color-primary); }
    .dot { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; color: var(--color-muted); background: var(--color-surface-soft); border: 1px solid var(--color-border); font-size: 18px; z-index: 1; }
    .timeline-step.done .dot, .timeline-step.active .dot { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
    .timeline-step.rejected .dot { color: #fff; background: #dc2626; border-color: #dc2626; }
    .timeline-step strong { display: block; color: var(--color-heading); font-size: 13px; }
    .timeline-step small { display: block; margin-top: 2px; color: var(--color-muted); font-size: 12px; line-height: 1.5; }

    .action-btn { margin-top: 8px; min-width: 180px; min-height: 48px; }
    @media (max-width: 960px) { .mobile-brand { display: inline-flex; } }
  `]
})
export class TrainerPendingPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly status = signal<TrainerVerificationStatus>('PENDING');

  ngOnInit(): void {
    const queryStatus = this.route.snapshot.queryParamMap.get('status')?.toUpperCase();
    if (queryStatus === 'APPROVED' || queryStatus === 'REJECTED' || queryStatus === 'PENDING') {
      this.status.set(queryStatus);
    }
  }

  content() {
    switch (this.status()) {
      case 'APPROVED':
        return { icon: 'verified', title: 'Your trainer workspace is ready', body: 'Your account has been approved. Log in to start building professional trainings.', notice: 'Use the credentials you created during registration.' };
      case 'REJECTED':
        return { icon: 'report', title: 'Application not approved', body: 'The review team could not activate your trainer workspace at this time.', notice: 'Check your email for details from the review team.' };
      default:
        return { icon: 'hourglass_top', title: 'Application under review', body: 'A super admin will review your profile and documents before activating access.', notice: 'You will receive an email after verification.' };
    }
  }

  timeline() {
    const s = this.status();
    return [
      { label: 'Application submitted', copy: 'Your information was received.', icon: 'done', state: 'done' },
      { label: 'Admin review', copy: s === 'PENDING' ? 'Review in progress.' : 'Review completed.', icon: s === 'PENDING' ? 'hourglass_top' : 'done', state: s === 'PENDING' ? 'active' : 'done' },
      { label: s === 'REJECTED' ? 'Rejected' : 'Trainer access', copy: s === 'APPROVED' ? 'Dashboard active.' : s === 'REJECTED' ? 'Access blocked.' : 'Awaiting decision.', icon: s === 'REJECTED' ? 'close' : s === 'APPROVED' ? 'verified' : 'lock', state: s === 'REJECTED' ? 'rejected' : s === 'APPROVED' ? 'done' : 'active' }
    ];
  }
}
