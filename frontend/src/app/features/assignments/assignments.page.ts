import { Component, ElementRef, OnInit, QueryList, ViewChildren, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { AssignmentResponse, CompanyResponse, TeamResponse, TrainingResponse, UserResponse } from '../../core/models/api.models';
import { AssignmentService } from '../../core/services/assignment.service';
import { CompanyService } from '../../core/services/company.service';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { TrainingService } from '../../core/services/training.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { EntityComboboxComponent, EntityOption } from '../../shared/ui/entity-combobox/entity-combobox.component';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';

type AssignmentScope = 'learner' | 'team' | 'company';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    EntityComboboxComponent,
    UiPageHeaderComponent,
    UiDataTableComponent,
    UiModalComponent,
    UiStatCardComponent,
    UiEmptyStateComponent
  ],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Assignments" [title]="canAssign() ? 'Training assignments' : 'My assignments'" [description]="canAssign() ? 'Assign trainings to learners, teams, or companies.' : 'Trainings assigned to you.'">
        @if (canAssign()) {
          <button class="btn btn-primary" type="button" (click)="modalOpen.set(true)">
            <span class="material-symbols-outlined">assignment_add</span>
            Assign training
          </button>
        }
      </ui-page-header>

      @if (!loading()) {
        <section class="grid grid-4">
          <ui-stat-card label="Total" [value]="assignments().length" icon="assignment" trend="All assignments" />
          <ui-stat-card label="Active" [value]="statusCount('ACTIVE')" icon="play_circle" trend="Currently active" />
          <ui-stat-card label="Pending" [value]="statusCount('PENDING') + statusCount('CREATING')" icon="schedule" trend="Awaiting start" />
          <ui-stat-card label="Completed" [value]="statusCount('COMPLETED')" icon="task_alt" trend="Finished" />
        </section>
      }

      <section class="card">
        <div class="toolbar">
          <div>
            <h2>{{ canAssign() ? 'All assignments' : 'Assigned trainings' }}</h2>
            <p class="muted">{{ assignments().length }} assignment{{ assignments().length === 1 ? '' : 's' }} total.</p>
          </div>
        </div>

        <div class="filter-bar section-gap">
          <div class="search-input-wrap">
            <span class="material-symbols-outlined">search</span>
            <input class="control" placeholder="Search by training name..." (input)="onSearch($event)" />
          </div>
          <label class="field">
            <span>Status</span>
            <select class="control" #statusSelect (change)="onStatusFilter($event)">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="CREATING">Creating</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </label>
          @if (canAssign()) {
            <label class="field">
              <span>Scope</span>
              <select class="control" #scopeSelect (change)="onScopeFilter($event)">
                <option value="">All scopes</option>
                <option value="learner">Learner</option>
                <option value="team">Team</option>
                <option value="company">Company</option>
              </select>
            </label>
          }
          @if (hasActiveFilters()) {
            <button class="btn btn-secondary btn-sm" type="button" (click)="clearFilters()">
              <span class="material-symbols-outlined">filter_alt_off</span>
              Clear
            </button>
          }
        </div>

        @if (loading()) {
          <div class="skeleton-grid section-gap">
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        } @else if (filteredRows().length > 0) {
          <div class="section-gap">
            <ui-data-table
              [columns]="columns"
              [rows]="filteredRows()"
              emptyText="No assignments match your filters."
              (rowClick)="openTraining($event)"
            />
          </div>
        } @else {
          <ui-empty-state
            icon="assignment"
            [title]="canAssign() ? 'No assignments yet' : 'No trainings assigned'"
            [description]="canAssign() ? 'Assign a training to a learner, team, or company to get started.' : 'Your organization has not assigned any trainings yet.'"
          >
            @if (canAssign()) {
              <button class="btn btn-primary" type="button" (click)="modalOpen.set(true)">Assign training</button>
            }
          </ui-empty-state>
        }
      </section>

      <!-- Create Assignment Modal -->
      <ui-modal title="Assign training" [open]="modalOpen()" (closed)="closeModal()">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="reviewAssignment()">
          <ui-entity-combobox
            label="Training"
            placeholder="Search published trainings"
            emptyText="No published trainings match that search."
            [options]="trainingOptions()"
            [value]="form.controls.trainingId.value"
            [loading]="lookupLoading()"
            (valueChange)="setTraining($event)"
          />
          @if (submitted() && !form.controls.trainingId.value) { <p class="field-error">Choose a training.</p> }

          <div class="field">
            <span>Assign to</span>
            <div class="segmented" role="group" aria-label="Assignment scope">
              <button class="segment" type="button" [class.active]="assignScope() === 'learner'" (click)="setScope('learner')">Learner</button>
              <button class="segment" type="button" [class.active]="assignScope() === 'team'" (click)="setScope('team')">Team</button>
              <button class="segment" type="button" [class.active]="assignScope() === 'company'" (click)="setScope('company')">Company</button>
            </div>
          </div>

          @if (assignScope() === 'learner') {
            <ui-entity-combobox
              label="Learner"
              placeholder="Search learners"
              emptyText="No learners found."
              [options]="learnerOptions()"
              [value]="form.controls.learnerId.value"
              [loading]="lookupLoading()"
              (valueChange)="setLearner($event)"
            />
            @if (submitted() && !form.controls.learnerId.value) { <p class="field-error">Choose a learner.</p> }
          }

          @if (assignScope() === 'team') {
            <ui-entity-combobox
              label="Team"
              placeholder="Search teams"
              emptyText="No teams found."
              [options]="teamOptions()"
              [value]="form.controls.teamId.value"
              [loading]="lookupLoading()"
              (valueChange)="setTeam($event)"
            />
            @if (submitted() && !form.controls.teamId.value) { <p class="field-error">Choose a team.</p> }
          }

          @if (assignScope() === 'company') {
            <ui-entity-combobox
              label="Company"
              placeholder="Search companies"
              emptyText="No companies found."
              [options]="companyOptions()"
              [value]="form.controls.companyId.value"
              [loading]="lookupLoading()"
              (valueChange)="setCompany($event)"
            />
            @if (submitted() && !form.controls.companyId.value) { <p class="field-error">Choose a company.</p> }
          }

          <label class="field"><span>Due date</span><input class="control" type="date" formControlName="dueDate" /></label>

          @if (message()) { <p class="alert" [class.alert-error]="hasError()">{{ message() }}</p> }
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" type="submit" [disabled]="saving() || lookupLoading()">{{ saving() ? 'Assigning...' : 'Review' }}</button>
          </div>
        </form>
      </ui-modal>

      <!-- Confirm Modal -->
      <ui-modal title="Confirm assignment" [open]="confirming()" (closed)="confirming.set(false)">
        <div class="confirm-stack">
          <p>{{ assignmentSummary() }}</p>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="confirming.set(false)" [disabled]="saving()">Cancel</button>
            <button class="btn btn-primary" type="button" (click)="create()" [disabled]="saving()">{{ saving() ? 'Assigning...' : 'Assign training' }}</button>
          </div>
        </div>
      </ui-modal>
    </div>
  `,
  styles: [`
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 18px; font-weight: 900; }
    .toolbar > div { display: grid; gap: 2px; }
    .section-gap { margin-top: var(--space-4); }
    .confirm-stack { display: grid; gap: var(--space-4); }
    .confirm-stack p { margin: 0; color: var(--color-text); font-weight: 800; }
  `]
})
export class AssignmentsPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly assignmentsService = inject(AssignmentService);
  private readonly companyService = inject(CompanyService);
  private readonly teamService = inject(TeamService);
  private readonly trainingService = inject(TrainingService);
  private readonly userService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private pendingLookups = 0;

  @ViewChildren('statusSelect, scopeSelect') selectRefs!: QueryList<ElementRef<HTMLSelectElement>>;

  readonly assignments = signal<AssignmentResponse[]>([]);
  readonly trainings = signal<TrainingResponse[]>([]);
  readonly teams = signal<TeamResponse[]>([]);
  readonly learners = signal<UserResponse[]>([]);
  readonly companies = signal<CompanyResponse[]>([]);
  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly lookupLoading = signal(false);
  readonly saving = signal(false);
  readonly confirming = signal(false);
  readonly submitted = signal(false);
  readonly modalOpen = signal(false);
  readonly message = signal('');
  readonly hasError = signal(false);
  readonly assignScope = signal<AssignmentScope>('learner');
  readonly searchQuery = signal('');
  readonly statusFilter = signal('');
  readonly scopeFilter = signal('');

  readonly form = this.fb.group({
    trainingId: [null as number | null, Validators.required],
    companyId: [null as number | null],
    teamId: [null as number | null],
    learnerId: [null as number | null],
    dueDate: ['']
  });

  readonly columns = [
    { key: 'training', label: 'Training' },
    { key: 'scope', label: 'Assigned to' },
    { key: 'dueDate', label: 'Due date' },
    { key: 'status', label: 'Status', type: 'status' as const },
    { key: 'createdAt', label: 'Created' }
  ];

  ngOnInit(): void {
    this.auth.ensureCurrentUser().subscribe({ next: () => this.loadLookups(), error: () => this.loadLookups() });
    this.load();
  }

  canAssign(): boolean {
    return this.auth.hasRole(['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER']);
  }

  statusCount(status: string): number {
    return this.assignments().filter(a => a.status?.toUpperCase() === status).length;
  }

  filteredRows(): Array<Record<string, unknown>> {
    let result = this.rows();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(row => String(row['training'] ?? '').toLowerCase().includes(query));
    }
    const status = this.statusFilter();
    if (status) {
      result = result.filter(row => String(row['status'] ?? '').toUpperCase() === status.toUpperCase());
    }
    const scope = this.scopeFilter();
    if (scope) {
      result = result.filter(row => {
        const assignment = this.assignments().find(a => a.id === row['id']);
        if (!assignment) return false;
        if (scope === 'learner') return !!assignment.learnerId;
        if (scope === 'team') return !!assignment.teamId;
        return !assignment.learnerId && !assignment.teamId;
      });
    }
    return result;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.statusFilter() || this.scopeFilter());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.statusFilter.set('');
    this.scopeFilter.set('');
    this.selectRefs?.forEach(ref => {
      if (ref.nativeElement) {
        ref.nativeElement.selectedIndex = 0;
      }
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(event: Event): void {
    this.statusFilter.set((event.target as HTMLSelectElement).value);
  }

  onScopeFilter(event: Event): void {
    this.scopeFilter.set((event.target as HTMLSelectElement).value);
  }

  openTraining(row: Record<string, unknown>): void {
    const assignment = this.assignments().find(a => a.id === row['id']);
    if (assignment?.trainingId) {
      this.router.navigate(['/trainings', assignment.trainingId]);
    }
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.submitted.set(false);
    this.message.set('');
  }

  trainingOptions(): EntityOption[] {
    return this.trainings().map((training) => ({
      id: training.id,
      label: training.title,
      meta: [training.category, training.level, training.status].filter(Boolean).join(' · '),
      icon: 'auto_stories'
    }));
  }

  learnerOptions(): EntityOption[] {
    return this.learners().map((user) => ({
      id: user.id,
      label: `${user.firstName} ${user.lastName}`,
      meta: user.email,
      icon: 'person'
    }));
  }

  teamOptions(): EntityOption[] {
    return this.teams().map((team) => ({
      id: team.id,
      label: team.name,
      meta: team.description || 'Team',
      icon: 'groups'
    }));
  }

  companyOptions(): EntityOption[] {
    return this.companies().map((company) => ({
      id: company.id,
      label: company.name,
      meta: company.industry || 'Company',
      icon: 'business'
    }));
  }

  setTraining(id: number | null): void {
    this.form.controls.trainingId.setValue(id);
  }

  setScope(scope: AssignmentScope): void {
    this.assignScope.set(scope);
    this.submitted.set(false);
    this.message.set('');
    this.form.patchValue({ learnerId: null, teamId: null, companyId: null });
    if (scope !== 'company' && this.auth.currentUser()?.role !== 'SUPER_ADMIN') {
      this.form.controls.companyId.setValue(this.auth.currentUser()?.companyId ?? null);
    }
  }

  setLearner(id: number | null): void {
    this.form.controls.learnerId.setValue(id);
    const learner = this.learners().find((item) => item.id === id);
    this.form.controls.companyId.setValue(learner?.companyId ?? this.form.controls.companyId.value);
  }

  setTeam(id: number | null): void {
    this.form.controls.teamId.setValue(id);
    const team = this.teams().find((item) => item.id === id);
    this.form.controls.companyId.setValue(team?.companyId ?? this.form.controls.companyId.value);
  }

  setCompany(id: number | null): void {
    this.form.controls.companyId.setValue(id);
  }

  load(): void {
    this.loading.set(true);
    this.assignmentsService.my().subscribe({
      next: (response) => {
        this.assignments.set(response.data ?? []);
        this.refreshRows();
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  reviewAssignment(): void {
    this.submitted.set(true);
    this.message.set('');
    this.hasError.set(false);
    if (!this.canSubmit()) {
      this.hasError.set(true);
      this.message.set('Choose a training and assignment target.');
      return;
    }
    this.confirming.set(true);
  }

  create(): void {
    if (!this.canSubmit()) {
      this.reviewAssignment();
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.hasError.set(false);
    const payload = this.form.getRawValue();
    const previousAssignments = this.assignments();
    const optimisticAssignment: AssignmentResponse = {
      id: -Date.now(),
      trainingId: Number(payload.trainingId),
      companyId: payload.companyId ? Number(payload.companyId) : this.auth.currentUser()?.companyId ?? 0,
      teamId: this.assignScope() === 'team' && payload.teamId ? Number(payload.teamId) : undefined,
      learnerId: this.assignScope() === 'learner' && payload.learnerId ? Number(payload.learnerId) : undefined,
      assignedBy: this.auth.currentUser()?.id ?? 0,
      dueDate: payload.dueDate || undefined,
      status: 'CREATING',
      createdAt: new Date().toISOString()
    };
    this.assignments.update((items) => [optimisticAssignment, ...items]);
    this.refreshRows();
    this.assignmentsService.create({
      trainingId: Number(payload.trainingId),
      companyId: payload.companyId ? Number(payload.companyId) : null,
      teamId: this.assignScope() === 'team' && payload.teamId ? Number(payload.teamId) : null,
      learnerId: this.assignScope() === 'learner' && payload.learnerId ? Number(payload.learnerId) : null,
      dueDate: payload.dueDate || null
    }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.confirming.set(false);
        this.modalOpen.set(false);
        this.submitted.set(false);
        this.toast.success('Training assigned.');
        this.form.patchValue({ teamId: null, learnerId: null, companyId: null, dueDate: '' });
        if (response.data) {
          this.assignments.update((items) => items.map((item) => item.id === optimisticAssignment.id ? response.data! : item));
        }
        this.refreshRows();
      },
      error: (error) => {
        this.saving.set(false);
        this.confirming.set(false);
        this.assignments.set(previousAssignments);
        this.refreshRows();
        this.hasError.set(true);
        this.message.set(parseApiError(error).message);
      }
    });
  }

  assignmentSummary(): string {
    return `${this.trainingName(this.form.controls.trainingId.value)} will be assigned to ${this.targetName()}${this.form.controls.dueDate.value ? `, due ${this.form.controls.dueDate.value}` : ''}.`;
  }

  trainingName(id: number | null | undefined): string {
    if (!id) {
      return 'selected training';
    }
    return this.trainings().find((training) => training.id === id)?.title ?? `Training #${id}`;
  }

  private targetName(): string {
    if (this.assignScope() === 'learner') {
      const learner = this.learners().find((item) => item.id === this.form.controls.learnerId.value);
      return learner ? `${learner.firstName} ${learner.lastName}` : 'selected learner';
    }
    if (this.assignScope() === 'team') {
      return this.teams().find((team) => team.id === this.form.controls.teamId.value)?.name ?? 'selected team';
    }
    return this.companies().find((company) => company.id === this.form.controls.companyId.value)?.name ?? 'selected company';
  }

  private canSubmit(): boolean {
    if (!this.form.controls.trainingId.value || this.saving()) {
      return false;
    }
    if (this.assignScope() === 'learner') {
      return !!this.form.controls.learnerId.value;
    }
    if (this.assignScope() === 'team') {
      return !!this.form.controls.teamId.value;
    }
    return !!this.form.controls.companyId.value;
  }

  private loadLookups(): void {
    const lookupCount = this.canAssign() ? 4 : 1;
    this.pendingLookups = lookupCount;
    this.lookupLoading.set(true);
    this.trainingService.list({ page: 0, size: 50, status: 'PUBLISHED', sort: 'createdAt,desc' }).subscribe({
      next: (response) => {
        this.trainings.set(response.data?.content ?? []);
        this.refreshRows();
      },
      error: (error) => {
        this.toast.error(parseApiError(error).message);
        this.finishLookup();
      },
      complete: () => this.finishLookup()
    });
    if (!this.canAssign()) {
      return;
    }
    this.userService.list({ page: 0, size: 50, role: 'LEARNER', sort: 'lastName,asc' }).subscribe({
      next: (response) => this.learners.set(response.data?.content ?? []),
      error: (error) => {
        this.toast.error(parseApiError(error).message);
        this.finishLookup();
      },
      complete: () => this.finishLookup()
    });
    this.teamService.list({ page: 0, size: 50, sort: 'name,asc' }).subscribe({
      next: (response) => this.teams.set(response.data?.content ?? []),
      error: (error) => {
        this.toast.error(parseApiError(error).message);
        this.finishLookup();
      },
      complete: () => this.finishLookup()
    });
    if (this.auth.currentUser()?.role === 'SUPER_ADMIN') {
      this.companyService.list({ page: 0, size: 50, sort: 'name,asc' }).subscribe({
        next: (response) => this.companies.set(response.data?.content ?? []),
        error: (error) => {
          this.toast.error(parseApiError(error).message);
          this.finishLookup();
        },
        complete: () => this.finishLookup()
      });
    } else {
      this.companyService.me().subscribe({
        next: (response) => {
          const company = response.data ? [response.data] : [];
          this.companies.set(company);
          if (response.data) {
            this.form.controls.companyId.setValue(response.data.id);
          }
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
          this.finishLookup();
        },
        complete: () => this.finishLookup()
      });
    }
  }

  private finishLookup(): void {
    this.pendingLookups -= 1;
    if (this.pendingLookups <= 0) {
      this.lookupLoading.set(false);
      this.refreshRows();
    }
  }

  private refreshRows(): void {
    this.rows.set(this.assignments().map((assignment) => ({
      id: assignment.id,
      training: this.trainingName(assignment.trainingId),
      scope: this.scopeLabel(assignment),
      dueDate: assignment.dueDate || '—',
      status: assignment.status,
      createdAt: assignment.createdAt ? new Date(assignment.createdAt).toLocaleDateString() : '—'
    })));
  }

  private scopeLabel(assignment: AssignmentResponse): string {
    if (assignment.learnerId) {
      const learner = this.learners().find((item) => item.id === assignment.learnerId);
      return learner ? `${learner.firstName} ${learner.lastName}` : `Learner #${assignment.learnerId}`;
    }
    if (assignment.teamId) {
      return this.teams().find((team) => team.id === assignment.teamId)?.name ?? `Team #${assignment.teamId}`;
    }
    return this.companies().find((company) => company.id === assignment.companyId)?.name ?? `Company #${assignment.companyId}`;
  }
}
