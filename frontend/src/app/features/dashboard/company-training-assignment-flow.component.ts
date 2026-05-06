import { Component, EventEmitter, OnInit, Output, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AssignmentResponse, AssignmentTargetType, TeamResponse, TrainingResponse, UserResponse } from '../../core/models/api.models';
import { AssignmentService } from '../../core/services/assignment.service';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { TrainingService } from '../../core/services/training.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiSpinnerComponent } from '../../shared/ui/spinner/ui-spinner.component';

type WizardStep = 1 | 2 | 3 | 4;

@Component({
  selector: 'company-training-assignment-flow',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiEmptyStateComponent, UiModalComponent, UiSpinnerComponent],
  template: `
    @if (isCompanyAdmin()) {
      <section class="card marketplace">
        <div class="marketplace-header">
          <div>
            <span class="section-eyebrow">Company catalog</span>
            <h2>Explore Trainings for Your Team</h2>
          </div>
          <span class="badge badge-success">Published only</span>
        </div>

        <form class="filters" [formGroup]="filters" (ngSubmit)="loadCatalog()">
          <label class="field search-field">
            <span>Search</span>
            <input class="control" formControlName="q" placeholder="Search training title or description" />
          </label>
          <label class="field">
            <span>Category</span>
            <select class="control" formControlName="category">
              <option value="">All categories</option>
              @for (category of categories(); track category) {
                <option [value]="category">{{ category }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Level</span>
            <select class="control" formControlName="level">
              <option value="">All levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>
          </label>
          <label class="field">
            <span>Trainer</span>
            <select class="control" formControlName="trainerId">
              <option value="">All trainers</option>
              @for (trainerId of trainerIds(); track trainerId) {
                <option [value]="trainerId">Trainer #{{ trainerId }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select class="control" disabled>
              <option>Published</option>
            </select>
          </label>
          <button class="btn btn-primary filter-button" type="submit" [disabled]="catalogLoading()">
            @if (catalogLoading()) { <ui-spinner /> } @else { <span class="material-symbols-outlined">search</span> }
            Search
          </button>
        </form>

        @if (catalogLoading()) {
          <div class="catalog-loading"><ui-spinner /><span class="muted">Loading trainings...</span></div>
        } @else if (trainings().length) {
          <div class="training-grid">
            @for (training of trainings(); track training.id) {
              <article class="training-card">
                <a class="thumb" [routerLink]="['/trainings', training.id]" [style.background-image]="thumbnail(training)">
                  @if (!training.thumbnailUrl) {
                    <span class="material-symbols-outlined">auto_stories</span>
                  }
                </a>
                <div class="training-body">
                  <div class="training-title">
                    <div>
                      <a [routerLink]="['/trainings', training.id]">{{ training.title }}</a>
                      <small>{{ training.category || 'General' }} · Trainer #{{ training.trainerId }}</small>
                    </div>
                    <span class="price">{{ formatMoney(training.price) }}</span>
                  </div>
                  <p>{{ training.shortDescription || training.description || 'No short description provided.' }}</p>
                  <div class="meta-row">
                    <span><span class="material-symbols-outlined">signal_cellular_alt</span>{{ labelLevel(training.level) }}</span>
                    <span><span class="material-symbols-outlined">schedule</span>{{ training.durationMinutes }} min</span>
                    <span><span class="material-symbols-outlined">language</span>{{ training.language }}</span>
                  </div>
                </div>
                <button class="btn btn-primary assign-btn" type="button" (click)="openWizard(training)">
                  <span class="material-symbols-outlined">assignment_add</span>
                  Assign to Team
                </button>
              </article>
            }
          </div>
        } @else {
          <ui-empty-state icon="auto_stories" title="No published trainings found" description="Try another search, category or level filter." />
        }

        <aside class="assignment-strip">
          <div>
            <strong>{{ assignments().length }}</strong>
            <span>active company assignments</span>
          </div>
          <button class="link-button" type="button" (click)="loadAssignments()">Refresh</button>
        </aside>
      </section>

      <ui-modal title="Assign Training" [open]="wizardOpen()" (closed)="closeWizard()">
        <div class="wizard">
          <div class="stepper">
            @for (step of steps; track step.index) {
              <button type="button" [class.active]="wizardStep() === step.index" [class.done]="wizardStep() > step.index" (click)="goToStep(step.index)">
                <span>{{ step.index }}</span>
                <strong>{{ step.label }}</strong>
              </button>
            }
          </div>

          @if (selectedTraining(); as training) {
            @if (wizardStep() === 1) {
              <section class="summary-step">
                <div class="training-summary">
                  <div class="summary-thumb" [style.background-image]="thumbnail(training)">
                    @if (!training.thumbnailUrl) { <span class="material-symbols-outlined">school</span> }
                  </div>
                  <div>
                    <span class="badge badge-info">{{ training.status }}</span>
                    <h3>{{ training.title }}</h3>
                    <p>{{ training.shortDescription || training.description || 'No short description provided.' }}</p>
                    <div class="summary-meta">
                      <span>{{ labelLevel(training.level) }}</span>
                      <span>{{ training.durationMinutes }} min</span>
                      <span>Trainer #{{ training.trainerId }}</span>
                      <span>{{ formatMoney(training.price) }}</span>
                    </div>
                  </div>
                </div>
                <div class="wizard-actions">
                  <button class="btn btn-secondary" type="button" (click)="closeWizard()">Cancel</button>
                  <button class="btn btn-primary" type="button" (click)="wizardStep.set(2)">Choose target</button>
                </div>
              </section>
            }

            @if (wizardStep() === 2) {
              <section class="target-step">
                <div class="target-options" role="group" aria-label="Assignment target">
                  <button type="button" [class.active]="targetType() === 'COMPANY'" (click)="setTargetType('COMPANY')">
                    <span class="material-symbols-outlined">domain</span>
                    <strong>Entire company</strong>
                    <small>{{ eligibleEmployees().length }} eligible employees</small>
                  </button>
                  <button type="button" [class.active]="targetType() === 'TEAM'" (click)="setTargetType('TEAM')">
                    <span class="material-symbols-outlined">groups</span>
                    <strong>Team / group</strong>
                    <small>{{ selectedTeamIds().length }} selected</small>
                  </button>
                  <button type="button" [class.active]="targetType() === 'LEARNER'" (click)="setTargetType('LEARNER')">
                    <span class="material-symbols-outlined">person_check</span>
                    <strong>Specific employees</strong>
                    <small>{{ selectedLearnerIds().length }} selected</small>
                  </button>
                </div>

                @if (targetType() === 'TEAM') {
                  <div class="selector-panel">
                    <h3>Select teams</h3>
                    @if (teamsLoading()) {
                      <div class="catalog-loading"><ui-spinner /><span class="muted">Loading teams...</span></div>
                    } @else if (teams().length) {
                      <div class="team-picker">
                        @for (team of teams(); track team.id) {
                          <label class="check-row">
                            <input type="checkbox" [checked]="selectedTeamIds().includes(team.id)" (change)="toggleTeam(team.id, $event)" />
                            <span>
                              <strong>{{ team.name }}</strong>
                              <small>{{ teamMemberCount(team) }} members · {{ team.description || 'No description' }}</small>
                            </span>
                          </label>
                        }
                      </div>
                    } @else {
                      <p class="empty-inline">No teams exist yet. Create a team before assigning by group.</p>
                    }
                  </div>
                }

                @if (targetType() === 'LEARNER') {
                  <div class="selector-panel">
                    <div class="employee-toolbar">
                      <h3>Select employees</h3>
                      <div class="employee-actions">
                        <button class="link-button" type="button" (click)="selectAllFilteredEmployees()">Select all</button>
                        <button class="link-button" type="button" (click)="clearEmployees()">Clear</button>
                      </div>
                    </div>
                    <div class="employee-filters">
                      <input class="control" [value]="employeeSearch()" (input)="employeeSearch.set(inputValue($event))" placeholder="Search by name or email" />
                      <select class="control" [value]="employeeTeamFilter()" (change)="setEmployeeTeamFilter(inputValue($event))">
                        <option value="">All teams</option>
                        @for (team of teams(); track team.id) {
                          <option [value]="team.id">{{ team.name }}</option>
                        }
                      </select>
                    </div>
                    @if (filteredEmployees().length) {
                      <div class="employee-list">
                        @for (employee of filteredEmployees(); track employee.id) {
                          <label class="check-row">
                            <input type="checkbox" [checked]="selectedLearnerIds().includes(employee.id)" (change)="toggleLearner(employee.id, $event)" />
                            <span>
                              <strong>{{ employee.firstName }} {{ employee.lastName }}</strong>
                              <small>{{ employee.email }} · {{ roleLabel(employee.role) }} · {{ employee.status }}</small>
                            </span>
                          </label>
                        }
                      </div>
                    } @else {
                      <p class="empty-inline">No employees match this search or team filter.</p>
                    }
                  </div>
                }

                @if (targetType() === 'COMPANY') {
                  <div class="selector-panel company-target">
                    <span class="material-symbols-outlined">domain_add</span>
                    <div>
                      <h3>Assign to the entire company</h3>
                      <p class="muted">Every eligible employee in this company will see the training in their assigned trainings.</p>
                    </div>
                  </div>
                }

                <label class="field due-field">
                  <span>Due date optional</span>
                  <input class="control" type="date" [value]="dueDate()" (input)="dueDate.set(inputValue($event))" />
                </label>

                @if (message()) { <p class="alert alert-error">{{ message() }}</p> }
                <div class="wizard-actions">
                  <button class="btn btn-secondary" type="button" (click)="wizardStep.set(1)">Back</button>
                  <button class="btn btn-primary" type="button" (click)="review()">Review assignment</button>
                </div>
              </section>
            }

            @if (wizardStep() === 3) {
              <section class="review-step">
                <div class="review-grid">
                  <article>
                    <span class="material-symbols-outlined">auto_stories</span>
                    <small>Training</small>
                    <strong>{{ training.title }}</strong>
                  </article>
                  <article>
                    <span class="material-symbols-outlined">assignment_ind</span>
                    <small>Target</small>
                    <strong>{{ targetLabel() }}</strong>
                  </article>
                  <article>
                    <span class="material-symbols-outlined">groups</span>
                    <small>Learners</small>
                    <strong>{{ learnerCount() }}</strong>
                  </article>
                  <article>
                    <span class="material-symbols-outlined">payments</span>
                    <small>Estimate</small>
                    <strong>{{ formatMoney(totalEstimate()) }}</strong>
                  </article>
                </div>

                <div class="review-panel">
                  <h3>Review summary</h3>
                  <dl>
                    <div><dt>Training</dt><dd>{{ training.title }}</dd></div>
                    <div><dt>Target type</dt><dd>{{ targetLabel() }}</dd></div>
                    <div><dt>Selected teams</dt><dd>{{ selectedTeamNames() || '-' }}</dd></div>
                    <div><dt>Selected employees</dt><dd>{{ selectedEmployeeNames() || '-' }}</dd></div>
                    <div><dt>Due date</dt><dd>{{ dueDate() || 'No due date' }}</dd></div>
                    <div><dt>Billing</dt><dd>No payment is charged in this MVP. The payload is ready for future purchase integration.</dd></div>
                  </dl>
                </div>

                @if (message()) { <p class="alert alert-error">{{ message() }}</p> }
                <div class="wizard-actions">
                  <button class="btn btn-secondary" type="button" (click)="wizardStep.set(2)" [disabled]="saving()">Back</button>
                  <button class="btn btn-primary" type="button" (click)="confirm()" [disabled]="saving()">
                    @if (saving()) { <ui-spinner /> } @else { <span class="material-symbols-outlined">check_circle</span> }
                    Confirm Assignment
                  </button>
                </div>
              </section>
            }

            @if (wizardStep() === 4) {
              <section class="success-step">
                <span class="success-icon material-symbols-outlined">check_circle</span>
                <h3>Assignment created</h3>
                <p>{{ successMessage() }}</p>
                <div class="wizard-actions centered">
                  <button class="btn btn-secondary" type="button" (click)="closeWizard()">Close</button>
                  <button class="btn btn-primary" type="button" (click)="assignAnother()">Assign another training</button>
                </div>
              </section>
            }
          }
        </div>
      </ui-modal>
    }
  `,
  styles: [`
    :host ::ng-deep .modal { width: min(1120px, 100%); }
    h2, h3 { margin: 0; color: var(--color-heading); line-height: 1.25; }
    h2 { font-size: 22px; font-weight: 900; }
    h3 { font-size: 18px; font-weight: 900; }
    .marketplace { display: grid; gap: var(--space-4); }
    .marketplace-header { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
    .section-eyebrow { display: block; margin-bottom: 4px; color: var(--color-primary-strong); font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; }
    .filters { display: grid; grid-template-columns: minmax(220px, 1.4fr) repeat(4, minmax(140px, 1fr)) auto; gap: 12px; align-items: end; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .filter-button { min-height: 42px; }
    .training-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
    .training-card { display: grid; grid-template-rows: 150px 1fr auto; min-height: 410px; overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); box-shadow: var(--shadow-card); }
    .thumb, .summary-thumb { display: grid; place-items: center; background-color: var(--color-primary-soft); background-size: cover; background-position: center; color: var(--color-primary); }
    .thumb span, .summary-thumb span { font-size: 42px; }
    .training-body { display: grid; gap: 12px; padding: 16px; }
    .training-title { display: flex; justify-content: space-between; gap: 12px; align-items: start; }
    .training-title a { color: var(--color-heading); font-size: 16px; font-weight: 900; line-height: 1.25; }
    .training-title small, .training-body p, .meta-row span, .review-panel dd, .review-panel dt { color: var(--color-muted); }
    .price { flex: 0 0 auto; color: var(--color-primary-strong); font-size: 15px; font-weight: 900; }
    .training-body p { display: -webkit-box; min-height: 44px; margin: 0; overflow: hidden; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 13px; line-height: 1.55; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .meta-row span { display: inline-flex; align-items: center; gap: 5px; padding: 6px 9px; border-radius: 999px; background: var(--color-surface-raised); font-size: 12px; font-weight: 800; }
    .meta-row .material-symbols-outlined { font-size: 16px; color: var(--color-primary); }
    .assign-btn { margin: 0 16px 16px; }
    .catalog-loading { display: flex; align-items: center; gap: 10px; padding: 28px; justify-content: center; }
    .assignment-strip { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 16px; border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .assignment-strip div { display: flex; gap: 8px; align-items: baseline; }
    .assignment-strip strong { color: var(--color-heading); font-size: 22px; }
    .assignment-strip span { color: var(--color-muted); font-weight: 800; }
    .link-button { border: 0; background: transparent; color: var(--color-primary-strong); cursor: pointer; font-weight: 900; }
    .wizard { display: grid; gap: var(--space-4); }
    .stepper { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .stepper button { display: flex; align-items: center; gap: 8px; min-width: 0; padding: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-soft); color: var(--color-muted); cursor: pointer; }
    .stepper button span { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 999px; background: var(--color-surface); color: inherit; font-size: 12px; font-weight: 900; }
    .stepper button strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
    .stepper button.active, .stepper button.done { border-color: rgba(79,70,229,.35); background: var(--color-primary-soft); color: var(--color-primary-strong); }
    .summary-step, .target-step, .review-step, .success-step { display: grid; gap: var(--space-4); }
    .training-summary { display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 18px; align-items: stretch; }
    .summary-thumb { min-height: 180px; border-radius: var(--radius-lg); }
    .training-summary h3 { margin-top: 12px; font-size: 24px; }
    .training-summary p { color: var(--color-muted); line-height: 1.6; }
    .summary-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .summary-meta span { padding: 8px 10px; border-radius: 999px; background: var(--color-surface-raised); color: var(--color-muted); font-size: 12px; font-weight: 900; }
    .target-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
    .target-options button { display: grid; gap: 8px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface); text-align: left; cursor: pointer; }
    .target-options button:hover, .target-options button.active { border-color: rgba(79,70,229,.4); background: var(--color-primary-soft); }
    .target-options .material-symbols-outlined { color: var(--color-primary); font-size: 28px; }
    .target-options strong { color: var(--color-heading); }
    .target-options small { color: var(--color-muted); font-weight: 700; }
    .selector-panel { display: grid; gap: 12px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .company-target { grid-template-columns: 46px minmax(0, 1fr); align-items: center; }
    .company-target > span { display: grid; place-items: center; width: 46px; height: 46px; border-radius: 15px; background: var(--color-primary-soft); color: var(--color-primary); }
    .team-picker, .employee-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-height: 310px; overflow: auto; padding-right: 3px; }
    .check-row { display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; align-items: start; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); cursor: pointer; }
    .check-row:hover { border-color: rgba(79,70,229,.35); }
    .check-row input { margin-top: 2px; accent-color: var(--color-primary); }
    .check-row strong { display: block; color: var(--color-heading); font-size: 14px; }
    .check-row small { display: block; margin-top: 2px; color: var(--color-muted); font-size: 12px; font-weight: 700; line-height: 1.4; }
    .employee-toolbar { display: flex; justify-content: space-between; gap: 12px; align-items: center; }
    .employee-actions { display: flex; gap: 10px; }
    .employee-filters { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 10px; }
    .due-field { max-width: 260px; }
    .wizard-actions { display: flex; justify-content: flex-end; gap: 10px; align-items: center; }
    .wizard-actions.centered { justify-content: center; }
    .review-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
    .review-grid article { display: grid; gap: 5px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .review-grid .material-symbols-outlined { color: var(--color-primary); }
    .review-grid small { color: var(--color-muted); font-weight: 800; }
    .review-grid strong { color: var(--color-heading); font-size: 17px; }
    .review-panel { display: grid; gap: 12px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); }
    .review-panel dl { display: grid; gap: 10px; margin: 0; }
    .review-panel dl div { display: grid; grid-template-columns: 160px minmax(0, 1fr); gap: 12px; }
    .review-panel dt { font-weight: 900; }
    .review-panel dd { margin: 0; line-height: 1.45; }
    .success-step { justify-items: center; text-align: center; padding: 28px 10px; }
    .success-icon { display: grid; place-items: center; width: 70px; height: 70px; border-radius: 24px; background: #dcfce7; color: #15803d; font-size: 42px; }
    .success-step p { max-width: 560px; margin: 0; color: var(--color-muted); line-height: 1.6; }
    @media (max-width: 1120px) {
      .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .search-field { grid-column: 1 / -1; }
      .filter-button { justify-content: center; }
      .training-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 760px) {
      .marketplace-header, .assignment-strip, .employee-toolbar { align-items: stretch; flex-direction: column; }
      .filters, .training-grid, .training-summary, .target-options, .team-picker, .employee-list, .employee-filters, .review-grid { grid-template-columns: 1fr; }
      .stepper { grid-template-columns: repeat(2, 1fr); }
      .review-panel dl div { grid-template-columns: 1fr; gap: 2px; }
      .wizard-actions { flex-direction: column-reverse; align-items: stretch; }
    }
  `]
})
export class CompanyTrainingAssignmentFlowComponent implements OnInit {
  @Output() assignmentCreated = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  private readonly trainingsService = inject(TrainingService);
  private readonly assignmentsService = inject(AssignmentService);
  private readonly teamsService = inject(TeamService);
  private readonly usersService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly filters = this.fb.group({
    q: [''],
    category: [''],
    level: [''],
    trainerId: ['']
  });

