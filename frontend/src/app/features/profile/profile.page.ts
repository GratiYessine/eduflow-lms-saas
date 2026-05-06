import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { CompanyResponse, TrainerProfileResponse } from '../../core/models/api.models';
import { CompanyService } from '../../core/services/company.service';
import { FileUploadService } from '../../core/services/file-upload.service';
import { TrainerService } from '../../core/services/trainer.service';
import { ToastService } from '../../core/services/toast.service';
import { UserService } from '../../core/services/user.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';
import { UiTextareaComponent } from '../../shared/ui/textarea/ui-textarea.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, UiPageHeaderComponent, UiProgressBarComponent, UiTextareaComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Account" title="Profile" description="Personal, company and trainer profile details connected to the backend." />
      @if (loading()) {
        <section class="card skeleton-grid" style="min-height: 200px;">
          <div class="skeleton-row" style="height: 40px; width: 50%;"></div>
          <div class="skeleton-row" style="height: 20px; width: 80%;"></div>
          <div class="skeleton-row" style="height: 20px; width: 60%;"></div>
        </section>
      }
      @if (isTrainer()) {
        <section class="trainer-preview card">
          <div class="trainer-avatar">
            @if (form.controls.avatarUrl.value) {
              <img [src]="form.controls.avatarUrl.value" alt="Trainer avatar" />
            } @else {
              <span>{{ trainerInitials() }}</span>
            }
          </div>
          <div class="trainer-preview-copy">
            <span class="badge badge-info">Trainer portfolio</span>
            <h2>{{ form.controls.firstName.value }} {{ form.controls.lastName.value }}</h2>
            <p>{{ trainerForm.controls.expertise.value || 'Add your specialty so companies understand your expertise.' }}</p>
            <div class="trainer-preview-links">
              @for (link of portfolioLinks(); track link) {
                <a [href]="link" target="_blank" rel="noreferrer">{{ link }}</a>
              } @empty {
                <span class="muted">No portfolio links yet</span>
              }
            </div>
          </div>
        </section>
      }
      <section class="profile-grid">
        <form class="card form-grid" [formGroup]="form" (ngSubmit)="saveProfile()">
          <div class="profile-card-head">
            <span class="material-symbols-outlined">account_circle</span>
            <div>
              <h2>Personal profile</h2>
              <p class="muted">Visible account details and avatar.</p>
            </div>
          </div>
          <div class="grid grid-2">
            <label class="field"><span>First name</span><input class="control" formControlName="firstName" /></label>
            <label class="field"><span>Last name</span><input class="control" formControlName="lastName" /></label>
          </div>
          <label class="field"><span>Email</span><input class="control" type="email" formControlName="email" /></label>
          <label class="field"><span>Phone</span><input class="control" formControlName="phone" /></label>
          <div class="field">
            <span>Avatar</span>
            <label class="profile-upload">
              <span class="material-symbols-outlined">add_a_photo</span>
              <strong>Upload avatar</strong>
              <small>Image file, max 20MB.</small>
              <input type="file" accept="image/*" (change)="uploadAvatar($event)" />
            </label>
            @if (avatarProgress() > 0 && avatarProgress() < 100) { <ui-progress-bar [value]="avatarProgress()" /> }
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="form.invalid || savingProfile()">{{ savingProfile() ? 'Saving...' : 'Save profile' }}</button>
        </form>

        <form class="card form-grid" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="profile-card-head">
            <span class="material-symbols-outlined">lock_reset</span>
            <div>
              <h2>Password security</h2>
              <p class="muted">Request a 6-digit email code before changing your password.</p>
            </div>
          </div>
          <label class="field"><span>Current password</span><input class="control" type="password" formControlName="currentPassword" autocomplete="current-password" /></label>
          <div class="code-row">
            <label class="field"><span>Email code</span><input class="control" formControlName="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="123456" /></label>
            <button class="btn btn-secondary code-btn" type="button" [disabled]="sendingPasswordCode()" (click)="sendPasswordCode()">
              {{ sendingPasswordCode() ? 'Sending...' : 'Send code' }}
            </button>
          </div>
          <label class="field"><span>New password</span><input class="control" type="password" formControlName="newPassword" autocomplete="new-password" /></label>
          <button class="btn btn-primary" type="submit" [disabled]="passwordForm.invalid || changingPassword()">{{ changingPassword() ? 'Changing...' : 'Change password' }}</button>
        </form>

        <form class="card form-grid" [formGroup]="companyForm" (ngSubmit)="saveCompany()">
          <div class="profile-card-head">
            <span class="material-symbols-outlined">business</span>
            <div>
              <h2>Company profile</h2>
              <p class="muted">Company identity for admins and managers.</p>
            </div>
          </div>
          @if (company()) {
            <label class="field"><span>Company name</span><input class="control" formControlName="name" /></label>
            <div class="grid grid-2">
              <label class="field"><span>Industry</span><input class="control" formControlName="industry" /></label>
              <label class="field"><span>Size</span><input class="control" formControlName="size" /></label>
            </div>
            <label class="field"><span>Website</span><input class="control" formControlName="website" /></label>
            <label class="field">
              <span>Company logo</span>
              <label class="profile-upload">
                <span class="material-symbols-outlined">add_a_photo</span>
                <strong>Upload company logo</strong>
                <small>Image file, max 20MB.</small>
                <input type="file" accept="image/*" (change)="uploadLogo($event)" />
              </label>
              @if (logoProgress() > 0 && logoProgress() < 100) { <ui-progress-bar [value]="logoProgress()" /> }
            </label>
            <button class="btn btn-primary" type="submit" [disabled]="companyForm.invalid || savingCompany()">{{ savingCompany() ? 'Saving...' : 'Save company' }}</button>
          } @else {
            <p class="empty-inline">Company profile is only available for company-linked users.</p>
          }
        </form>

        @if (isTrainer()) {
          <form class="card form-grid trainer-card" [formGroup]="trainerForm" (ngSubmit)="saveTrainerProfile()">
            <div class="profile-card-head">
              <span class="material-symbols-outlined">workspace_premium</span>
              <div>
                <h2>Trainer portfolio</h2>
                <p class="muted">Inspired by Edunet’s formateur profile: expertise, portfolio and bio.</p>
              </div>
            </div>
            <div class="grid grid-2">
              <ui-stat-card label="Rating" [value]="trainerProfile()?.rating || 0" icon="star" trend="Community score" />
              <ui-stat-card label="Trainings" [value]="trainerProfile()?.totalTrainings || 0" icon="auto_stories" trend="Published courses" />
            </div>
            <label class="field"><span>Expertise</span><input class="control" formControlName="expertise" placeholder="Leadership, compliance, sales enablement..." /></label>
            <label class="field"><span>Portfolio URL</span><input class="control" formControlName="portfolioUrl" placeholder="https://..." /></label>
            <label class="field"><span>Social links</span><input class="control" formControlName="socialLinks" placeholder="LinkedIn, website, GitHub..." /></label>
            <label class="field"><span>Bio</span><ui-textarea formControlName="bio" placeholder="Tell companies what outcomes you help teams achieve." /></label>
            <article class="document-panel">
              <div class="profile-card-head">
                <span class="material-symbols-outlined">description</span>
                <div>
                  <h2>Documents</h2>
                  <p class="muted">Display your CV, certificate and diploma links for company admins.</p>
                </div>
              </div>
              <div class="grid grid-3">
                <label class="field"><span>CV URL</span><input class="control" formControlName="cvUrl" placeholder="https://..." /></label>
                <label class="field"><span>Certificate URL</span><input class="control" formControlName="certificateUrl" placeholder="https://..." /></label>
                <label class="field"><span>Diploma URL</span><input class="control" formControlName="diplomaUrl" placeholder="https://..." /></label>
              </div>
              <div class="document-list">
                @for (document of trainerDocuments(); track document.label) {
                  <a [href]="document.url" target="_blank" rel="noreferrer">
                    <span class="material-symbols-outlined">description</span>
                    <strong>{{ document.label }}</strong>
                  </a>
                } @empty {
                  <p class="empty-inline">No trainer documents added yet.</p>
                }
              </div>
            </article>
            <button class="btn btn-primary" type="submit" [disabled]="savingTrainer()">{{ savingTrainer() ? 'Saving...' : 'Save trainer profile' }}</button>
          </form>
        }
      </section>
    </div>
  `,
  styles: [`
    .profile-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start; }
    .trainer-preview { display: grid; grid-template-columns: 104px minmax(0, 1fr); gap: 20px; align-items: center; overflow: hidden; }
    .trainer-avatar { display: grid; place-items: center; width: 104px; height: 104px; border-radius: 28px; overflow: hidden; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); box-shadow: var(--shadow-card); font-size: 28px; font-weight: 950; }
    .trainer-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .trainer-preview-copy { display: grid; gap: 10px; min-width: 0; }
    .trainer-preview-copy h2 { font-size: 28px; }
    .trainer-preview-links { display: flex; gap: 8px; flex-wrap: wrap; }
    .trainer-preview-links a { padding: 6px 10px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 12px; font-weight: 850; }
    .trainer-preview-stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .trainer-preview-stats div { padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: var(--color-surface-soft); }
    .trainer-preview-stats strong { display: block; color: var(--color-heading); font-size: 24px; font-weight: 900; }
    .trainer-preview-stats span { color: var(--color-muted); font-size: 11px; font-weight: 850; letter-spacing: 0.06em; text-transform: uppercase; }
    .profile-card-head { display: flex; align-items: flex-start; gap: 14px; }
    .profile-card-head > span { display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; border-radius: 15px; background: var(--color-primary-soft); color: var(--color-primary); }
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 20px; font-weight: 900; }
    .profile-upload { display: grid; justify-items: center; gap: 8px; padding: 22px 16px; border: 1.5px dashed var(--color-border-strong); border-radius: var(--radius-xl); background: rgba(248,250,252,0.82); text-align: center; cursor: pointer; }
    .profile-upload input { display: none; }
    .profile-upload > span { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 16px; color: var(--color-primary); background: var(--color-primary-soft); }
    .profile-upload strong { color: var(--color-heading); }
    .profile-upload small { color: var(--color-muted); }
    .code-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 12px; align-items: end; }
    .code-btn { min-height: 44px; margin-bottom: 0; white-space: nowrap; }
    .trainer-card { grid-column: 1 / -1; }
    .document-panel { display: grid; gap: 14px; padding: 16px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: rgba(248,250,252,0.72); }
    .document-list { display: flex; flex-wrap: wrap; gap: 10px; }
    .document-list a { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: var(--radius-lg); background: var(--color-primary-soft); color: var(--color-primary-strong); font-weight: 850; }
    @media (max-width: 900px) { .profile-grid, .trainer-preview, .code-row { grid-template-columns: 1fr; } .trainer-card { grid-column: auto; } }
  `]
})
export class ProfilePage implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly users = inject(UserService);
  private readonly companies = inject(CompanyService);
  private readonly files = inject(FileUploadService);
  private readonly trainers = inject(TrainerService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(true);
  readonly savingProfile = signal(false);
  readonly savingCompany = signal(false);
  readonly savingTrainer = signal(false);
  readonly sendingPasswordCode = signal(false);
  readonly changingPassword = signal(false);
  readonly avatarProgress = signal(0);
  readonly logoProgress = signal(0);
  readonly company = signal<CompanyResponse | null>(null);
  readonly trainerProfile = signal<TrainerProfileResponse | null>(null);

  readonly form = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    avatarUrl: [''],
    phone: ['']
  });
  readonly companyForm = this.fb.group({
    name: ['', Validators.required],
    industry: [''],
    website: [''],
    logoUrl: [''],
    size: ['']
  });
  readonly trainerForm = this.fb.group({
    bio: [''],
    expertise: [''],
    portfolioUrl: [''],
    socialLinks: [''],
    cvUrl: [''],
    certificateUrl: [''],
    diplomaUrl: ['']
  });
  readonly passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  ngOnInit(): void {
    this.users.me().pipe(catchError(() => of(null))).subscribe((user) => {
      if (user?.data) {
        this.form.patchValue(user.data);
        this.auth.currentUser.set(user.data);
        if (user.data.role === 'TRAINER') {
          this.loadTrainerProfile(user.data.id);
        }
      }
      const canLoadCompany = !!user?.data?.companyId && user.data.role !== 'TRAINER';
      const companyRequest = canLoadCompany ? this.companies.me().pipe(catchError(() => of(null))) : of(null);
      companyRequest.subscribe((company) => {
        if (company?.data) {
          this.company.set(company.data);
          this.companyForm.patchValue(company.data);
        }
        this.loading.set(false);
      });
    });
  }

  isTrainer(): boolean {
    return this.auth.currentUser()?.role === 'TRAINER';
  }

  trainerInitials(): string {
    const first = this.form.controls.firstName.value?.[0] ?? '';
    const last = this.form.controls.lastName.value?.[0] ?? '';
    return `${first}${last}`.toUpperCase() || 'TR';
  }

  portfolioLinks(): string[] {
    return this.splitLinks(this.trainerForm.controls.portfolioUrl.value);
  }

  socialLinks(): string[] {
    return this.splitLinks(this.trainerForm.controls.socialLinks.value);
  }

  trainerDocuments(): Array<{ label: string; url: string }> {
    const profile = this.trainerProfile();
    return [
      { label: 'CV', url: this.trainerForm.controls.cvUrl.value || profile?.cvUrl || '' },
      { label: 'Certificate', url: this.trainerForm.controls.certificateUrl.value || profile?.certificateUrl || '' },
      { label: 'Diploma', url: this.trainerForm.controls.diplomaUrl.value || profile?.diplomaUrl || '' }
    ].filter((document) => document.url.startsWith('http://') || document.url.startsWith('https://'));
  }

  uploadAvatar(event: Event): void {
    this.uploadImage(event, 'avatar');
  }

  uploadLogo(event: Event): void {
    this.uploadImage(event, 'logo');
  }

  saveProfile(): void {
    if (this.form.invalid) {
      return;
    }
    const { firstName, lastName, phone, avatarUrl } = this.form.getRawValue();
    this.savingProfile.set(true);
    this.users.updateMe({ firstName, lastName, phone, avatarUrl }).subscribe({
      next: (response) => {
        this.savingProfile.set(false);
        this.toast.success(response.message || 'Profile updated.');
      },
      error: (error) => {
        this.savingProfile.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  saveCompany(): void {
    const companyId = this.company()?.id;
    if (!companyId || this.companyForm.invalid) {
      return;
    }
    this.savingCompany.set(true);
    this.companies.update(companyId, this.companyForm.getRawValue()).subscribe({
      next: (response) => {
        this.company.set(response.data ?? null);
        this.savingCompany.set(false);
        this.toast.success(response.message || 'Company updated.');
      },
      error: (error) => {
        this.savingCompany.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  sendPasswordCode(): void {
    this.sendingPasswordCode.set(true);
    this.users.sendChangePasswordCode().subscribe({
      next: (response) => {
        this.sendingPasswordCode.set(false);
        this.toast.success(response.message || 'Password change code sent.');
      },
      error: (error) => {
        this.sendingPasswordCode.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }
    this.changingPassword.set(true);
    this.users.changePassword(this.passwordForm.getRawValue()).subscribe({
      next: (response) => {
        this.changingPassword.set(false);
        this.passwordForm.reset();
        this.toast.success(response.message || 'Password changed.');
      },
      error: (error) => {
        this.changingPassword.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  saveTrainerProfile(): void {
    if (!this.isTrainer()) {
      return;
    }
    this.savingTrainer.set(true);
    this.trainers.updateProfile(this.trainerForm.getRawValue()).subscribe({
      next: (response) => {
        this.trainerProfile.set(response.data ?? null);
        this.savingTrainer.set(false);
        this.toast.success(response.message || 'Trainer profile updated.');
      },
      error: (error) => {
        this.savingTrainer.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  private uploadImage(event: Event, target: 'avatar' | 'logo'): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      this.files.upload(file, target === 'avatar' ? 'AVATAR' : 'COMPANY_LOGO').subscribe({
        next: (state) => {
          if (target === 'avatar') {
            this.avatarProgress.set(state.progress);
          } else {
            this.logoProgress.set(state.progress);
          }
          if (state.file) {
            if (target === 'avatar') {
              this.form.controls.avatarUrl.setValue(state.file.url);
            } else {
              this.companyForm.controls.logoUrl.setValue(state.file.url);
            }
            this.toast.success('File uploaded.');
          }
        },
        error: (error) => this.toast.error(parseApiError(error).message)
      });
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Invalid file.');
    }
  }

  private loadTrainerProfile(id: number): void {
    this.trainers.get(id).pipe(catchError(() => of(null))).subscribe((response) => {
      if (response?.data) {
        this.trainerProfile.set(response.data);
        this.trainerForm.patchValue({
          bio: response.data.bio ?? '',
          expertise: response.data.expertise ?? '',
          portfolioUrl: response.data.portfolioUrl ?? '',
          socialLinks: response.data.socialLinks ?? '',
          cvUrl: response.data.cvUrl ?? '',
          certificateUrl: response.data.certificateUrl ?? '',
          diplomaUrl: response.data.diplomaUrl ?? ''
        });
      }
    });
  }

  private splitLinks(value: string): string[] {
    return value
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.startsWith('http://') || item.startsWith('https://'));
  }
}
