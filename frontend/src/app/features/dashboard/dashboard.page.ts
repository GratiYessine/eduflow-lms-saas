import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AssignmentResponse, CertificateResponse, NotificationResponse, ProgressResponse, Role, TeamResponse, TrainerApprovalResponse, TrainerLearnerResponse, TrainerWalletResponse, TrainingResponse } from '../../core/models/api.models';
import { AssignmentService } from '../../core/services/assignment.service';
import { CertificateService } from '../../core/services/certificate.service';
import { NotificationService } from '../../core/services/notification.service';
import { ProgressService } from '../../core/services/progress.service';
import { TeamService } from '../../core/services/team.service';
import { TrainerService } from '../../core/services/trainer.service';
import { TrainingService } from '../../core/services/training.service';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton/ui-skeleton.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';
import { CompanyTrainingAssignmentFlowComponent } from './company-training-assignment-flow.component';

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
}

interface QuickAction {
  label: string;
  body: string;
  icon: string;
  route: string;
  roles: Role[];
}

interface TimelineItem {
  id: number;
  event: string;
  message: string;
  icon: string;
  type: string;
  time: string;
}

@Component({
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiStatCardComponent, UiProgressBarComponent, UiEmptyStateComponent, UiSkeletonComponent, CompanyTrainingAssignmentFlowComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Command center" [title]="headerTitle()" [description]="headerDescription()" />

      <section class="grid grid-4">
        @for (stat of statCards(); track stat.label) {
          <ui-stat-card [label]="stat.label" [value]="stat.value" [icon]="stat.icon" [trend]="stat.trend || ''" />
        }
      </section>

      @if (isTrainer()) {
        <section class="card trainer-lifecycle">
          <div class="toolbar">
            <div>
              <h2>Trainer lifecycle</h2>
              <p class="muted">Edunet-style formateur flow adapted to EduFlow's B2B training backend.</p>
            </div>
            <span class="badge badge-success">Trainer workspace</span>
          </div>
          <div class="lifecycle-grid">
            @for (step of trainerLifecycle; track step.label) {
              <article>
                <span class="material-symbols-outlined">{{ step.icon }}</span>
                <strong>{{ step.label }}</strong>
                <small>{{ step.body }}</small>
              </article>
            }
          </div>
        </section>
      }

      @if (isCompanyAdmin()) {
        <company-training-assignment-flow (assignmentCreated)="refresh()" />
      }

      @if (loading()) {
        <section class="card loading-card"><ui-skeleton [rows]="5" /></section>
      }

      <section class="card insight-card">
        <div class="toolbar">
          <div>
            <h2>Learning health</h2>
            <p class="muted">A visual pulse of completion and active work.</p>
          </div>
          <span class="badge badge-info">KPI chart</span>
        </div>
        <div class="kpi-chart">
          <div class="donut" [style.background]="progressDonut()"><strong>{{ completionRate() }}%</strong></div>
          <div class="mini-bars">
            @for (bar of statusBreakdown(); track bar.label) {
              <div class="mini-bar">
                <header><span>{{ bar.label }}</span><strong>{{ bar.value }}%</strong></header>
                <div class="mini-bar-track"><span class="mini-bar-fill" [style.width.%]="bar.value"></span></div>
              </div>
            }
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <article class="card progress-card">
          <div class="toolbar">
            <div>
              <h2>{{ progressTitle() }}</h2>
              <p class="muted">{{ progressDescription() }}</p>
            </div>
            <span class="badge badge-info">Live</span>
          </div>

          @for (item of progressRows(); track item.name) {
            <div class="progress-row">
              <div class="toolbar"><strong>{{ item.name }}</strong><span class="muted">{{ item.value }}%</span></div>
              <ui-progress-bar [value]="item.value" />
            </div>
          } @empty {
            <ui-empty-state
              icon="trending_up"
              title="No progress yet"
              [description]="emptyProgressText()"
            />
          }
        </article>

        <aside class="quick-card">
          <div>
            <span class="quick-eyebrow">Quick actions</span>
            <h2>{{ quickTitle() }}</h2>
          </div>
          @for (action of quickActions(); track action.route) {
            <a [routerLink]="action.route">
              <span class="material-symbols-outlined">{{ action.icon }}</span>
              <strong>{{ action.label }}</strong>
              <small>{{ action.body }}</small>
            </a>
          }
        </aside>

        @if (isTrainer()) {
        <article class="card approvals-card">
            <div class="toolbar">
              <div>
                <h2>Approvals</h2>
                <p class="muted">Learners waiting for trainer validation.</p>
              </div>
              <span class="badge badge-warning">{{ approvals().length }} pending</span>
            </div>
            @if (approvals().length) {
              <div class="approval-list">
                @for (approval of approvals().slice(0, 5); track approval.progressId) {
                  <article class="approval-row">
                    <span class="material-symbols-outlined">task_alt</span>
                    <div>
                      <strong>{{ approval.firstName }} {{ approval.lastName }}</strong>
                      <small>{{ approval.trainingTitle }} - {{ approval.progressPercentage }}% complete</small>
                    </div>
                    <span class="badge badge-info">{{ approval.quizScore ?? '-' }}%</span>
                  </article>
                }
              </div>
            } @else {
              <p class="empty-inline">No learners are waiting for approval right now.</p>
            }
          </article>
        }

        <article class="card activity-card">
          <div class="toolbar">
            <div>
              <h2>Activity timeline</h2>
              <p class="muted">Notifications and workspace events from the backend.</p>
            </div>
            <span class="badge badge-success">{{ timeline().length }} events</span>
          </div>
          @if (timeline().length) {
            <div class="timeline">
              @for (item of timeline(); track item.id) {
                <article class="timeline-item">
                  <span class="timeline-icon material-symbols-outlined">{{ item.icon }}</span>
                  <div class="timeline-copy">
                    <strong>{{ item.event }}</strong>
                    <p>{{ item.message }}</p>
                  </div>
                  <span class="badge badge-info">{{ item.time }}</span>
                </article>
              }
            </div>
          } @else {
            <p class="empty-inline">No recent activity yet. New assignments, invitations and approvals will appear here.</p>
          }
        </article>
      </section>
    </div>
  `,
  styles: [`
    .loading-card { justify-content: flex-start; }
    .insight-card { display: grid; gap: var(--space-5); }
    .dashboard-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(300px, 0.95fr); gap: 24px; align-items: start; }
    .progress-card { min-height: 410px; }
    .progress-row { display: grid; gap: 8px; margin-top: 22px; }
    h2 { margin: 0; color: var(--color-heading); font-size: 22px; line-height: 1.25; font-weight: 900; letter-spacing: 0; }
    .toolbar p { margin: 4px 0 0; }
    .quick-card { display: grid; gap: 14px; padding: 24px; border: 1px solid rgba(199, 210, 254, 0.16); border-radius: var(--radius-xl); background: radial-gradient(circle at top right, rgba(129,140,248,0.28), transparent 34%), linear-gradient(180deg, #1e1b4b 0%, #312e81 100%); color: #fff; box-shadow: 0 24px 50px rgba(49, 46, 129, 0.24); }
    .quick-eyebrow { display: inline-flex; margin-bottom: 8px; color: rgba(226,232,240,0.7); font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    .quick-card a { display: grid; grid-template-columns: 44px 1fr; gap: 2px 14px; align-items: center; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.1); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); transition: background 180ms ease, transform 180ms ease; }
    .quick-card a:hover { transform: translateY(-1px); background: rgba(255,255,255,0.16); }
    .quick-card a > span { grid-row: span 2; display: grid; place-items: center; width: 44px; height: 44px; border-radius: 14px; background: rgba(255,255,255,0.12); }
    .quick-card strong { font-size: 15px; }
    .quick-card small { color: rgba(255,255,255,0.72); line-height: 1.4; }
    .trainer-lifecycle { display: grid; gap: var(--space-5); }
    .lifecycle-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .lifecycle-grid article { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: rgba(248,250,252,0.78); }
    .lifecycle-grid article > span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: var(--color-primary); background: var(--color-primary-soft); }
    .lifecycle-grid strong { color: var(--color-heading); }
    .lifecycle-grid small { color: var(--color-muted); line-height: 1.45; }
    .activity-card, .approvals-card { grid-column: 1 / -1; }
    .approval-list { display: grid; gap: 12px; }
    .approval-row { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .approval-row > span:first-child { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: var(--color-primary); background: var(--color-primary-soft); }
    .approval-row strong { display: block; color: var(--color-heading); }
    .approval-row small { color: var(--color-muted); }
    @media (max-width: 960px) { .dashboard-grid { grid-template-columns: 1fr; } }
    @media (max-width: 1100px) { .lifecycle-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .lifecycle-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly trainings = inject(TrainingService);
  private readonly teams = inject(TeamService);
  private readonly progress = inject(ProgressService);
  private readonly certificates = inject(CertificateService);
  private readonly notifications = inject(NotificationService);
  private readonly assignments = inject(AssignmentService);
  private readonly trainerService = inject(TrainerService);

  readonly loading = signal(true);
  readonly statCards = signal<StatCard[]>([]);
  readonly progressRows = signal<Array<{ name: string; value: number }>>([]);
  readonly timeline = signal<TimelineItem[]>([]);
  readonly approvals = signal<TrainerApprovalResponse[]>([]);
  readonly trainerLearners = signal<TrainerLearnerResponse[]>([]);
  readonly wallet = signal<TrainerWalletResponse | null>(null);
  readonly completionRate = signal(0);
  readonly statusBreakdown = signal<Array<{ label: string; value: number }>>([
    { label: 'Published', value: 0 },
    { label: 'In progress', value: 0 },
    { label: 'Completed', value: 0 }
  ]);
  readonly role = computed(() => this.auth.currentUser()?.role ?? 'LEARNER');

  readonly allQuickActions: QuickAction[] = [
    { label: 'Create training', body: 'Build lessons and quizzes', icon: 'add_circle', route: '/trainings/create', roles: ['TRAINER', 'SUPER_ADMIN'] },
    { label: 'Manage catalog', body: 'Review publishing status', icon: 'auto_stories', route: '/trainings', roles: ['TRAINER', 'SUPER_ADMIN'] },
    { label: 'Learner progress', body: 'Review approvals and completions', icon: 'task_alt', route: '/progress', roles: ['TRAINER', 'SUPER_ADMIN'] },
    { label: 'Edit portfolio', body: 'Update trainer profile', icon: 'badge', route: '/profile', roles: ['TRAINER'] },
    { label: 'Assign training', body: 'Target companies and teams', icon: 'assignment_add', route: '/assignments', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER'] },
    { label: 'Invite members', body: 'Provision learners and admins', icon: 'person_add', route: '/users', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'Continue learning', body: 'Open assigned trainings', icon: 'play_lesson', route: '/trainings', roles: ['LEARNER'] },
    { label: 'View certificates', body: 'Download credentials', icon: 'workspace_premium', route: '/certificates', roles: ['LEARNER', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'SUPER_ADMIN'] }
  ];

  readonly trainerLifecycle = [
    { icon: 'badge', label: 'Profile', body: 'Maintain expertise, bio, portfolio and avatar.' },
    { icon: 'auto_stories', label: 'Trainings', body: 'Create, edit, publish, archive and delete programs.' },
    { icon: 'menu_book', label: 'Lessons', body: 'Build lesson content, ordering, preview state and videos.' },
    { icon: 'quiz', label: 'Quizzes', body: 'Create evaluation questions and answer choices per lesson.' },
    { icon: 'groups', label: 'Learners', body: 'Review assigned learners per training with progress state.' },
    { icon: 'task_alt', label: 'Approvals', body: 'Approve or reject completed learner progress.' },
    { icon: 'workspace_premium', label: 'Certificates', body: 'Generate certificates from approved progress records.' },
    { icon: 'payments', label: 'Revenue', body: 'Review wallet totals from active training assignments.' }
  ];

  ngOnInit(): void {
    this.auth.ensureCurrentUser().pipe(catchError(() => of(null))).subscribe(() => this.load());
  }

  headerTitle(): string {
    const name = this.auth.currentUser()?.firstName;
    switch (this.role()) {
      case 'TRAINER':
        return `Trainer workspace${name ? `, ${name}` : ''}`;
      case 'LEARNER':
        return `Learning dashboard${name ? `, ${name}` : ''}`;
      case 'SUPER_ADMIN':
        return 'Platform overview';
      default:
        return 'Organization overview';
    }
  }

  headerDescription(): string {
    switch (this.role()) {
      case 'TRAINER':
        return 'Publish programs, manage course content, and monitor completion workflows.';
      case 'LEARNER':
        return 'Continue assigned learning, follow progress, and collect certificates.';
      case 'SUPER_ADMIN':
        return 'Monitor platform content, companies, users, and certification activity.';
      default:
        return 'Monitor team assignments, learner progress, and learning operations.';
    }
  }

  progressTitle(): string {
    return this.role() === 'LEARNER' ? 'My learning progress' : 'Progress snapshot';
  }

  progressDescription(): string {
    return this.role() === 'TRAINER'
      ? 'Learner progress from trainer-owned trainings.'
      : 'Completion rates across assigned trainings.';
  }

  quickTitle(): string {
    return this.role() === 'LEARNER' ? 'Next steps' : 'Operate faster';
  }

  emptyProgressText(): string {
    return this.role() === 'TRAINER'
      ? 'Learner progress appears here when assigned learners start training.'
      : 'Assigned trainings will create progress records when learners start.';
  }

  isTrainer(): boolean {
    return this.role() === 'TRAINER';
  }

  isCompanyAdmin(): boolean {
    return this.role() === 'COMPANY_ADMIN';
  }

  refresh(): void {
    this.load();
  }

  quickActions(): QuickAction[] {
    const role = this.role();
    return this.allQuickActions.filter((action) => action.roles.includes(role)).slice(0, 4);
  }

  progressDonut(): string {
    return `conic-gradient(var(--color-primary) ${this.completionRate()}%, rgba(215, 227, 248, 0.9) 0)`;
  }

  private load(): void {
    this.loading.set(true);
    const currentUser = this.auth.currentUser();
    const trainingParams = {
      page: 0,
      size: 8,
      sort: 'createdAt,desc',
      trainerId: currentUser?.role === 'TRAINER' ? currentUser.id : undefined
    };
    const canLoadTeams = currentUser?.role !== 'TRAINER';
    forkJoin({
      trainings: this.trainings.list(trainingParams).pipe(catchError(() => of(null))),
      teams: canLoadTeams ? this.teams.list({ page: 0, size: 8 }).pipe(catchError(() => of(null))) : of(null),
      progress: this.progress.my().pipe(catchError(() => of(null))),
      certificates: this.certificates.my().pipe(catchError(() => of(null))),
      assignments: this.assignments.my().pipe(catchError(() => of(null))),
      notifications: this.notifications.list({ page: 0, size: 6, sort: 'createdAt,desc' }).pipe(catchError(() => of(null))),
      trainerLearners: currentUser?.role === 'TRAINER' ? this.trainerService.learners().pipe(catchError(() => of(null))) : of(null),
      trainerApprovals: currentUser?.role === 'TRAINER' ? this.trainerService.approvals().pipe(catchError(() => of(null))) : of(null),
      wallet: currentUser?.role === 'TRAINER' ? this.trainerService.wallet().pipe(catchError(() => of(null))) : of(null)
    }).subscribe(({ trainings, teams, progress, certificates, assignments, notifications, trainerLearners, trainerApprovals, wallet }) => {
      const trainingRows = (trainings?.data?.content ?? []) as TrainingResponse[];
      const teamRows = (teams?.data?.content ?? []) as TeamResponse[];
      const progressRows = (progress?.data ?? []) as ProgressResponse[];
      const certificateRows = (certificates?.data ?? []) as CertificateResponse[];
      const assignmentRows = (assignments?.data ?? []) as AssignmentResponse[];
      const notificationRows = (notifications?.data?.content ?? []) as NotificationResponse[];
      const trainerLearnerRows = (trainerLearners?.data ?? []) as TrainerLearnerResponse[];
      const trainerApprovalRows = (trainerApprovals?.data ?? []) as TrainerApprovalResponse[];
      const walletData = (wallet?.data ?? null) as TrainerWalletResponse | null;
      this.trainerLearners.set(trainerLearnerRows);
      this.approvals.set(trainerApprovalRows);
      this.wallet.set(walletData);
      const averageProgress = progressRows.length
        ? Math.round(progressRows.reduce((sum, item) => sum + Number(item.progressPercentage ?? 0), 0) / progressRows.length)
        : 0;
      const completedRate = progressRows.length
        ? Math.round((progressRows.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length / progressRows.length) * 100)
        : averageProgress;

      this.statCards.set(this.buildStats(trainingRows, teamRows, progressRows, certificateRows, assignmentRows, averageProgress, trainerLearnerRows, trainerApprovalRows, walletData));
      this.completionRate.set(Math.max(0, Math.min(100, completedRate)));
      this.statusBreakdown.set(this.buildBreakdown(trainingRows, progressRows));
      this.progressRows.set(
        progressRows.slice(0, 5).map((item) => ({
          name: trainingRows.find((training) => training.id === item.trainingId)?.title ?? `Training #${item.trainingId}`,
          value: Number(item.progressPercentage ?? 0)
        }))
      );
      this.timeline.set(
        notificationRows.map((item) => ({
          id: item.id,
          event: item.title,
          message: item.message,
          icon: this.timelineIcon(item.type),
          type: item.type,
          time: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'
        }))
      );
      this.loading.set(false);
    });
  }

  private buildStats(
    trainings: TrainingResponse[],
    teams: TeamResponse[],
    progress: ProgressResponse[],
    certificates: CertificateResponse[],
    assignments: AssignmentResponse[],
    averageProgress: number,
    trainerLearners: TrainerLearnerResponse[] = [],
    trainerApprovals: TrainerApprovalResponse[] = [],
    wallet: TrainerWalletResponse | null = null
  ): StatCard[] {
    switch (this.role()) {
      case 'TRAINER':
        return [
          { label: 'Total trainings', value: trainings.length, icon: 'auto_stories', trend: `${trainings.filter((item) => item.status === 'PUBLISHED').length} published` },
          { label: 'Published', value: trainings.filter((item) => item.status === 'PUBLISHED').length, icon: 'public' },
          { label: 'Draft trainings', value: trainings.filter((item) => item.status === 'DRAFT').length, icon: 'edit_note' },
          { label: 'Archived', value: trainings.filter((item) => item.status === 'ARCHIVED').length, icon: 'inventory_2' },
          { label: 'Learners', value: trainerLearners.length, icon: 'groups', trend: `${trainerLearners.filter((item) => item.assignmentStatus === 'IN_PROGRESS').length} active` },
          { label: 'Pending approvals', value: trainerApprovals.length, icon: 'task_alt', trend: 'Awaiting review' },
          { label: 'Certificates', value: trainerLearners.filter((item) => item.certificateStatus === 'GENERATED').length || certificates.length, icon: 'workspace_premium' },
          { label: 'Revenue', value: `$${Number(wallet?.netRevenue ?? 0).toFixed(0)}`, icon: 'payments', trend: `${wallet?.approvedPaymentsCount ?? 0} assignment payments` }
        ];
      case 'LEARNER':
        return [
          { label: 'Assigned', value: assignments.length, icon: 'assignment' },
          { label: 'In progress', value: progress.filter((item) => item.status === 'IN_PROGRESS').length, icon: 'play_lesson' },
          { label: 'Avg progress', value: `${averageProgress}%`, icon: 'trending_up' },
          { label: 'Certificates', value: certificates.length, icon: 'workspace_premium' }
        ];
      case 'SUPER_ADMIN':
        return [
          { label: 'Trainings', value: trainings.length, icon: 'auto_stories' },
          { label: 'Teams', value: teams.length, icon: 'groups' },
          { label: 'Assignments', value: assignments.length, icon: 'assignment' },
          { label: 'Certificates', value: certificates.length, icon: 'workspace_premium' }
        ];
      default:
        return [
          { label: 'Assignments', value: assignments.length, icon: 'assignment' },
          { label: 'Teams', value: teams.length, icon: 'groups' },
          { label: 'Avg progress', value: `${averageProgress}%`, icon: 'trending_up' },
          { label: 'Certificates', value: certificates.length, icon: 'workspace_premium' }
        ];
    }
  }

  private buildBreakdown(trainings: TrainingResponse[], progress: ProgressResponse[]): Array<{ label: string; value: number }> {
    if (this.role() === 'TRAINER' || this.role() === 'SUPER_ADMIN') {
      const total = Math.max(trainings.length, 1);
      return [
        { label: 'Published', value: Math.round((trainings.filter((item) => item.status === 'PUBLISHED').length / total) * 100) },
        { label: 'Draft', value: Math.round((trainings.filter((item) => item.status === 'DRAFT').length / total) * 100) },
        { label: 'Archived', value: Math.round((trainings.filter((item) => item.status === 'ARCHIVED').length / total) * 100) }
      ];
    }
    const total = Math.max(progress.length, 1);
    return [
      { label: 'Not started', value: Math.round((progress.filter((item) => item.status === 'NOT_STARTED').length / total) * 100) },
      { label: 'In progress', value: Math.round((progress.filter((item) => item.status === 'IN_PROGRESS').length / total) * 100) },
      { label: 'Completed', value: Math.round((progress.filter((item) => item.status === 'COMPLETED' || item.status === 'APPROVED').length / total) * 100) }
    ];
  }

  private timelineIcon(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('certificate')) {
      return 'workspace_premium';
    }
    if (normalized.includes('assignment')) {
      return 'assignment';
    }
    if (normalized.includes('invite')) {
      return 'person_add';
    }
    return 'notifications';
  }
}
