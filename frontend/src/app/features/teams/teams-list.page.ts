import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TeamResponse, UserResponse } from '../../core/models/api.models';
import { TeamService } from '../../core/services/team.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { EntityComboboxComponent, EntityOption } from '../../shared/ui/entity-combobox/entity-combobox.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, EntityComboboxComponent, UiPageHeaderComponent, UiDataTableComponent, UiEmptyStateComponent, UiModalComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Company" title="Teams" description="Organize learners by team and assignment scope.">
        <button class="btn btn-primary" type="button" (click)="modalOpen.set(true)">
          <span class="material-symbols-outlined">add_circle</span>
          Create team
        </button>
      </ui-page-header>

      @if (!loading()) {
        <section class="grid grid-3">
          <ui-stat-card label="Total teams" [value]="teams().length" icon="groups" trend="Active groups" />
          <ui-stat-card label="Total members" [value]="totalMembers()" icon="people" trend="Across all teams" />
          <ui-stat-card label="Avg team size" [value]="avgTeamSize()" icon="bar_chart" trend="Members per team" />
        </section>
      }

      @if (loading()) {
        <section class="card">
          <div class="skeleton-grid">
            <div class="skeleton-row" style="height: 18px; width: 30%;"></div>
            @for (i of [1,2,3,4,5]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        </section>
      } @else if (!teams().length) {
        <ui-empty-state
          icon="groups"
          title="No teams yet"
          description="Create your first team to organize learners and assign trainings."
        >
          <button class="btn btn-primary" type="button" (click)="modalOpen.set(true)">Create team</button>
        </ui-empty-state>
      } @else {
        <section class="card">
          <div class="toolbar">
            <div>
              <h2>All teams</h2>
              <p class="muted">{{ filteredRows().length }} of {{ teams().length }} teams</p>
            </div>
          </div>

          <div class="filter-bar section-gap">
            <div class="search-input-wrap">
              <span class="material-symbols-outlined">search</span>
              <input class="control" placeholder="Search teams..." (input)="onSearch($event)" />
            </div>
          </div>

          <div class="section-gap">
            <ui-data-table
              [columns]="columns"
              [rows]="filteredRows()"
              emptyText="No teams match your search."
              (rowClick)="openTeam($event)"
            />
          </div>
        </section>
      }

      <ui-modal title="Create team" [open]="modalOpen()" (closed)="modalOpen.set(false)">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="create()">
          <label class="field"><span>Name</span><input class="control" formControlName="name" placeholder="e.g. Engineering" /></label>
          <ui-entity-combobox
            label="Manager"
            placeholder="Search team managers"
            emptyText="No team managers found."
            [options]="managerOptions()"
            [value]="form.controls.managerId.value"
            [loading]="managerLoading()"
            (valueChange)="setManager($event)"
          />
          <label class="field"><span>Description</span><textarea class="control" formControlName="description" placeholder="Brief team description..."></textarea></label>
          @if (message()) { <p class="alert alert-error">{{ message() }}</p> }
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="modalOpen.set(false)">Cancel</button>
            <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Creating...' : 'Create team' }}</button>
          </div>
        </form>
      </ui-modal>
    </div>
  `,
  styles: [`
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 18px; font-weight: 900; }
    .toolbar > div { display: grid; gap: 2px; }
  `]
})
export class TeamsListPage implements OnInit {
  private readonly teamsService = inject(TeamService);
  private readonly usersService = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);

  readonly teams = signal<TeamResponse[]>([]);
  readonly managers = signal<UserResponse[]>([]);
  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly managerLoading = signal(false);
  readonly saving = signal(false);
  readonly modalOpen = signal(false);
  readonly message = signal('');
  readonly searchQuery = signal('');
  readonly form = this.fb.group({
    name: ['', Validators.required],
    managerId: [null as number | null],
    description: ['']
  });

  readonly columns = [
    { key: 'name', label: 'Team' },
    { key: 'manager', label: 'Manager' },
    { key: 'members', label: 'Members' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created' }
  ];

  ngOnInit(): void {
    this.load();
    this.loadManagers();
  }

  totalMembers(): number {
    return this.teams().reduce((sum, team) => sum + (team.members?.length ?? 0), 0);
  }

  avgTeamSize(): string {
    const teams = this.teams();
    if (!teams.length) return '0';
    return (this.totalMembers() / teams.length).toFixed(1);
  }

  filteredRows(): Array<Record<string, unknown>> {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.rows();
    return this.rows().filter(row =>
      String(row['name'] ?? '').toLowerCase().includes(query) ||
      String(row['manager'] ?? '').toLowerCase().includes(query) ||
      String(row['description'] ?? '').toLowerCase().includes(query)
    );
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  openTeam(row: Record<string, unknown>): void {
    if (row['id']) {
      this.router.navigate(['/teams', row['id']]);
    }
  }

  load(): void {
    this.loading.set(true);
    this.teamsService.list({ page: 0, size: 50, sort: 'createdAt,desc' }).subscribe({
      next: (response) => {
        const teams = response.data?.content ?? [];
        this.teams.set(teams);
        this.rows.set(teams.map((team) => this.toRow(team)));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  create(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.message.set('');
    const payload = this.form.getRawValue();
    this.teamsService.create({ ...payload, managerId: payload.managerId ? Number(payload.managerId) : null }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.modalOpen.set(false);
        this.form.reset({ name: '', managerId: null, description: '' });
        this.toast.success(response.message || 'Team created.');
        this.load();
      },
      error: (error) => {
        this.saving.set(false);
        this.message.set(parseApiError(error).message);
      }
    });
  }

  private toRow(team: TeamResponse): Record<string, unknown> {
    return {
      id: team.id,
      name: team.name,
      manager: team.managerId ? this.managerName(team.managerId) : '—',
      members: team.members?.length ?? 0,
      description: team.description ? (team.description.length > 60 ? team.description.substring(0, 60) + '...' : team.description) : '—',
      createdAt: team.createdAt ? new Date(team.createdAt).toLocaleDateString() : '—'
    };
  }

  setManager(id: number | null): void {
    this.form.controls.managerId.setValue(id);
  }

  managerOptions(): EntityOption[] {
    return this.managers().map((manager) => ({
      id: manager.id,
      label: `${manager.firstName} ${manager.lastName}`,
      meta: manager.email,
      icon: 'supervisor_account'
    }));
  }

  private loadManagers(): void {
    this.managerLoading.set(true);
    this.usersService.list({ page: 0, size: 50, role: 'TEAM_MANAGER', sort: 'lastName,asc' }).subscribe({
      next: (response) => {
        this.managers.set(response.data?.content ?? []);
        this.rows.set(this.teams().map((team) => this.toRow(team)));
      },
      error: (error) => {
        this.toast.error(parseApiError(error).message);
        this.managerLoading.set(false);
      },
      complete: () => this.managerLoading.set(false)
    });
  }

  private managerName(id: number): string {
    const manager = this.managers().find((item) => item.id === id);
    return manager ? `${manager.firstName} ${manager.lastName}` : `User #${id}`;
  }
}
