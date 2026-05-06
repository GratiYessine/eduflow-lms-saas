import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { TrainerApplicationResponse, TrainerVerificationStatus } from '../../core/models/api.models';
import { ToastService } from '../../core/services/toast.service';
import { TrainerService } from '../../core/services/trainer.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { environment } from '../../../environments/environment';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton/ui-skeleton.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

type ReviewAction = 'approve' | 'reject';

@Component({
  standalone: true,
  imports: [DatePipe, FormsModule, UiPageHeaderComponent, UiEmptyStateComponent, UiModalComponent, UiSkeletonComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header
        eyebrow="Super admin"
        title="Trainer Applications"
        description="Search, preview documents, and review trainer portfolio submissions before activating access."
      />

      <section class="card review-toolbar">
        <div class="status-tabs" aria-label="Application status filter">
          @for (status of statuses; track status) {
            <button
              type="button"
              class="status-tab"
              [class.active]="activeStatus() === status"
              (click)="setStatus(status)"
            >
              {{ statusLabel(status) }}
            </button>
          }
        </div>
        <label class="search-field">
          <span class="material-symbols-outlined">search</span>
          <input
            class="control"
            type="search"
            [(ngModel)]="searchTerm"
            placeholder="Search by trainer name or email"
          />
        </label>
        <button class="btn btn-secondary" type="button" (click)="load()" [disabled]="loading()">
          Refresh
        </button>
      </section>

      <section class="grid grid-3">
        <ui-stat-card label="Pending" [value]="pendingCount()" icon="hourglass_top" trend="Awaiting review" />
        <ui-stat-card label="Approved" [value]="approvedCount()" icon="verified" trend="Active trainers" />
        <ui-stat-card label="Rejected" [value]="rejectedCount()" icon="block" trend="Declined applications" />
      </section>

      @if (loading()) {
        <section class="card"><ui-skeleton [rows]="8" /></section>
      } @else if (filteredApplications().length) {
        <section class="decision-grid">
          <div class="application-list">
            @for (application of filteredApplications(); track application.trainerId) {
              <button
                class="candidate-card"
                type="button"
                [class.selected]="selectedApplication()?.trainerId === application.trainerId"
                (click)="selectApplication(application)"
              >
                <span class="avatar">{{ initials(application) }}</span>
                <span>
                  <strong>{{ application.firstName }} {{ application.lastName }}</strong>
                  <small>{{ application.email }}</small>
                  <em class="badge" [class.badge-warning]="application.verificationStatus === 'PENDING'" [class.badge-success]="application.verificationStatus === 'APPROVED'" [class.badge-danger]="application.verificationStatus === 'REJECTED'">{{ application.verificationStatus }}</em>
                </span>
              </button>
            }
          </div>

          @if (selectedApplication(); as application) {
            <article class="card application-detail">
              <div class="detail-head">
                <div>
                  <span class="badge" [class.badge-warning]="application.verificationStatus === 'PENDING'" [class.badge-success]="application.verificationStatus === 'APPROVED'" [class.badge-danger]="application.verificationStatus === 'REJECTED'">{{ application.verificationStatus }}</span>
                  <h2>{{ application.firstName }} {{ application.lastName }}</h2>
                  <p>{{ application.email }} @if (application.phone) { <span>- {{ application.phone }}</span> }</p>
                </div>
                <span class="avatar large">{{ initials(application) }}</span>
              </div>

              <div class="decision-summary">
                <div>
                  <small>Specialty</small>
                  <strong>{{ application.expertise || 'Not provided' }}</strong>
                </div>
                <div>
                  <small>Submitted</small>
                  <strong>{{ application.submittedAt ? (application.submittedAt | date:'mediumDate') : 'Unknown' }}</strong>
                </div>
                <div>
                  <small>Account</small>
                  <strong>{{ application.userStatus }}</strong>
                </div>
              </div>

              <div class="profile-grid">
                <section>
                  <strong>Bio</strong>
                  <p>{{ application.bio || 'Not provided' }}</p>
                </section>
                <section>
                  <strong>Motivation</strong>
                  <p>{{ application.motivation || 'Not provided' }}</p>
                </section>
              </div>

              <div class="portfolio-row">
                @if (application.portfolioUrl) {
                  <a [href]="application.portfolioUrl" target="_blank" rel="noreferrer">Portfolio</a>
                }
                @if (application.socialLinks) {
                  <span>{{ application.socialLinks }}</span>
                }
              </div>

              <div class="document-panel">
                <div>
                  <strong>Documents</strong>
                  <p>Preview the CV before approving access. Other documents open in a new tab.</p>
                </div>
                <div class="document-actions">
                  @if (application.cvUrl) {
                    <button class="btn btn-secondary" type="button" (click)="openCvPreview(application)">
                      Preview CV
                    </button>
                    <a class="btn btn-secondary" [href]="resourceUrl(application.cvUrl)" target="_blank" rel="noreferrer">Open CV</a>
                  }
                  @if (application.certificateUrl) {
                    <a class="btn btn-secondary" [href]="resourceUrl(application.certificateUrl)" target="_blank" rel="noreferrer">Certificate</a>
                  }
                  @if (application.diplomaUrl) {
                    <a class="btn btn-secondary" [href]="resourceUrl(application.diplomaUrl)" target="_blank" rel="noreferrer">Diploma</a>
                  }
                </div>
              </div>

              @if (application.rejectionReason) {
                <div class="rejection-note">
                  <strong>Rejection reason</strong>
                  <p>{{ application.rejectionReason }}</p>
                </div>
              }

              <div class="form-actions">
                @if (application.verificationStatus !== 'REJECTED') {
                  <button class="btn btn-danger" type="button" (click)="openReview(application, 'reject')" [disabled]="busy()">
                    Reject
                  </button>
                }
                @if (application.verificationStatus !== 'APPROVED') {
                  <button class="btn btn-primary" type="button" (click)="openReview(application, 'approve')" [disabled]="busy()">
                    Approve
                  </button>
                }
              </div>
            </article>
          }
        </section>
      } @else {
        <ui-empty-state
          icon="verified_user"
          [title]="'No ' + statusLabel(activeStatus()).toLowerCase() + ' trainer applications'"
          description="Try another status filter or search term."
        />
      }

      <ui-modal [title]="reviewTitle()" [open]="!!reviewApplication()" (closed)="closeReview()">
        @if (reviewApplication(); as selected) {
          <div class="review-stack">
            <p>
              {{ reviewAction() === 'approve'
                ? 'Approve this trainer and activate dashboard access?'
                : 'Reject this trainer application and keep dashboard access blocked?' }}
            </p>
            <strong>{{ selected.firstName }} {{ selected.lastName }} - {{ selected.email }}</strong>
            @if (reviewAction() === 'reject') {
              <label class="field">
                <span>Rejection reason</span>
                <textarea
                  class="control textarea"
                  [(ngModel)]="rejectionReason"
                  placeholder="Give a clear reason the trainer can understand."
                ></textarea>
              </label>
            }
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="closeReview()" [disabled]="busy()">Cancel</button>
              <button class="btn btn-primary" type="button" (click)="confirmReview()" [disabled]="busy() || rejectReasonMissing()">
                {{ busy() ? 'Saving...' : reviewTitle() }}
              </button>
            </div>
          </div>
        }
      </ui-modal>

      <ui-modal title="CV preview" [open]="!!previewApplication()" (closed)="closeCvPreview()">
        @if (previewApplication()?.cvUrl) {
          <div class="pdf-preview">
            <iframe [src]="safeCvUrl()" title="Trainer CV preview"></iframe>
            <a class="btn btn-secondary" [href]="resourceUrl(previewApplication()!.cvUrl!)" target="_blank" rel="noreferrer">Open in new tab</a>
          </div>
        }
      </ui-modal>
    </div>
  `,
  styles: [`
    .review-toolbar { display: grid; grid-template-columns: 1fr minmax(260px, 420px) auto; align-items: center; gap: 14px; }
    .status-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
    .status-tab { border: 1px solid var(--color-border); border-radius: 999px; background: #fff; color: var(--color-muted); padding: 9px 14px; font-weight: 850; cursor: pointer; }
    .status-tab.active { color: #fff; border-color: var(--color-primary); background: var(--color-primary); box-shadow: 0 10px 26px rgba(79, 70, 229, 0.22); }
    .search-field { display: flex; align-items: center; gap: 8px; padding: 0 12px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; }
    .search-field span { color: var(--color-muted); }
    .search-field .control { border: 0; box-shadow: none; padding-left: 0; }
    .decision-grid { display: grid; grid-template-columns: minmax(280px, 360px) minmax(0, 1fr); gap: 20px; align-items: start; }
    .application-list { display: grid; gap: 10px; }
    .candidate-card { display: grid; grid-template-columns: 46px minmax(0, 1fr); gap: 12px; width: 100%; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; text-align: left; cursor: pointer; box-shadow: var(--shadow-soft); }
    .candidate-card.selected { border-color: var(--color-primary); box-shadow: 0 12px 30px rgba(79, 70, 229, 0.16); }
    .candidate-card strong, .candidate-card small { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .candidate-card strong { color: var(--color-heading); }
    .candidate-card small { margin: 3px 0 8px; color: var(--color-muted); }
    .avatar { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-weight: 900; }
    .avatar.large { width: 58px; height: 58px; border-radius: 20px; }
    .application-detail { display: grid; gap: 18px; }
    .detail-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; }
    .detail-head h2, .detail-head p, .profile-grid p, .document-panel p, .rejection-note p, .review-stack p { margin: 0; }
    .detail-head h2 { margin-top: 10px; color: var(--color-heading); font-size: 26px; line-height: 1.2; font-weight: 900; }
    .detail-head p, .profile-grid p, .document-panel p, .rejection-note p { color: var(--color-muted); line-height: 1.55; }
    .decision-summary { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .decision-summary div, .profile-grid section, .document-panel, .rejection-note { padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .decision-summary small, .profile-grid strong, .document-panel strong, .rejection-note strong { display: block; color: var(--color-muted); font-size: 12px; font-weight: 850; text-transform: uppercase; }
    .decision-summary strong { display: block; margin-top: 5px; color: var(--color-heading); }
    .profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .profile-grid p, .rejection-note p { margin-top: 6px; }
    .portfolio-row, .document-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .portfolio-row a, .portfolio-row span { padding: 8px 10px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 12px; font-weight: 850; }
    .document-panel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 14px; align-items: center; }
    .rejection-note { border-color: #fecaca; background: #fef2f2; }
    .badge { display: inline-flex; width: fit-content; align-items: center; padding: 6px 10px; border-radius: 999px; font-size: 11px; font-weight: 900; }
    .badge-warning { color: #92400e; background: #fef3c7; }
    .badge-success { color: #047857; background: #d1fae5; }
    .badge-danger { color: #b91c1c; background: #fee2e2; }
    .review-stack { display: grid; gap: 16px; }
    .review-stack strong { color: var(--color-heading); }
    .textarea { min-height: 120px; resize: vertical; }
    .pdf-preview { display: grid; gap: 14px; }
    .pdf-preview iframe { width: min(78vw, 860px); height: min(72vh, 680px); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; }
    @media (max-width: 1100px) {
      .review-toolbar, .decision-grid, .document-panel { grid-template-columns: 1fr; }
      .decision-summary, .profile-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class TrainerApplicationsPage implements OnInit {
  private readonly trainers = inject(TrainerService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly statuses: TrainerVerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly activeStatus = signal<TrainerVerificationStatus>('PENDING');
  readonly applications = signal<TrainerApplicationResponse[]>([]);
  readonly allApplications = signal<{ pending: number; approved: number; rejected: number }>({ pending: 0, approved: 0, rejected: 0 });
  readonly selectedApplication = signal<TrainerApplicationResponse | null>(null);
  readonly reviewApplication = signal<TrainerApplicationResponse | null>(null);
  readonly previewApplication = signal<TrainerApplicationResponse | null>(null);
  readonly reviewAction = signal<ReviewAction>('approve');
  searchTerm = '';
  rejectionReason = '';

  ngOnInit(): void {
    this.load();
  }

  setStatus(status: TrainerVerificationStatus): void {
    this.activeStatus.set(status);
    this.searchTerm = '';
    this.selectedApplication.set(null);
    this.load();
  }

  filteredApplications(): TrainerApplicationResponse[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.applications();
    }
    return this.applications().filter((application) => {
      const fullName = `${application.firstName} ${application.lastName}`.toLowerCase();
      return fullName.includes(term) || application.email.toLowerCase().includes(term);
    });
  }

  selectApplication(application: TrainerApplicationResponse): void {
    this.selectedApplication.set(application);
  }

  initials(application: TrainerApplicationResponse): string {
    return `${application.firstName?.[0] ?? ''}${application.lastName?.[0] ?? ''}`.toUpperCase() || 'TR';
  }

  statusLabel(status: TrainerVerificationStatus): string {
    return status[0] + status.slice(1).toLowerCase();
  }

  resourceUrl(url: string): string {
    const apiOrigin = environment.apiBaseUrl.replace(/\/api\/v1$/, '');
    return url.startsWith('http') ? url : `${apiOrigin}${url}`;
  }

  openCvPreview(application: TrainerApplicationResponse): void {
    this.previewApplication.set(application);
  }

  closeCvPreview(): void {
    this.previewApplication.set(null);
  }

  safeCvUrl(): SafeResourceUrl | null {
    const url = this.previewApplication()?.cvUrl;
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(this.resourceUrl(url)) : null;
  }

  openReview(application: TrainerApplicationResponse, action: ReviewAction): void {
    this.reviewApplication.set(application);
    this.reviewAction.set(action);
    this.rejectionReason = '';
  }

  closeReview(): void {
    this.reviewApplication.set(null);
    this.rejectionReason = '';
  }

  reviewTitle(): string {
    return this.reviewAction() === 'approve' ? 'Approve trainer' : 'Reject trainer';
  }

  rejectReasonMissing(): boolean {
    return this.reviewAction() === 'reject' && !this.rejectionReason.trim();
  }

  confirmReview(): void {
    const application = this.reviewApplication();
    if (!application || this.rejectReasonMissing()) {
      return;
    }
    this.busy.set(true);
    const request = this.reviewAction() === 'approve'
      ? this.trainers.approveApplication(application.trainerId)
      : this.trainers.rejectApplication(application.trainerId, this.rejectionReason);
    request.subscribe({
      next: (response) => {
        this.busy.set(false);
        this.closeReview();
        this.toast.success(response.message || 'Trainer application updated.');
        this.load();
      },
      error: (error) => {
        this.busy.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  pendingCount(): number { return this.allApplications().pending; }
  approvedCount(): number { return this.allApplications().approved; }
  rejectedCount(): number { return this.allApplications().rejected; }

  load(): void {
    this.loading.set(true);
    this.trainers.applications(this.activeStatus()).subscribe({
      next: (response) => {
        const items = response.data ?? [];
        this.applications.set(items);
        this.selectedApplication.set(items[0] ?? null);
        this.allApplications.update(counts => ({
          ...counts,
          [this.activeStatus().toLowerCase()]: items.length
        }));
      },
      error: (error) => this.toast.error(parseApiError(error).message),
      complete: () => this.loading.set(false)
    });
  }
}