  readonly steps: Array<{ index: WizardStep; label: string }> = [
    { index: 1, label: 'Training' },
    { index: 2, label: 'Target' },
    { index: 3, label: 'Review' },
    { index: 4, label: 'Confirm' }
  ];

  readonly catalogLoading = signal(false);
  readonly teamsLoading = signal(false);
  readonly saving = signal(false);
  readonly wizardOpen = signal(false);
  readonly wizardStep = signal<WizardStep>(1);
  readonly message = signal('');
  readonly successMessage = signal('');
  readonly trainings = signal<TrainingResponse[]>([]);
  readonly allTrainings = signal<TrainingResponse[]>([]);
  readonly assignments = signal<AssignmentResponse[]>([]);
  readonly teams = signal<TeamResponse[]>([]);
  readonly employees = signal<UserResponse[]>([]);
  readonly selectedTraining = signal<TrainingResponse | null>(null);
  readonly targetType = signal<AssignmentTargetType>('TEAM');
  readonly selectedTeamIds = signal<number[]>([]);
  readonly selectedLearnerIds = signal<number[]>([]);
  readonly employeeSearch = signal('');
  readonly employeeTeamFilter = signal('');
  readonly dueDate = signal('');

  readonly categories = computed(() => [...new Set(this.allTrainings().map((item) => item.category).filter(Boolean) as string[])].sort());
  readonly trainerIds = computed(() => [...new Set(this.allTrainings().map((item) => item.trainerId))].sort((a, b) => a - b));
  readonly eligibleEmployees = computed(() => this.employees().filter((user) => user.role === 'LEARNER' || user.role === 'TEAM_MANAGER'));
  readonly filteredEmployees = computed(() => {
    const search = this.employeeSearch().trim().toLowerCase();
    const teamFilter = Number(this.employeeTeamFilter());
    const teamMemberIds = teamFilter ? new Set((this.teams().find((team) => team.id === teamFilter)?.members ?? []).map((member) => member.userId)) : null;
    return this.eligibleEmployees().filter((employee) => {
      const matchesTeam = !teamMemberIds || teamMemberIds.has(employee.id);
      const haystack = `${employee.firstName} ${employee.lastName} ${employee.email}`.toLowerCase();
      return matchesTeam && (!search || haystack.includes(search));
    });
  });

