import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ProgressResponse, Role, TeamMemberResponse, TeamResponse, UserResponse } from '../../core/models/api.models';
import { ProgressService } from '../../core/services/progress.service';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { EntityComboboxComponent, EntityOption } from '../../shared/ui/entity-combobox/entity-combobox.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, EntityComboboxComponent, UiPageHeaderComponent, UiProgressBarComponent, UiStatCardComponent, UiDataTableComponent, UiEmptyStateComponent, UiModalComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Team workspace" [title]="team()?.name || 'Team'" [description]="team()?.description || 'Manage members and progress.'">
        <a class="btn btn-secondary" routerLink="/teams">
          <span class="material-symbols-outlined">arrow_back</span>
          Back
        </a>
        <button class="btn btn-primary" type="button" (click)="addModalOpen.set(true)">
          <span class="material-symbols-outlined">person_add</span>
          Add member
        </button>
      </ui-page-header>

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
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-row"></div>
          }
        </section>
      } @else if (team()) {
        <section class="grid grid-4">
          <ui-stat-card label="Members" [value]="members().length" icon="people" [trend]="learnerCount() + ' learners'" />
          <ui-stat-card label="Managers" [value]="managerCount()" icon="supervisor_account" trend="Team leadership" />
          <ui-stat-card label="Avg progress" [value]="avgProgress() + '%'" icon="trending_up" trend="Across assigned trainings" />
          <ui-stat-card label="Completed" [value]="completedCount()" icon="task_alt" [trend]="completedCount() + ' finished'" />
        </section>

        <section class="card progress-section">
          <div class="toolbar">
            <div>
              <h2>Team progress</h2>
              <p class="muted">{{ avgProgress() }}% average completion</p>
            </div>
          </div>
          <ui-progress-bar [value]="avgProgress()" />
        </section>

        <section class="card">
          <div class="toolbar">
            <div>
              <h2>Team members</h2>
              <p class="muted">{{ members().length }} member{{ members().length === 1 ? '' : 's' }} in this team.</p>
            </div>
          </div>

          <div class="filter-bar section-gap">
            <div class="search-input-wrap">
              <span class="material-symbols-outlined">search</span>
              <input class="control" placeholder="Search members..." (input)="onMemberSearch($event)" />
            </div>
            <label class="field">
              <span>Role</span>
              <select class="control" (change)="onRoleFilter($event)">
                <option value="">All roles</option>
                <option value="LEARNER">Learner</option>
                <option value="TEAM_MANAGER">Team manager</option>
              </select>
            </label>
          </div>

          @if (filteredMemberRows().length) {
            <div class="section-gap">
              <ui-data-table
                [columns]="memberColumns"
                [rows]="filteredMemberRows()"
                emptyText="No members match your search."
              />
              <div class="remove-actions">
                @for (member of filteredMembers(); track member.id) {
                  <div class="remove-row">
                    <div class="remove-row-info">
                      <span class="material-symbols-outlined">person</span>
                      <span>{{ memberName(member) }}</span>
                    </div>
                    <button class="btn btn-danger btn-sm" type="button" (click)="remove(member)" [disabled]="saving()">Remove</button>
                  </div>
                }
              </div>
            </div>
          } @else if (!members().length) {
            <div class="section-gap">
              <ui-empty-state
                icon="people"
                title="No members yet"
                description="Add an existing company user or invite a new learner."
              >
                <button class="btn btn-primary" type="button" (click)="addModalOpen.set(true)">Add member</button>
              </ui-empty-state>
            </div>
          } @else {
            <p class="empty-inline section-gap">No members match your filters.</p>
          }
        </section>
      } @else {
        <ui-empty-state
          icon="error_outline"
          title="Team not found"
          description="This team does not exist or you don't have access."
        >
          <a class="btn btn-primary" routerLink="/teams">Back to teams</a>
        </ui-empty-state>
      }

      <!-- Add Member Modal -->
      <ui-modal title="Add team member" [open]="addModalOpen()" (closed)="addModalOpen.set(false)">
        <div class="modal-tabs">
          <button class="segment" [class.active]="addTab() === 'existing'" type="button" (click)="addTab.set('existing')">Existing user</button>
          <button class="segment" [class.active]="addTab() === 'invite'" type="button" (click)="addTab.set('invite')">Invite new</button>
        </div>

        @if (addTab() === 'existing') {
          <form class="form-grid" [formGroup]="addExistingForm" (ngSubmit)="addExistingUser()" style="margin-top: var(--space-3);">
            <ui-entity-combobox
              label="Company user"
              placeholder="Search company users"
              emptyText="No available users for this team."
              [options]="availableUserOptions()"
              [value]="addExistingForm.controls.userId.value"
              [loading]="usersLoading()"
              (valueChange)="setSelectedUser($event)"
            />
            <label class="field"><span>Position</span><input class="control" formControlName="position" placeholder="e.g. Developer" /></label>
            @if (message()) { <p class="alert" [class.alert-error]="hasError()">{{ message() }}</p> }
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="addModalOpen.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit" [disabled]="!addExistingForm.controls.userId.value || saving()">
                {{ saving() ? 'Adding...' : 'Add to team' }}
              </button>
            </div>
          </form>
        } @else {
          <form class="form-grid" [formGroup]="inviteForm" (ngSubmit)="invite()" style="margin-top: var(--space-3);">
            <div class="grid grid-2">
              <label class="field"><span>First name</span><input class="control" formControlName="firstName" /></label>
              <label class="field"><span>Last name</span><input class="control" formControlName="lastName" /></label>
            </div>
            <label class="field"><span>Email</span><input class="control" type="email" formControlName="email" /></label>
            <div class="grid grid-2">
              <label class="field">
                <span>Role</span>
                <select class="control" formControlName="role">
                  <option value="LEARNER">Learner</option>
                  <option value="TEAM_MANAGER">Team manager</option>
                </select>
              </label>
              <label class="field"><span>Position</span><input class="control" formControlName="position" placeholder="e.g. Designer" /></label>
            </div>
            @if (message()) { <p class="alert" [class.alert-error]="hasError()">{{ message() }}</p> }
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="addModalOpen.set(false)">Cancel</button>
              <button class="btn btn-primary" type="submit" [disabled]="inviteForm.invalid || saving()">
                {{ saving() ? 'Sending...' : 'Send invite' }}
              </button>
            </div>
          </form>
        }
      </ui-modal>
    </div>
  `,
  styles: [`
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 18px; font-weight: 900; }
    .toolbar > div { display: grid; gap: 2px; }
    .section-gap { margin-top: var(--space-4); }
    .progress-section { display: grid; gap: var(--space-4); }
    .modal-tabs { display: inline-grid; grid-auto-flow: column; gap: 5px; padding: 5px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: rgba(238, 242, 255, 0.78); }
    .remove-actions { display: grid; gap: 0; margin-top: var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
    .remove-row { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface-soft); }
    .remove-row:last-child { border-bottom: 0; }
    .remove-row-info { display: flex; align-items: center; gap: var(--space-2); color: var(--color-heading); font-size: 13px; font-weight: 700; }
    .remove-row-info .material-symbols-outlined { font-size: 18px; color: var(--color-muted); }
  `]
})
export class TeamDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly teams = inject(TeamService);
  private readonly users = inject(UserService);
  private readonly progressService = inject(ProgressService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly team = signal<TeamResponse | null>(null);
  readonly companyUsers = signal<UserResponse[]>([]);
  readonly progressRecords = signal<ProgressResponse[]>([]);
  readonly loading = signal(true);
  readonly usersLoading = signal(false);
  readonly saving = signal(false);
  readonly message = signal('');
  readonly hasError = signal(false);
  readonly addModalOpen = signal(false);
  readonly addTab = signal<'existing' | 'invite'>('existing');
  readonly memberSearch = signal('');
  readonly roleFilter = signal('');

  readonly addExistingForm = this.fb.group({
    userId: [null as number | null, Validators.required],
    position: ['']
  });

  readonly inviteForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: this.fb.control<Role>('LEARNER', { validators: [Validators.required] }),
    position: ['']
  });

  readonly memberColumns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', type: 'status' as const },
    { key: 'position', label: 'Position' },
    { key: 'joinedAt', label: 'Joined' }
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.loadTeam(id);
  }

  members(): TeamMemberResponse[] {
    return this.team()?.members ?? [];
  }

  filteredMembers(): TeamMemberResponse[] {
    let result = this.members();
    const query = this.memberSearch().toLowerCase();
    if (query) {
      result = result.filter(m =>
        this.memberName(m).toLowerCase().includes(query) ||
        (m.email ?? '').toLowerCase().includes(query)
      );
    }
    const role = this.roleFilter();
    if (role) {
      result = result.filter(m => m.role === role);
    }
    return result;
  }

  filteredMemberRows(): Array<Record<string, unknown>> {
    return this.filteredMembers().map(m => ({
      id: m.id,
      name: this.memberName(m),
      email: m.email || '—',
      role: this.roleLabel(m.role),
      status: m.status || '—',
      position: m.position || '—',
      joinedAt: m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : '—'
    }));
  }

  onMemberSearch(event: Event): void {
    this.memberSearch.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event): void {
    this.roleFilter.set((event.target as HTMLSelectElement).value);
  }

  learnerCount(): number {
    return this.members().filter(m => m.role === 'LEARNER').length;
  }

  managerCount(): number {
    return this.members().filter(m => m.role === 'TEAM_MANAGER').length;
  }

  avgProgress(): number {
    const progress = this.progressRecords();
    if (!progress.length) return 0;
    return Math.round(progress.reduce((sum, p) => sum + Number(p.progressPercentage ?? 0), 0) / progress.length);
  }

  completedCount(): number {
    return this.progressRecords().filter(p => p.status === 'COMPLETED' || p.status === 'APPROVED').length;
  }

  availableUsers(): UserResponse[] {
    const memberIds = new Set(this.members().map((member) => member.userId));
    return this.companyUsers().filter((user) =>
      (user.role === 'LEARNER' || user.role === 'TEAM_MANAGER') && !memberIds.has(user.id)
    );
  }

  availableUserOptions(): EntityOption[] {
    return this.availableUsers().map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName}`,
      meta: `${user.email} · ${this.roleLabel(user.role)}`,
      icon: user.role === 'TEAM_MANAGER' ? 'supervisor_account' : 'person'
    }));
  }

  setSelectedUser(id: number | null): void {
    this.addExistingForm.controls.userId.setValue(id);
  }

  addExistingUser(): void {
    const team = this.team();
    const userId = this.addExistingForm.controls.userId.value;
    const user = this.companyUsers().find((item) => item.id === userId);
    if (!team || !user || this.addExistingForm.invalid) {
      return;
    }
    this.saveMember(team.id, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role === 'TEAM_MANAGER' ? 'TEAM_MANAGER' : 'LEARNER',
      position: this.addExistingForm.controls.position.value || ''
    }, 'User added to team.');
  }

  invite(): void {
    const team = this.team();
    if (!team || this.inviteForm.invalid) {
      return;
    }
    this.saveMember(team.id, this.inviteForm.getRawValue(), 'Invitation sent.');
  }

  remove(member: TeamMemberResponse): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.hasError.set(false);
    this.teams.removeMember(team.id, member.id).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.toast.success(response.message || 'Team member removed.');
        this.team.update((current) => current ? {
          ...current,
          members: (current.members ?? []).filter((item) => item.id !== member.id)
        } : current);
      },
      error: (error) => {
        this.saving.set(false);
        this.hasError.set(true);
        this.message.set(parseApiError(error).message);
      }
    });
  }

  memberName(member: TeamMemberResponse): string {
    if (member.firstName || member.lastName) {
      return `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    }
    const user = this.companyUsers().find((item) => item.id === member.userId);
    return user ? `${user.firstName} ${user.lastName}` : `User #${member.userId}`;
  }

  roleLabel(role?: Role): string {
    const labels: Record<Role, string> = {
      SUPER_ADMIN: 'Super admin',
      TRAINER: 'Trainer',
      COMPANY_ADMIN: 'Company admin',
      TEAM_MANAGER: 'Team manager',
      LEARNER: 'Learner'
    };
    return role ? labels[role] : '—';
  }

  private loadTeam(id: number): void {
    this.loading.set(true);
    this.teams.get(id).subscribe({
      next: (response) => {
        const team = response.data ?? null;
        this.team.set(team);
        this.loading.set(false);
        if (team) {
          this.loadCompanyUsers(team.companyId);
          this.loadTeamProgress(team);
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private loadTeamProgress(team: TeamResponse): void {
    const memberIds = new Set((team.members ?? []).map(m => m.userId));
    if (!memberIds.size) return;

    this.progressService.my().pipe(catchError(() => of(null))).subscribe(response => {
      const all = response?.data ?? [];
      this.progressRecords.set(all.filter(p => memberIds.has(p.learnerId)));
    });
  }

  private loadCompanyUsers(companyId: number): void {
    this.usersLoading.set(true);
    this.users.list({ page: 0, size: 100, companyId, sort: 'lastName,asc' }).subscribe({
      next: (response) => {
        this.companyUsers.set(response.data?.content ?? []);
        this.usersLoading.set(false);
      },
      error: (error) => {
        this.usersLoading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private saveMember(teamId: number, payload: { email: string; firstName: string; lastName: string; role: Role; position?: string }, successMessage: string): void {
    this.saving.set(true);
    this.message.set('');
    this.hasError.set(false);
    this.teams.addMember(teamId, payload).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.message.set(response.message || successMessage);
        this.toast.success(successMessage);
        this.addExistingForm.reset({ userId: null, position: '' });
        this.inviteForm.reset({ firstName: '', lastName: '', email: '', role: 'LEARNER', position: '' });
        this.addModalOpen.set(false);
        if (response.data) {
          this.team.update((current) => current ? {
            ...current,
            members: [...(current.members ?? []), response.data!]
          } : current);
        }
        // Re-fetch company users to refresh available users list
        const team = this.team();
        if (team) {
          this.loadCompanyUsers(team.companyId);
        }
      },
      error: (error) => {
        this.saving.set(false);
        this.hasError.set(true);
        this.message.set(parseApiError(error).message);
      }
    });
  }
}
