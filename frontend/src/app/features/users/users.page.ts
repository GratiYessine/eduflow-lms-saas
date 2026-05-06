import { Component, ElementRef, OnInit, ViewChildren, QueryList, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { CompanyResponse, Role, UserResponse } from '../../core/models/api.models';
import { CompanyService } from '../../core/services/company.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { EntityComboboxComponent, EntityOption } from '../../shared/ui/entity-combobox/entity-combobox.component';
import { UiModalComponent } from '../../shared/ui/modal/ui-modal.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

interface RoleOption {
  value: Role;
  label: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, EntityComboboxComponent, UiDataTableComponent, UiModalComponent, UiPageHeaderComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Administration" title="Users" description="Manage platform users and role assignments.">
        <button class="btn btn-primary" type="button" (click)="modalOpen.set(true)">
          <span class="material-symbols-outlined">person_add</span>
          New user
        </button>
      </ui-page-header>

      @if (!listLoading()) {
        <section class="grid grid-4">
          <ui-stat-card label="Total users" [value]="companyUsers().length" icon="people" [trend]="activeCount() + ' active'" />
          <ui-stat-card label="Learners" [value]="roleCount('LEARNER')" icon="school" trend="Learning role" />
          <ui-stat-card label="Managers" [value]="roleCount('TEAM_MANAGER')" icon="supervisor_account" trend="Team leadership" />
          <ui-stat-card label="Admins" [value]="roleCount('COMPANY_ADMIN')" icon="admin_panel_settings" trend="Organization admin" />
        </section>
      }

      <section class="card">
        <div class="toolbar">
          <div>
            <h2>Company users</h2>
            <p class="muted">Users in your company.</p>
          </div>
        </div>

        <div class="filter-bar section-gap">
          <div class="search-input-wrap">
            <span class="material-symbols-outlined">search</span>
            <input class="control" placeholder="Search by name or email..." (input)="onSearch($event)" />
          </div>
          <label class="field">
            <span>Role</span>
            <select class="control" #roleSelect (change)="onRoleFilter($event)">
              <option value="">All roles</option>
              <option value="LEARNER">Learner</option>
              <option value="TEAM_MANAGER">Team manager</option>
              <option value="COMPANY_ADMIN">Company admin</option>
              @if (auth.currentUser()?.role === 'SUPER_ADMIN') {
                <option value="TRAINER">Trainer</option>
                <option value="SUPER_ADMIN">Super admin</option>
              }
            </select>
          </label>
          <label class="field">
            <span>Status</span>
            <select class="control" #statusSelect (change)="onStatusFilter($event)">
              <option value="">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </label>
          @if (auth.currentUser()?.role === 'SUPER_ADMIN') {
            <label class="field">
              <span>Company</span>
              <select class="control" #companySelect (change)="onCompanyFilter($event)">
                @for (company of companies(); track company.id) {
                  <option [value]="company.id" [selected]="company.id === companyFilterId()">{{ company.name }}</option>
                }
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

        @if (listLoading()) {
          <div class="skeleton-grid section-gap">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="skeleton-row"></div>
            }
          </div>
        } @else {
          <div class="section-gap">
            <ui-data-table
              [columns]="userColumns"
              [rows]="filteredRows()"
              emptyText="No users match your filters."
            />
          </div>
        }
      </section>

      <!-- Create User Modal -->
      <ui-modal title="Create user" [open]="modalOpen()" (closed)="closeModal()">
        <form class="form-grid" [formGroup]="form" (ngSubmit)="reviewCreate()">
          <div class="grid grid-2">
            <label class="field">
              <span>First name</span>
              <input class="control" formControlName="firstName" placeholder="John" />
              @if (submitted() && form.controls.firstName.invalid) { <p class="field-error">Required.</p> }
            </label>
            <label class="field">
              <span>Last name</span>
              <input class="control" formControlName="lastName" placeholder="Doe" />
              @if (submitted() && form.controls.lastName.invalid) { <p class="field-error">Required.</p> }
            </label>
          </div>

          <div class="grid grid-2">
            <label class="field">
              <span>Email</span>
              <input class="control" type="email" formControlName="email" placeholder="john@company.com" />
              @if (submitted() && form.controls.email.invalid) { <p class="field-error">Valid email required.</p> }
            </label>
            <label class="field">
              <span>Password</span>
              <input class="control" type="password" formControlName="password" placeholder="Min. 8 characters" />
              @if (submitted() && form.controls.password.invalid) { <p class="field-error">8+ chars, upper, lower, number.</p> }
            </label>
          </div>

          <div class="grid grid-2">
            <label class="field">
              <span>Role</span>
              <select class="control" formControlName="role" (change)="onRoleChanged()">
                @for (role of availableRoles(); track role.value) { <option [value]="role.value">{{ role.label }}</option> }
              </select>
            </label>
            @if (companyFieldVisible()) {
              <ui-entity-combobox
                label="Company"
                placeholder="Search companies"
                emptyText="No companies found."
                [options]="companyOptions()"
                [value]="form.controls.companyId.value"
                [loading]="lookupLoading()"
                [disabled]="auth.currentUser()?.role !== 'SUPER_ADMIN'"
                (valueChange)="setCompany($event)"
              />
            }
          </div>

          <label class="field"><span>Phone</span><input class="control" formControlName="phone" placeholder="Optional" /></label>

          @if (message()) { <p class="alert" [class.alert-error]="hasError()">{{ message() }}</p> }
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" type="submit" [disabled]="saving() || lookupLoading()">{{ saving() ? 'Creating...' : 'Review user' }}</button>
          </div>
        </form>
      </ui-modal>

      <!-- Confirm Modal -->
      <ui-modal title="Confirm user" [open]="confirming()" (closed)="confirming.set(false)">
        <div class="confirm-stack">
          <p>{{ createSummary() }}</p>
          <div class="form-actions">
            <button class="btn btn-secondary" type="button" (click)="confirming.set(false)" [disabled]="saving()">Cancel</button>
            <button class="btn btn-primary" type="button" (click)="create()" [disabled]="saving()">{{ saving() ? 'Creating...' : 'Create user' }}</button>
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
export class UsersPage implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly users = inject(UserService);
  private readonly companiesService = inject(CompanyService);
  private readonly toast = inject(ToastService);

  @ViewChildren('roleSelect, statusSelect, companySelect') selectRefs!: QueryList<ElementRef<HTMLSelectElement>>;

  readonly allRoles: RoleOption[] = [
    { value: 'LEARNER', label: 'Learner' },
    { value: 'TEAM_MANAGER', label: 'Team manager' },
    { value: 'COMPANY_ADMIN', label: 'Company admin' },
    { value: 'TRAINER', label: 'Trainer' },
    { value: 'SUPER_ADMIN', label: 'Super admin' }
  ];
  readonly companies = signal<CompanyResponse[]>([]);
  readonly companyFilterId = signal<number | null>(null);
  readonly companyUsers = signal<UserResponse[]>([]);
  readonly userRows = signal<Array<Record<string, unknown>>>([]);
  readonly saving = signal(false);
  readonly lookupLoading = signal(false);
  readonly listLoading = signal(false);
  readonly confirming = signal(false);
  readonly submitted = signal(false);
  readonly modalOpen = signal(false);
  readonly message = signal('');
  readonly hasError = signal(false);
  readonly searchQuery = signal('');
  readonly roleFilterValue = signal('');
  readonly statusFilterValue = signal('');

  readonly userColumns = [
    { key: 'name', label: 'User' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status', type: 'status' as const },
    { key: 'createdAt', label: 'Created' }
  ];

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    role: this.fb.control<Role>('LEARNER', { validators: [Validators.required] }),
    companyId: [null as number | null],
    phone: ['']
  });

  ngOnInit(): void {
    this.auth.ensureCurrentUser().subscribe({
      next: () => {
        if (this.auth.currentUser()?.role === 'COMPANY_ADMIN') {
          this.form.controls.role.setValue('LEARNER');
        }
        this.loadCompanies();
      },
      error: () => this.loadCompanies()
    });
  }

  activeCount(): number {
    return this.companyUsers().filter(u => u.status === 'ACTIVE').length;
  }

  roleCount(role: Role): number {
    return this.companyUsers().filter(u => u.role === role).length;
  }

  filteredRows(): Array<Record<string, unknown>> {
    let result = this.userRows();
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter(row =>
        String(row['name'] ?? '').toLowerCase().includes(query) ||
        String(row['email'] ?? '').toLowerCase().includes(query)
      );
    }
    const role = this.roleFilterValue();
    if (role) {
      result = result.filter(row => {
        const user = this.companyUsers().find(u => u.id === row['id']);
        return user?.role === role;
      });
    }
    const status = this.statusFilterValue();
    if (status) {
      result = result.filter(row => {
        const user = this.companyUsers().find(u => u.id === row['id']);
        return user?.status === status;
      });
    }
    return result;
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.roleFilterValue() || this.statusFilterValue());
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.roleFilterValue.set('');
    this.statusFilterValue.set('');
    // Reset DOM select elements to match signal state
    this.selectRefs?.forEach(ref => {
      if (ref.nativeElement) {
        ref.nativeElement.selectedIndex = 0;
      }
    });
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onRoleFilter(event: Event): void {
    this.roleFilterValue.set((event.target as HTMLSelectElement).value);
  }

  onStatusFilter(event: Event): void {
    this.statusFilterValue.set((event.target as HTMLSelectElement).value);
  }

  onCompanyFilter(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    this.companyFilterId.set(id || null);
    this.loadUsers();
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.submitted.set(false);
    this.message.set('');
  }

  availableRoles(): RoleOption[] {
    if (this.auth.currentUser()?.role === 'COMPANY_ADMIN') {
      return this.allRoles.filter((role) => role.value === 'LEARNER' || role.value === 'TEAM_MANAGER');
    }
    return this.allRoles;
  }

  companyOptions(): EntityOption[] {
    return this.companies().map((company) => ({
      id: company.id,
      label: company.name,
      meta: company.industry || 'Company',
      icon: 'business'
    }));
  }

  companyRequired(): boolean {
    const role = this.form.controls.role.value;
    return role === 'LEARNER' || role === 'TEAM_MANAGER' || role === 'COMPANY_ADMIN';
  }

  companyFieldVisible(): boolean {
    return this.companyRequired();
  }

  setCompany(id: number | null): void {
    this.form.controls.companyId.setValue(id);
  }

  onRoleChanged(): void {
    this.message.set('');
    this.submitted.set(false);
    if (!this.companyRequired()) {
      this.form.controls.companyId.setValue(null);
      return;
    }
    if (this.companies().length === 1) {
      this.form.controls.companyId.setValue(this.companies()[0].id);
    }
  }

  reviewCreate(): void {
    this.submitted.set(true);
    this.message.set('');
    this.hasError.set(false);
    if (!this.formValid()) {
      this.hasError.set(true);
      this.message.set('Complete the required fields before creating the user.');
      return;
    }
    this.confirming.set(true);
  }

  create(): void {
    if (!this.formValid()) {
      this.reviewCreate();
      return;
    }
    this.saving.set(true);
    this.message.set('');
    this.hasError.set(false);
    const payload = this.form.getRawValue();
    this.users.create({ ...payload, companyId: this.companyRequired() ? payload.companyId : null }).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.confirming.set(false);
        this.modalOpen.set(false);
        this.submitted.set(false);
        this.message.set('');
        this.toast.success(`${response.data?.firstName} ${response.data?.lastName} created.`);
        this.loadUsers();
        this.form.reset({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          role: this.availableRoles()[0].value,
          companyId: this.companies().length === 1 ? this.companies()[0].id : null,
          phone: ''
        });
      },
      error: (error) => {
        this.saving.set(false);
        this.confirming.set(false);
        this.hasError.set(true);
        this.message.set(parseApiError(error).message);
      }
    });
  }

  createSummary(): string {
    const payload = this.form.getRawValue();
    const company = this.companies().find((item) => item.id === payload.companyId)?.name;
    return `${payload.firstName} ${payload.lastName} will be created as ${this.roleLabel(payload.role)}${company ? ` for ${company}` : ''}.`;
  }

  private loadCompanies(): void {
    this.lookupLoading.set(true);
    if (this.auth.currentUser()?.role === 'SUPER_ADMIN') {
      this.companiesService.list({ page: 0, size: 100, sort: 'name,asc' }).subscribe({
        next: (response) => {
          const companies = response.data?.content ?? [];
          this.companies.set(companies);
          if (!this.companyFilterId() && companies.length) {
            this.companyFilterId.set(companies[0].id);
          }
          this.loadUsers();
        },
        error: (error) => {
          this.toast.error(parseApiError(error).message);
          this.lookupLoading.set(false);
        },
        complete: () => this.lookupLoading.set(false)
      });
      return;
    }
    this.companiesService.me().subscribe({
      next: (response) => {
        this.companies.set(response.data ? [response.data] : []);
        if (response.data) {
          this.form.controls.companyId.setValue(response.data.id);
          this.companyFilterId.set(response.data.id);
        }
        this.loadUsers();
      },
      error: (error) => {
        this.toast.error(parseApiError(error).message);
        this.lookupLoading.set(false);
      },
      complete: () => this.lookupLoading.set(false)
    });
  }

  private formValid(): boolean {
    return this.form.valid && (!this.companyRequired() || !!this.form.controls.companyId.value);
  }

  private loadUsers(): void {
    const companyId = this.companyFilterId();
    if (!companyId) {
      this.companyUsers.set([]);
      this.userRows.set([]);
      return;
    }
    this.listLoading.set(true);
    this.users.list({ page: 0, size: 100, companyId, sort: 'lastName,asc' }).subscribe({
      next: (response) => {
        const users = response.data?.content ?? [];
        this.companyUsers.set(users);
        this.userRows.set(users.map((user) => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: this.roleLabel(user.role),
          status: user.status,
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'
        })));
        this.listLoading.set(false);
      },
      error: (error) => {
        this.listLoading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private roleLabel(role?: Role): string {
    return this.allRoles.find((item) => item.value === role)?.label ?? 'User';
  }
}
