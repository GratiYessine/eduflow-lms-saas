import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AssignmentResponse, CertificateResponse, ProgressResponse, TeamResponse, TrainingResponse, UserResponse } from '../../core/models/api.models';
import { AssignmentService } from '../../core/services/assignment.service';
import { CertificateService } from '../../core/services/certificate.service';
import { CompanyService } from '../../core/services/company.service';
import { ProgressService } from '../../core/services/progress.service';
import { TeamService } from '../../core/services/team.service';
import { TrainingService } from '../../core/services/training.service';
import { UserService } from '../../core/services/user.service';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

@Component({
  standalone: true,
  imports: [RouterLink, UiPageHeaderComponent, UiStatCardComponent, UiProgressBarComponent, UiEmptyStateComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Company" [title]="companyName()" description="Monitor teams, members, and learning progress." />

      <!-- Stat Cards -->
      @if (loading()) {
        <section class="grid grid-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="card skeleton-grid" style="min-height: 90px;">
              <div class="skeleton-row" style="height: 14px; width: 55%;"></div>
              <div class="skeleton-row" style="height: 28px; width: 35%;"></div>
            </div>
          }
        </section>
      } @else {
        <section class="grid grid-4">
          @for (stat of statCards(); track stat.label) {
            <ui-stat-card [label]="stat.label" [value]="stat.value" [icon]="stat.icon" [trend]="stat.trend" />
          }
        </section>
      }

      <!-- Insight + Quick Actions -->
      <section class="dash-grid">
        <article class="card insight-panel">
          <div class="toolbar">
            <div>
              <h2>Learning health</h2>
              <p class="muted">Completion rates across your organization.</p>
            </div>
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
        </article>

        <article class="card quick-panel">
          <span class="quick-eyebrow">Quick actions</span>
          <h2>Manage faster</h2>
          @for (action of quickActions; track action.route) {
            <a class="quick-action" [routerLink]="action.route">
              <span class="material-symbols-outlined">{{ action.icon }}</span>
              <div>
                <strong>{{ action.label }}</strong>
                <small>{{ action.body }}</small>
              </div>
            </a>
          }
        </article>
      </section>

      <!-- Teams -->
      <section class="card">
        <div class="toolbar">
          <div>
            <h2>Teams</h2>
            <p class="muted">{{ teams().length }} team{{ teams().length === 1 ? '' : 's' }}</p>
          </div>
          <a class="btn btn-secondary" routerLink="/teams">
            <span class="material-symbols-outlined">groups</span>
            View all
          </a>
        </div>

        @if (loading()) {
          <div class="skeleton-grid section-gap">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        } @else if (teams().length) {
          <div class="team-grid">
            @for (team of teams().slice(0, 6); track team.id) {
              <a class="team-tile card-interactive" [routerLink]="['/teams', team.id]">
                <div class="team-tile-header">
                  <span class="team-icon material-symbols-outlined">groups</span>
                  <div>
                    <strong>{{ team.name }}</strong>
                    <small>{{ (team.members?.length ?? 0) }} member{{ (team.members?.length ?? 0) === 1 ? '' : 's' }}</small>
                  </div>
                </div>
                <p class="muted">{{ team.description || 'No description' }}</p>
                <ui-progress-bar [value]="teamProgress(team)" />
                <div class="team-tile-meta">
                  <span>{{ teamProgress(team) }}% avg</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </div>
              </a>
            }
          </div>
        } @else {
          <ui-empty-state
            icon="groups"
            title="No teams yet"
            description="Create a team to organize your learners and assign trainings."
            style="margin-top: var(--space-4);"
          >
            <a class="btn btn-primary" routerLink="/teams">Create team</a>
          </ui-empty-state>
        }
      </section>

      <!-- Assignments + Top Learners -->
      @if (loading()) {
        <section class="dash-grid">
          <div class="card skeleton-grid">
            <div class="skeleton-row" style="height: 18px; width: 40%;"></div>
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
          <div class="card skeleton-grid">
            <div class="skeleton-row" style="height: 18px; width: 40%;"></div>
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        </section>
      } @else {
        <section class="dash-grid">
          <article class="card">
            <div class="toolbar">
              <div>
                <h2>Recent assignments</h2>
                <p class="muted">Latest training assignments.</p>
              </div>
              <a class="btn btn-secondary btn-sm" routerLink="/assignments">View all</a>
            </div>

            @if (assignments().length) {
              <div class="activity-list">
                @for (item of assignments().slice(0, 5); track item.id) {
                  <article class="activity-row">
                    <span class="activity-icon material-symbols-outlined">assignment</span>
                    <div>
                      <strong>{{ trainingName(item.trainingId) }}</strong>
                      <small>{{ scopeLabel(item) }} · {{ item.dueDate ? 'Due ' + item.dueDate : 'No due date' }}</small>
                    </div>
                    <span class="badge" [class]="statusBadge(item.status)">{{ item.status }}</span>
                  </article>
                }
              </div>
            } @else {
              <p class="empty-inline section-gap">No assignments yet.</p>
            }
          </article>

          <article class="card">
            <div class="toolbar">
              <div>
                <h2>Top learners</h2>
                <p class="muted">Most active by average progress.</p>
              </div>
            </div>

            @if (topLearners().length) {
              <div class="activity-list">
                @for (learner of topLearners(); track learner.id) {
                  <article class="activity-row">
                    <span class="activity-icon material-symbols-outlined">person</span>
                    <div>
                      <strong>{{ learner.name }}</strong>
                      <small>{{ learner.email }}</small>
                    </div>
                    <span class="badge badge-info">{{ learner.progress }}%</span>
                  </article>
                }
              </div>
            } @else {
              <p class="empty-inline section-gap">Progress will appear once training starts.</p>
            }
          </article>
        </section>
      }
    </div>
  `,
  styles: [`
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 18px; font-weight: 900; }
    .toolbar > div { display: grid; gap: 2px; }
    .dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); align-items: start; }
    .insight-panel { display: grid; gap: var(--space-4); }
    .quick-panel { display: grid; gap: var(--space-3); padding: var(--space-5); border: 1px solid rgba(199, 210, 254, 0.16); border-radius: var(--radius-xl); background: radial-gradient(circle at top right, rgba(129,140,248,0.28), transparent 34%), linear-gradient(180deg, #1e1b4b 0%, #312e81 100%); color: #fff; box-shadow: 0 20px 44px rgba(49, 46, 129, 0.22); }
    .quick-eyebrow { display: inline-flex; color: rgba(226,232,240,0.7); font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    .quick-panel h2 { color: #fff; font-size: 18px; }
    .quick-action { display: flex; gap: var(--space-3); align-items: center; padding: 10px var(--space-3); border-radius: var(--radius-md); background: rgba(255,255,255,0.1); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06); transition: background 180ms ease, transform 180ms ease; }
    .quick-action:hover { transform: translateY(-1px); background: rgba(255,255,255,0.16); }
    .quick-action > span { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: rgba(255,255,255,0.12); flex-shrink: 0; font-size: 20px; }
    .quick-action strong { display: block; font-size: 13px; }
    .quick-action small { color: rgba(255,255,255,0.68); font-size: 12px; line-height: 1.3; }
    .team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); margin-top: var(--space-4); }
    .team-tile { display: grid; gap: var(--space-2); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); cursor: pointer; }
    .team-tile-header { display: flex; gap: var(--space-2); align-items: center; }
    .team-icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 12px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 20px; flex-shrink: 0; }
    .team-tile-header strong { display: block; color: var(--color-heading); font-size: 14px; }
    .team-tile-header small { color: var(--color-muted); font-size: 11px; font-weight: 700; }
    .team-tile p { font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
    .team-tile-meta { display: flex; justify-content: space-between; align-items: center; color: var(--color-muted); font-size: 11px; font-weight: 800; }
    .team-tile-meta .material-symbols-outlined { font-size: 16px; color: var(--color-primary); }
    .activity-list { display: grid; gap: var(--space-2); margin-top: var(--space-3); }
    .activity-row { display: grid; grid-template-columns: 38px minmax(0, 1fr) auto; gap: var(--space-3); align-items: center; padding: 10px var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-soft); }
    .activity-icon { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 20px; }
    .activity-row strong { display: block; color: var(--color-heading); font-size: 13px; }
    .activity-row small { color: var(--color-muted); font-size: 11px; font-weight: 700; }
    @media (max-width: 960px) { .dash-grid { grid-template-columns: 1fr; } }
    @media (max-width: 760px) { .team-grid { grid-template-columns: 1fr; } }
  `]
})
export class CompanyDashboardPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly companyService = inject(CompanyService);
  private readonly teams$ = inject(TeamService);
  private readonly users$ = inject(UserService);
  private readonly assignments$ = inject(AssignmentService);
  private readonly trainings$ = inject(TrainingService);
  private readonly progress$ = inject(ProgressService);
  private readonly certificates$ = inject(CertificateService);

  readonly loading = signal(true);
  readonly companyName = signal('Organization');
  readonly teams = signal<TeamResponse[]>([]);
  readonly users = signal<UserResponse[]>([]);
  readonly assignments = signal<AssignmentResponse[]>([]);
  readonly trainings = signal<TrainingResponse[]>([]);
  readonly progressRecords = signal<ProgressResponse[]>([]);
  readonly certificates = signal<CertificateResponse[]>([]);

  readonly completionRate = signal(0);
  readonly statusBreakdown = signal<Array<{ label: string; value: number }>>([
    { label: 'Not started', value: 0 },
    { label: 'In progress', value: 0 },
    { label: 'Completed', value: 0 }
  ]);

  readonly statCards = computed(() => {
    const u = this.users();
    const t = this.teams();
    const a = this.assignments();
    const c = this.certificates();
    const p = this.progressRecords();
    const avgProgress = p.length
      ? Math.round(p.reduce((sum, item) => sum + Number(item.progressPercentage ?? 0), 0) / p.length)
      : 0;
    return [
      { label: 'Total members', value: u.length, icon: 'people', trend: `${u.filter(x => x.status === 'ACTIVE').length} active` },
      { label: 'Teams', value: t.length, icon: 'groups', trend: `${t.reduce((sum, team) => sum + (team.members?.length ?? 0), 0)} total members` },
      { label: 'Assignments', value: a.length, icon: 'assignment', trend: `${this.trainings().length} trainings` },
      { label: 'Avg progress', value: `${avgProgress}%`, icon: 'trending_up', trend: `${c.length} certificates` }
    ];
  });

  readonly topLearners = computed(() => {
    const progress = this.progressRecords();
    const users = this.users();
    const learnerMap = new Map<number, { total: number; count: number }>();
    progress.forEach(p => {
      const entry = learnerMap.get(p.learnerId) ?? { total: 0, count: 0 };
      entry.total += Number(p.progressPercentage ?? 0);
      entry.count += 1;
      learnerMap.set(p.learnerId, entry);
    });
    return Array.from(learnerMap.entries())
      .map(([id, data]) => {
        const user = users.find(u => u.id === id);
        return {
          id,
          name: user ? `${user.firstName} ${user.lastName}` : `Learner #${id}`,
          email: user?.email ?? '',
          progress: Math.round(data.total / data.count)
        };
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5);
  });

  readonly quickActions = [
    { label: 'Assign training', body: 'Target teams or learners', icon: 'assignment_add', route: '/assignments' },
    { label: 'Manage teams', body: 'Create and organize teams', icon: 'groups', route: '/teams' },
    { label: 'Invite members', body: 'Provision new learners', icon: 'person_add', route: '/users' },
    { label: 'View progress', body: 'Track learning completion', icon: 'trending_up', route: '/progress' }
  ];

  ngOnInit(): void {
    this.auth.ensureCurrentUser().pipe(catchError(() => of(null))).subscribe(() => this.load());
  }

  teamProgress(team: TeamResponse): number {
    const members = team.members ?? [];
    if (!members.length) return 0;
    const memberIds = new Set(members.map(m => m.userId));
    const memberProgress = this.progressRecords().filter(p => memberIds.has(p.learnerId));
    if (!memberProgress.length) return 0;
    return Math.round(memberProgress.reduce((sum, p) => sum + Number(p.progressPercentage ?? 0), 0) / memberProgress.length);
  }

  trainingName(id: number): string {
    return this.trainings().find(t => t.id === id)?.title ?? `Training #${id}`;
  }

  scopeLabel(assignment: AssignmentResponse): string {
    if (assignment.learnerId) {
      const user = this.users().find(u => u.id === assignment.learnerId);
      return user ? `${user.firstName} ${user.lastName}` : `Learner #${assignment.learnerId}`;
    }
    if (assignment.teamId) {
      return this.teams().find(t => t.id === assignment.teamId)?.name ?? `Team #${assignment.teamId}`;
    }
    return 'Company-wide';
  }

  statusBadge(status: string): string {
    const s = status?.toUpperCase();
    if (s === 'ACTIVE' || s === 'COMPLETED' || s === 'APPROVED') return 'badge-success';
    if (s === 'PENDING' || s === 'CREATING' || s === 'IN_PROGRESS') return 'badge-warning';
    if (s === 'REJECTED' || s === 'SUSPENDED') return 'badge-danger';
    return 'badge-info';
  }

  progressDonut(): string {
    return `conic-gradient(var(--color-primary) ${this.completionRate()}%, rgba(215, 227, 248, 0.9) 0)`;
  }

  private load(): void {
    this.loading.set(true);
    const companyId = this.auth.currentUser()?.companyId;

    forkJoin({
      company: this.companyService.me().pipe(catchError(() => of(null))),
      teams: this.teams$.list({ page: 0, size: 50, sort: 'name,asc' }).pipe(catchError(() => of(null))),
      users: companyId ? this.users$.list({ page: 0, size: 200, companyId, sort: 'lastName,asc' }).pipe(catchError(() => of(null))) : of(null),
      assignments: this.assignments$.my().pipe(catchError(() => of(null))),
      trainings: this.trainings$.list({ page: 0, size: 100, sort: 'title,asc' }).pipe(catchError(() => of(null))),
      progress: this.progress$.my().pipe(catchError(() => of(null))),
      certificates: this.certificates$.my().pipe(catchError(() => of(null)))
    }).subscribe(({ company, teams, users, assignments, trainings, progress, certificates }) => {
      if (company?.data?.name) {
        this.companyName.set(company.data.name);
      }

      const teamRows = teams?.data?.content ?? [];
      const userRows = users?.data?.content ?? [];
      const assignmentRows = assignments?.data ?? [];
      const trainingRows = trainings?.data?.content ?? [];
      const progressRows = (progress?.data ?? []) as ProgressResponse[];
      const certRows = certificates?.data ?? [];

      this.teams.set(teamRows);
      this.users.set(userRows);
      this.assignments.set(assignmentRows);
      this.trainings.set(trainingRows);
      this.progressRecords.set(progressRows);
      this.certificates.set(certRows as CertificateResponse[]);

      const total = Math.max(progressRows.length, 1);
      const completed = progressRows.filter(p => p.status === 'COMPLETED' || p.status === 'APPROVED').length;
      const inProgress = progressRows.filter(p => p.status === 'IN_PROGRESS').length;
      const notStarted = progressRows.filter(p => p.status === 'NOT_STARTED' || p.status === 'PENDING').length;

      this.completionRate.set(progressRows.length ? Math.round((completed / total) * 100) : 0);
      this.statusBreakdown.set([
        { label: 'Not started', value: Math.round((notStarted / total) * 100) },
        { label: 'In progress', value: Math.round((inProgress / total) * 100) },
        { label: 'Completed', value: Math.round((completed / total) * 100) }
      ]);

      this.loading.set(false);
    });
  }
}