  ngOnInit(): void {
    if (!this.isCompanyAdmin()) {
      return;
    }
    this.loadCatalog();
    this.loadCompanyTargets();
    this.loadAssignments();
  }

  isCompanyAdmin(): boolean {
    return this.auth.currentUser()?.role === 'COMPANY_ADMIN';
  }

  loadCatalog(): void {
    this.catalogLoading.set(true);
    const raw = this.filters.getRawValue();
    const trainerId = raw.trainerId ? Number(raw.trainerId) : undefined;
    this.trainingsService.getPublishedTrainings({
      page: 0,
      size: 12,
      sort: 'createdAt,desc',
      q: raw.q || undefined,
      category: raw.category || undefined,
      level: raw.level || undefined,
      trainerId
    }).subscribe({
      next: (response) => {
        const rows = response.data?.content ?? [];
        this.trainings.set(rows);
        if (!this.allTrainings().length) {
          this.allTrainings.set(rows);
        }
        this.catalogLoading.set(false);
      },
      error: (error) => {
        this.catalogLoading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  loadAssignments(): void {
    this.assignmentsService.my().subscribe({
      next: (response) => this.assignments.set(response.data ?? []),
      error: (error) => this.toast.error(parseApiError(error).message)
    });
  }

  openWizard(training: TrainingResponse): void {
    this.selectedTraining.set(training);
    this.wizardOpen.set(true);
    this.wizardStep.set(1);
    this.targetType.set('TEAM');
    this.message.set('');
    this.successMessage.set('');
    this.selectedTeamIds.set([]);
    this.selectedLearnerIds.set([]);
    this.dueDate.set('');
  }

  closeWizard(): void {
    if (this.saving()) {
      return;
    }
    this.wizardOpen.set(false);
    this.message.set('');
  }

  assignAnother(): void {
    this.wizardOpen.set(false);
    this.selectedTraining.set(null);
    this.loadCatalog();
  }

  goToStep(step: WizardStep): void {
    if (step === 4) {
      return;
    }
    if (step === 3 && !this.canReview()) {
      return;
    }
    this.wizardStep.set(step);
  }

  setTargetType(type: AssignmentTargetType): void {
    this.targetType.set(type);
    this.message.set('');
  }

  toggleTeam(teamId: number, event: Event): void {
    this.toggleId(this.selectedTeamIds, teamId, (event.target as HTMLInputElement).checked);
  }

  toggleLearner(userId: number, event: Event): void {
    this.toggleId(this.selectedLearnerIds, userId, (event.target as HTMLInputElement).checked);
  }

  setEmployeeTeamFilter(value: string): void {
    this.employeeTeamFilter.set(value);
  }

  selectAllFilteredEmployees(): void {
    const ids = new Set(this.selectedLearnerIds());
    this.filteredEmployees().forEach((employee) => ids.add(employee.id));
    this.selectedLearnerIds.set([...ids]);
  }

  clearEmployees(): void {
    this.selectedLearnerIds.set([]);
  }

  review(): void {
    this.message.set('');
    if (!this.selectedTraining()) {
      this.message.set('Choose a training before continuing.');
      return;
    }
    if (!this.canReview()) {
      this.message.set('Choose at least one target before reviewing the assignment.');
      return;
    }
    this.wizardStep.set(3);
  }

  confirm(): void {
    const training = this.selectedTraining();
    const companyId = this.auth.currentUser()?.companyId;
    if (!training || !companyId || !this.canReview()) {
      this.message.set('Choose a training and assignment target before confirming.');
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.assignmentsService.createBulk({
      trainingId: training.id,
      companyId,
      targetType: this.targetType(),
      teamIds: this.targetType() === 'TEAM' ? this.selectedTeamIds() : [],
      learnerIds: this.targetType() === 'LEARNER' ? this.selectedLearnerIds() : [],
      dueDate: this.dueDate() || null
    }).subscribe({
      next: (response) => {
        const created = response.data?.length ?? 0;
        this.saving.set(false);
        this.successMessage.set(`${training.title} was assigned successfully. ${created} assignment${created === 1 ? '' : 's'} created for ${this.learnerCount()} learner${this.learnerCount() === 1 ? '' : 's'}.`);
        this.toast.success('Training assigned successfully.');
        this.wizardStep.set(4);
        this.loadAssignments();
        this.assignmentCreated.emit();
        this.selectedTeamIds.set([]);
        this.selectedLearnerIds.set([]);
      },
      error: (error) => {
        this.saving.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }

  canReview(): boolean {
    if (this.targetType() === 'COMPANY') {
      return this.eligibleEmployees().length > 0;
    }
    if (this.targetType() === 'TEAM') {
      return this.selectedTeamIds().length > 0;
    }
    return this.selectedLearnerIds().length > 0;
  }

  learnerCount(): number {
    if (this.targetType() === 'COMPANY') {
      return this.eligibleEmployees().length;
    }
    if (this.targetType() === 'LEARNER') {
      return this.selectedLearnerIds().length;
    }
    const ids = new Set<number>();
    this.teams()
      .filter((team) => this.selectedTeamIds().includes(team.id))
      .flatMap((team) => team.members ?? [])
      .forEach((member) => ids.add(member.userId));
    return ids.size;
  }

  totalEstimate(): number {
    return Number(this.selectedTraining()?.price ?? 0) * this.learnerCount();
  }

  targetLabel(): string {
    if (this.targetType() === 'COMPANY') {
      return 'Entire company';
    }
    if (this.targetType() === 'TEAM') {
      return `${this.selectedTeamIds().length} team${this.selectedTeamIds().length === 1 ? '' : 's'}`;
    }
    return `${this.selectedLearnerIds().length} employee${this.selectedLearnerIds().length === 1 ? '' : 's'}`;
  }

  selectedTeamNames(): string {
    return this.teams()
      .filter((team) => this.selectedTeamIds().includes(team.id))
      .map((team) => team.name)
      .join(', ');
  }

  selectedEmployeeNames(): string {
    return this.employees()
      .filter((employee) => this.selectedLearnerIds().includes(employee.id))
      .map((employee) => `${employee.firstName} ${employee.lastName}`)
      .join(', ');
  }

  teamMemberCount(team: TeamResponse): number {
    return (team.members ?? []).length;
  }

  thumbnail(training: TrainingResponse): string {
    return training.thumbnailUrl ? `url("${training.thumbnailUrl}")` : '';
  }

  formatMoney(value: number | string | undefined): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(value ?? 0));
  }

  labelLevel(value: string): string {
    return value.replaceAll('_', ' ').toLowerCase().replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
  }

  roleLabel(value: string): string {
    return this.labelLevel(value);
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private loadCompanyTargets(): void {
    const companyId = this.auth.currentUser()?.companyId;
    if (!companyId) {
      return;
    }
    this.teamsLoading.set(true);
    forkJoin({
      teams: this.teamsService.getCompanyTeams({ page: 0, size: 50, sort: 'name,asc' }).pipe(catchError(() => of(null))),
      employees: this.usersService.getCompanyMembers({ page: 0, size: 100, companyId, sort: 'lastName,asc' }).pipe(catchError(() => of(null)))
    }).subscribe(({ teams, employees }) => {
      const baseTeams = teams?.data?.content ?? [];
      this.employees.set(employees?.data?.content ?? []);
      if (!baseTeams.length) {
        this.teams.set([]);
        this.teamsLoading.set(false);
        return;
      }
      forkJoin(baseTeams.map((team) => this.teamsService.get(team.id).pipe(catchError(() => of({ data: team }))))).subscribe({
        next: (responses) => {
          this.teams.set(responses.map((response) => response.data).filter(Boolean) as TeamResponse[]);
          this.teamsLoading.set(false);
        },
        error: () => {
          this.teams.set(baseTeams);
          this.teamsLoading.set(false);
        }
      });
    });
  }

  private toggleId(target: { set: (value: number[]) => void; update: (fn: (value: number[]) => number[]) => void }, id: number, checked: boolean): void {
    target.update((items) => checked ? [...new Set([...items, id])] : items.filter((item) => item !== id));
  }
}
