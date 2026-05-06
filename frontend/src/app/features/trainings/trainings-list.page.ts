import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { TrainingResponse, TrainingStatus } from '../../core/models/api.models';
import { ToastService } from '../../core/services/toast.service';
import { TrainingService } from '../../core/services/training.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiBadgeComponent } from '../../shared/ui/badge/ui-badge.component';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';

import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiPageHeaderComponent, UiBadgeComponent, UiDataTableComponent, UiEmptyStateComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header [eyebrow]="headerEyebrow()" [title]="headerTitle()" [description]="headerDescription()">
        @if (canCreate()) {
          <a class="btn btn-primary" routerLink="/trainings/create">
            <span class="material-symbols-outlined">add_circle</span>
            Create training
          </a>
        }
      </ui-page-header>

      <section class="card catalog-toolbar">
        <div class="search-row">
          <label class="field search-field">
            <span>Search catalog</span>
            <input class="control" [formControl]="query" placeholder="Search by title, category or trainer" (keyup.enter)="load()" />
          </label>
          <label class="field">
            <span>Status</span>
            <select class="control" [formControl]="status" (change)="load()">
              <option value="">All visible</option>
              @if (canManage()) {
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Category</span>
            <select class="control" [formControl]="category" (change)="load()">
              <option value="">All categories</option>
              @for (item of categories(); track item) {
                <option [value]="item">{{ item }}</option>
              }
            </select>
          </label>
          <button class="btn btn-primary" type="button" (click)="load()">
            <span class="material-symbols-outlined">search</span>
            Search
          </button>
        </div>

        <div class="toolbar catalog-meta">
          <div>
            <strong>{{ total() }} trainings</strong>
            <span class="muted">{{ visibleSummary() }}</span>
          </div>
          <div class="segmented" role="group" aria-label="Catalog view">
            <button class="segment" type="button" [class.active]="view() === 'cards'" (click)="view.set('cards')">
              <span class="material-symbols-outlined">grid_view</span>
              Cards
            </button>
            <button class="segment" type="button" [class.active]="view() === 'table'" (click)="view.set('table')">
              <span class="material-symbols-outlined">view_list</span>
              Table
            </button>
          </div>
        </div>
      </section>

      @if (canManage()) {
        <section class="grid grid-4">
          <ui-stat-card label="Portfolio" [value]="trainings().length" icon="auto_stories" trend="Trainer-owned programs" />
          <ui-stat-card label="Published" [value]="statusCount('PUBLISHED')" icon="public" trend="Visible to assignments" />
          <ui-stat-card label="Drafts" [value]="statusCount('DRAFT')" icon="edit_note" trend="Still being prepared" />
          <ui-stat-card label="Archived" [value]="statusCount('ARCHIVED')" icon="inventory_2" trend="Hidden from active catalog" />
        </section>
      }

      @if (loading()) {
        <section class="card">
          <div class="skeleton-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        </section>
      } @else if (trainings().length && view() === 'cards') {
        <section class="training-grid">
          @for (training of trainings(); track training.id) {
            <article class="training-card">
              <a class="training-thumb" [routerLink]="['/trainings', training.id]">
                @if (training.thumbnailUrl) {
                  <img [src]="training.thumbnailUrl" [alt]="training.title" />
                } @else {
                  <span class="material-symbols-outlined">auto_stories</span>
                }
                <ui-badge [tone]="statusTone(training.status)">{{ training.status }}</ui-badge>
              </a>
              <div class="training-body">
                <div class="training-meta">
                  <span>{{ training.category || 'General' }}</span>
                  <span>{{ levelLabel(training.level) }}</span>
                </div>
                <h2><a [routerLink]="['/trainings', training.id]">{{ training.title }}</a></h2>
                <p>{{ training.shortDescription || training.description || 'No description has been added yet.' }}</p>
                <div class="training-footer">
                  <span>{{ training.durationMinutes || 0 }} min</span>
                  <span>{{ training.language || 'en' }}</span>
                  <a [routerLink]="['/trainings', training.id]">Open</a>
                </div>
              </div>
            </article>
          }
        </section>
      } @else if (trainings().length && view() === 'table') {
        <section class="card">
          <ui-data-table [columns]="columns" [rows]="rows()" emptyText="No trainings match your search." (rowClick)="openTraining($event)" />
        </section>
      } @else {
        <ui-empty-state
          icon="auto_stories"
          title="No trainings found"
          [description]="emptyText()"
        >
          @if (canCreate()) {
            <a class="btn btn-primary" routerLink="/trainings/create">Create the first training</a>
          }
        </ui-empty-state>
      }
    </div>
  `,
  styles: [`
    .catalog-toolbar { display: grid; gap: 18px; }
    .search-row { display: grid; grid-template-columns: minmax(260px, 1fr) minmax(160px, 0.35fr) minmax(180px, 0.4fr) auto; gap: 14px; align-items: end; }
    .search-field { min-width: 0; }
    .catalog-meta > div:first-child { display: grid; gap: 3px; }
    .catalog-meta strong { color: var(--color-heading); font-size: 17px; }
    .loading-row { justify-content: flex-start; }
    .training-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); gap: 18px; }
    .training-card { overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: #fff; box-shadow: var(--shadow-soft); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; }
    .training-card:hover { transform: translateY(-3px); border-color: var(--color-border-strong); box-shadow: var(--shadow-hover); }
    .training-thumb { position: relative; display: grid; place-items: center; min-height: 158px; overflow: hidden; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); }
    .training-thumb img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .training-thumb > .material-symbols-outlined { font-size: 52px; opacity: 0.86; }
    .training-thumb ui-badge { position: absolute; top: 14px; right: 14px; }
    .training-body { display: grid; gap: 12px; padding: 18px; }
    .training-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .training-meta span { display: inline-flex; align-items: center; min-height: 26px; padding: 0 10px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 12px; font-weight: 850; }
    h2 { margin: 0; color: var(--color-heading); font-size: 18px; line-height: 1.35; font-weight: 900; }
    p { margin: 0; color: var(--color-muted); line-height: 1.65; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .training-footer { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding-top: 4px; color: var(--color-muted); font-size: 12px; font-weight: 800; }
    .training-footer a { margin-left: auto; color: var(--color-primary-strong); }
    @media (max-width: 940px) { .search-row { grid-template-columns: 1fr 1fr; } .search-row .btn { grid-column: 1 / -1; } }
    @media (max-width: 620px) { .search-row { grid-template-columns: 1fr; } }
  `]
})
export class TrainingsListPage implements OnInit {
  private readonly trainingService = inject(TrainingService);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  private readonly router = inject(Router);

  readonly query = new FormControl('', { nonNullable: true });
  readonly status = new FormControl('', { nonNullable: true });
  readonly category = new FormControl('', { nonNullable: true });
  readonly view = signal<'cards' | 'table'>('cards');
  readonly trainings = signal<TrainingResponse[]>([]);
  readonly rows = signal<Array<Record<string, unknown>>>([]);
  readonly loading = signal(false);
  readonly total = signal(0);
  readonly categories = signal<string[]>([]);
  readonly role = computed(() => this.auth.currentUser()?.role);

  readonly columns = [
    { key: 'title', label: 'Title' },
    { key: 'category', label: 'Category' },
    { key: 'level', label: 'Level' },
    { key: 'duration', label: 'Duration' },
    { key: 'status', label: 'Status', type: 'status' as const }
  ];

  ngOnInit(): void {
    this.auth.ensureCurrentUser().pipe(catchError(() => of(null))).subscribe(() => this.load());
  }

  canCreate(): boolean {
    return this.auth.hasRole(['TRAINER', 'SUPER_ADMIN']);
  }

  canManage(): boolean {
    return this.auth.hasRole(['TRAINER', 'SUPER_ADMIN']);
  }

  headerEyebrow(): string {
    return this.role() === 'LEARNER' ? 'My learning' : 'Curriculum';
  }

  headerTitle(): string {
    if (this.role() === 'TRAINER') {
      return 'My trainings';
    }
    if (this.role() === 'LEARNER') {
      return 'Assigned trainings';
    }
    return 'Training catalog';
  }

  headerDescription(): string {
    if (this.role() === 'TRAINER') {
      return 'Manage your course portfolio, publishing status, and lesson paths.';
    }
    if (this.role() === 'LEARNER') {
      return 'Open assigned programs, continue lessons, and complete quizzes.';
    }
    return 'Browse and manage the trainings available to this workspace.';
  }

  visibleSummary(): string {
    return this.canManage() ? 'Drafts, published and archived programs are available based on your role.' : 'Only published and accessible trainings are shown.';
  }

  emptyText(): string {
    return this.canCreate()
      ? 'Create a training draft to begin building a course path with lessons and quizzes.'
      : 'No published or assigned trainings are available for this account yet.';
  }

  levelLabel(level: string): string {
    return level ? level.replaceAll('_', ' ').toLowerCase() : 'all levels';
  }

  statusTone(status: TrainingStatus): 'success' | 'warning' | 'danger' | 'info' {
    if (status === 'PUBLISHED') {
      return 'success';
    }
    if (status === 'ARCHIVED') {
      return 'danger';
    }
    return 'warning';
  }

  statusCount(status: TrainingStatus): number {
    return this.trainings().filter((training) => training.status === status).length;
  }

  openTraining(row: Record<string, unknown>): void {
    if (row['id']) {
      this.router.navigate(['/trainings', row['id']]);
    }
  }

  load(): void {
    this.loading.set(true);
    const currentUser = this.auth.currentUser();
    this.trainingService.list({
      page: 0,
      size: 30,
      q: this.query.value || undefined,
      category: this.category.value || undefined,
      status: this.status.value || undefined,
      trainerId: currentUser?.role === 'TRAINER' ? currentUser.id : undefined,
      sort: 'createdAt,desc'
    }).subscribe({
      next: (response) => {
        const trainings = response.data?.content ?? [];
        this.trainings.set(trainings);
        this.total.set(response.data?.totalElements ?? trainings.length);
        this.categories.set([...new Set(trainings.map((training) => training.category).filter((item): item is string => Boolean(item)))].sort());
        this.rows.set(
          trainings.map((training) => ({
            id: training.id,
            title: training.title,
            category: training.category || '-',
            level: training.level,
            duration: `${training.durationMinutes || 0} min`,
            status: training.status
          }))
        );
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }
}
