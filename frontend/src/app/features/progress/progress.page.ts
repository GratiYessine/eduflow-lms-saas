import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { ProgressResponse, TrainerApprovalResponse, TrainingResponse } from '../../core/models/api.models';
import { CertificateService } from '../../core/services/certificate.service';
import { ProgressService } from '../../core/services/progress.service';
import { ToastService } from '../../core/services/toast.service';
import { TrainerService } from '../../core/services/trainer.service';
import { TrainingService } from '../../core/services/training.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

type ProgressFilter = 'all' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'NOT_STARTED';

@Component({
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiProgressBarComponent, UiEmptyStateComponent, UiBadgeComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Progress" [title]="title()" [description]="description()" />

      @if (loading()) {
        <section class="grid grid-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="card skeleton-grid" style="min-height: 90px;">
              <div class="skeleton-row" style="height: 14px; width: 50%;"></div>
              <div class="skeleton-row" style="height: 28px; width: 35%;"></div>
            </div>
          }
        </section>
        <section class="card skeleton-grid">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-row" style="height: 120px;"></div>
          }
        </section>
      } @else {
        <section class="grid grid-4">
          <ui-stat-card label="Total" [value]="progress().length" icon="trending_up" trend="All progress records" />
          <ui-stat-card label="In progress" [value]="statusCount('IN_PROGRESS')" icon="play_circle" trend="Currently learning" />
          <ui-stat-card label="Completed" [value]="statusCount('COMPLETED') + statusCount('APPROVED')" icon="task_alt" trend="Finished trainings" />
          <ui-stat-card label="Avg progress" [value]="avgProgress() + '%'" icon="bar_chart" trend="Across all trainings" />
        </section>

        <section class="card">
          <div class="toolbar">
            <div>
              <h2>{{ progressTitle() }}</h2>
              <p class="muted">{{ progress().length }} record{{ progress().length === 1 ? '' : 's' }} total.</p>
            </div>
          </div>

          <div class="filter-bar" style="margin-top: 16px;">
            <div class="search-input-wrap">
              <span class="material-symbols-outlined">search</span>
              <input class="control" placeholder="Search by training name..." (input)="onSearch($event)" />
            </div>
            <div class="segmented" role="group" aria-label="Status filter">
              <button class="segment" type="button" [class.active]="statusFilter() === 'all'" (click)="statusFilter.set('all')">All</button>
              <button class="segment" type="button" [class.active]="statusFilter() === 'IN_PROGRESS'" (click)="statusFilter.set('IN_PROGRESS')">In progress</button>
              <button class="segment" type="button" [class.active]="statusFilter() === 'COMPLETED'" (click)="statusFilter.set('COMPLETED')">Completed</button>
              <button class="segment" type="button" [class.active]="statusFilter() === 'APPROVED'" (click)="statusFilter.set('APPROVED')">Approved</button>
            </div>
          </div>

          @if (filteredProgress().length) {
            <div class="progress-grid">
              @for (item of filteredProgress(); track item.id) {
                <article class="progress-card card-interactive">
                  <div class="toolbar">
                    <div>
                      <h3>{{ trainingName(item.trainingId) }}</h3>
                      <p class="muted">{{ item.completedLessons }} lessons completed</p>
                    </div>
                    <ui-badge [tone]="statusTone(item.status)">{{ statusLabel(item.status) }}</ui-badge>
                  </div>
                  <ui-progress-bar [value]="item.progressPercentage" />
                  <div class="progress-meta">
                    <span>{{ item.progressPercentage }}% complete</span>
                    <span>{{ item.completedAt ? completedLabel(item.completedAt) : 'In progress' }}</span>
                  </div>
                  <div class="form-actions">
                    <a class="btn btn-secondary btn-sm" [routerLink]="['/trainings', item.trainingId]">
                      <span class="material-symbols-outlined">open_in_new</span>
                      Open training
                    </a>
                    @if (canApprove() && item.status === 'COMPLETED') {
                      <button class="btn btn-primary btn-sm" type="button" (click)="approve(item)" [disabled]="busyId() === item.id">Approve</button>
                    }
                    @if (canApprove() && item.status === 'APPROVED') {
                      <button class="btn btn-primary btn-sm" type="button" (click)="generateCertificate(item)" [disabled]="busyId() === item.id">Certificate</button>
                    }
                  </div>
                </article>
              }
            </div>
          } @else {
            <ui-empty-state
              icon="trending_up"
              [title]="emptyTitle()"
              [description]="emptyFilterText()"
              style="margin-top: 16px;"
            >
              @if (role() === 'LEARNER' && statusFilter() === 'all') {
                <a class="btn btn-primary" routerLink="/trainings">Open assigned trainings</a>
              }
            </ui-empty-state>
          }
        </section>

        @if (role() === 'TRAINER') {
          <section class="card">
            <div class="toolbar">
              <div>
                <h2>Trainer approval feed</h2>
                <p class="muted">Completed learners waiting for approval.</p>
              </div>
              <span class="badge badge-warning">{{ trainerApprovals().length }} pending</span>
            </div>
            <div class="approval-list">
              @for (item of trainerApprovals(); track item.progressId) {
                <article class="approval-row">
                  <span class="approval-icon material-symbols-outlined">task_alt</span>
                  <div>
                    <strong>{{ item.firstName }} {{ item.lastName }}</strong>
                    <small>{{ item.trainingTitle }} · {{ item.progressPercentage }}% · Score {{ item.quizScore ?? '—' }}%</small>
                  </div>
                  <div class="form-actions compact-actions">
                    <button class="btn btn-danger btn-sm" type="button" (click)="rejectApproval(item)" [disabled]="busyId() === item.progressId">Reject</button>
                    <button class="btn btn-primary btn-sm" type="button" (click)="approveApproval(item)" [disabled]="busyId() === item.progressId">Approve</button>
                    <button class="btn btn-secondary btn-sm" type="button" (click)="generateApprovalCertificate(item)" [disabled]="busyId() === item.progressId || item.certificateGenerated">Certificate</button>
                  </div>
                </article>
              } @empty {
                <p class="empty-inline">No learners waiting for approval.</p>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    h2, h3, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 20px; font-weight: 900; }
    h3 { color: var(--color-heading); font-size: 16px; font-weight: 900; }
    .toolbar > div { display: grid; gap: 4px; }
    .progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
    .progress-card { display: grid; gap: var(--space-4); padding: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); }
    .progress-meta { display: flex; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; color: var(--color-muted); font-size: 12px; font-weight: 850; }
    .approval-list { display: grid; gap: var(--space-3); margin-top: var(--space-4); }
    .approval-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: var(--space-3); align-items: center; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .approval-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: var(--color-primary); background: var(--color-primary-soft); }
    .approval-row strong { display: block; color: var(--color-heading); }
    .approval-row small { color: var(--color-muted); font-size: 12px; font-weight: 700; }
    .compact-actions { gap: var(--space-2); flex-wrap: wrap; justify-content: flex-end; }
    @media (max-width: 720px) { .approval-row { grid-template-columns: 1fr; } .progress-grid { grid-template-columns: 1fr; } }
  `]
})
export class ProgressPage implements OnInit {
  private readonly progressService = inject(ProgressService);
  private readonly trainingService = inject(TrainingService);
  private readonly certificateService = inject(CertificateService);
  private readonly trainerService = inject(TrainerService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly busyId = signal<number | null>(null);
  readonly progress = signal<ProgressResponse[]>([]);
  readonly trainings = signal<TrainingResponse[]>([]);
  readonly trainerApprovals = signal<TrainerApprovalResponse[]>([]);
  readonly role = computed(() => this.auth.currentUser()?.role ?? 'LEARNER');
  readonly statusFilter = signal<ProgressFilter>('all');
  readonly searchQuery = signal('');

  ngOnInit(): void {
    this.auth.ensureCurrentUser().pipe(catchError(() => of(null))).subscribe(() => this.load());
  }

  title(): string {
    return this.role() === 'TRAINER' ? 'Learner progress' : 'Learning progress';
  }

  description(): string {
    return this.role() === 'TRAINER'
      ? 'Approve completions and issue certificates.'
      : 'Track completion across assigned trainings.';
  }

  progressTitle(): string {
    return this.role() === 'LEARNER' ? 'My progress' : 'Progress overview';
  }

  emptyTitle(): string {
    return this.role() === 'TRAINER' ? 'No progress feed' : 'No progress yet';
  }

  emptyFilterText(): string {
    if (this.statusFilter() !== 'all' || this.searchQuery()) {
      return 'No records match your current filters. Try adjusting your search.';
    }
    return this.role() === 'TRAINER'
      ? 'No learner completions waiting for approval.'
      : 'Open an assigned training to start tracking progress.';
  }

  avgProgress(): number {
    const p = this.progress();
    if (!p.length) return 0;
    return Math.round(p.reduce((sum, item) => sum + Number(item.progressPercentage ?? 0), 0) / p.length);
  }

  statusCount(status: string): number {
    return this.progress().filter(p => p.status === status).length;
  }

  filteredProgress(): ProgressResponse[] {
    let result = this.progress();
    const filter = this.statusFilter();
    if (filter !== 'all') {
      result = result.filter(p => p.status === filter);
    }
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(p => this.trainingName(p.trainingId).toLowerCase().includes(query));
    }
    return result;
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  canApprove(): boolean {
    return this.auth.hasRole(['TRAINER', 'SUPER_ADMIN']);
  }

  statusTone(status: ProgressResponse['status']): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'APPROVED' || status === 'COMPLETED') return 'success';
    if (status === 'IN_PROGRESS') return 'info';
    if (status === 'REJECTED') return 'danger';
    return 'warning';
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());
  }

  trainingName(id: number): string {
    return this.trainings().find((training) => training.id === id)?.title ?? `Training #${id}`;
  }

  completedLabel(value: string): string {
    return `Completed ${new Date(value).toLocaleDateString()}`;
  }

  approve(item: ProgressResponse): void {
    this.busyId.set(item.id);
    this.progressService.approve(item.id).subscribe({
      next: (response) => {
        this.busyId.set(null);
        if (response.data) {
          this.progress.update((rows) => rows.map((row) => row.id === response.data?.id ? response.data! : row));
        }
        this.toast.success(response.message || 'Progress approved.');
      },
      error: (error) => {
        this.busyId.set(null);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  generateCertificate(item: ProgressResponse): void {
    this.busyId.set(item.id);
    this.certificateService.generate(item.id).subscribe({
      next: (response) => {
        this.busyId.set(null);
        this.toast.success(response.message || 'Certificate generated.');
      },
      error: (error) => {
        this.busyId.set(null);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  approveApproval(item: TrainerApprovalResponse): void {
    this.busyId.set(item.progressId);
    this.progressService.approve(item.progressId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.trainerApprovals.update((rows) => rows.filter((row) => row.progressId !== item.progressId));
        this.toast.success('Progress approved.');
      },
      error: (error) => {
        this.busyId.set(null);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  rejectApproval(item: TrainerApprovalResponse): void {
    this.busyId.set(item.progressId);
    this.progressService.reject(item.progressId).subscribe({
      next: () => {
        this.busyId.set(null);
        this.trainerApprovals.update((rows) => rows.filter((row) => row.progressId !== item.progressId));
        this.toast.success('Progress rejected.');
      },
      error: (error) => {
        this.busyId.set(null);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  generateApprovalCertificate(item: TrainerApprovalResponse): void {
    this.busyId.set(item.progressId);
    this.certificateService.generate(item.progressId).subscribe({
      next: (response) => {
        this.busyId.set(null);
        this.trainerApprovals.update((rows) => rows.map((row) => row.progressId === item.progressId ? { ...row, certificateGenerated: true } : row));
        this.toast.success(response.message || 'Certificate generated.');
      },
      error: (error) => {
        this.busyId.set(null);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private load(): void {
    this.loading.set(true);
    forkJoin({
      progress: this.progressService.my().pipe(catchError(() => of(null))),
      trainings: this.trainingService.list({ page: 0, size: 100, sort: 'title,asc' }).pipe(catchError(() => of(null))),
      approvals: this.role() === 'TRAINER' ? this.trainerService.approvals().pipe(catchError(() => of(null))) : of(null)
    }).subscribe(({ progress, trainings, approvals }) => {
      this.progress.set(progress?.data ?? []);
      this.trainings.set(trainings?.data?.content ?? []);
      this.trainerApprovals.set(approvals?.data ?? []);
      this.loading.set(false);
    });
  }
}
