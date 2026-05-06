import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { controlError, parseApiError } from '../../core/utils/api-error.util';

type RegisterMode = 'choice' | 'trainer' | 'company';
type TrainerFileTarget = 'cv' | 'certificate' | 'diploma';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="register-page">
      <section class="register-card">
        <a class="brand" routerLink="/">
          <span class="brand-mark">E</span>
          <strong>EduFlow</strong>
        </a>

        @if (mode() === 'choice') {
          <div class="card-header center">
            <span class="badge badge-info">Create account</span>
            <h1>Choose your workspace</h1>
            <p>Select the role that matches how you'll use EduFlow.</p>
          </div>

          <div class="choice-grid">
            <article class="role-card" role="button" tabindex="0"
              (click)="setMode('trainer')"
              (keydown.enter)="setMode('trainer')"
              (keydown.space)="$event.preventDefault(); setMode('trainer')">
              <span class="role-icon material-symbols-outlined">record_voice_over</span>
              <h2>Trainer</h2>
              <p>Create and publish professional trainings.</p>
              <span class="role-arrow material-symbols-outlined">arrow_forward</span>
            </article>
            <article class="role-card" role="button" tabindex="0"
              (click)="setMode('company')"
              (keydown.enter)="setMode('company')"
              (keydown.space)="$event.preventDefault(); setMode('company')">
              <span class="role-icon material-symbols-outlined">domain</span>
              <h2>Company</h2>
              <p>Train your teams and track progress.</p>
              <span class="role-arrow material-symbols-outlined">arrow_forward</span>
            </article>
          </div>
        }

        @if (mode() === 'company') {
          <div class="flow">
            <button class="back-link" type="button" (click)="setMode('choice')">
              <span class="material-symbols-outlined">arrow_back</span>Back
            </button>
            <div class="card-header">
              <span class="badge badge-info">Company registration</span>
              <h1>Create your workspace</h1>
              <p>Set up a verified admin account for your company.</p>
            </div>
            <form class="form-grid" [formGroup]="companyForm" (ngSubmit)="submitCompany()">
              <div class="grid grid-2">
                <label class="field"><span>First name</span>
                  <input class="control" formControlName="firstName" autocomplete="given-name" />
                  @if (error('firstName')) { <small class="field-error">{{ error('firstName') }}</small> }
                </label>
                <label class="field"><span>Last name</span>
                  <input class="control" formControlName="lastName" autocomplete="family-name" />
                  @if (error('lastName')) { <small class="field-error">{{ error('lastName') }}</small> }
                </label>
              </div>
              <div class="grid grid-2">
                <label class="field icon-field"><span>Work email</span>
                  <span class="input-wrap"><i class="material-symbols-outlined">mail</i>
                    <input class="control" type="email" formControlName="email" autocomplete="email" />
                  </span>
                  @if (error('email')) { <small class="field-error">{{ error('email') }}</small> }
                </label>
                <label class="field icon-field"><span>Password</span>
                  <span class="input-wrap"><i class="material-symbols-outlined">lock</i>
                    <input class="control" type="password" formControlName="password" autocomplete="new-password" />
                  </span>
                  @if (error('password')) { <small class="field-error">{{ error('password') }}</small> }
                </label>
              </div>
              <label class="field"><span>Company name</span>
                <input class="control" formControlName="companyName" autocomplete="organization" />
                @if (error('companyName')) { <small class="field-error">{{ error('companyName') }}</small> }
              </label>
              <div class="grid grid-2">
                <label class="field"><span>Industry</span>
                  <input class="control" formControlName="industry" autocomplete="organization-title" />
                </label>
                <label class="field"><span>Website</span>
                  <input class="control" formControlName="website" autocomplete="url" placeholder="https://company.com" />
                </label>
              </div>
              @if (message()) { <p class="alert" [class.alert-error]="hasErrors()">{{ message() }}</p> }
              <button class="btn btn-primary submit-btn" type="submit" [disabled]="companyForm.invalid || loading()">
                @if (loading()) { <span class="material-symbols-outlined spin">progress_activity</span> Creating... }
                @else { Register company <span class="material-symbols-outlined">arrow_forward</span> }
              </button>
            </form>
          </div>
        }

        @if (mode() === 'trainer') {
          <div class="flow">
            <button class="back-link" type="button" (click)="setMode('choice')">
              <span class="material-symbols-outlined">arrow_back</span>Back
            </button>
            <div class="card-header">
              <span class="badge badge-info">Trainer application</span>
              <h1>Apply as a trainer</h1>
              <p>Submit your profile for review. Access is activated after admin approval.</p>
            </div>

            <div class="stepper">
              <div class="step" [class.active]="trainerStep() === 1" [class.done]="trainerStep() === 2">
                <span class="step-dot">@if (trainerStep() === 2) { <i class="material-symbols-outlined">check</i> } @else { 1 }</span>
                <span class="step-label">Personal info</span>
              </div>
              <div class="step-line" [class.filled]="trainerStep() === 2"></div>
              <div class="step" [class.active]="trainerStep() === 2">
                <span class="step-dot">2</span>
                <span class="step-label">Portfolio</span>
              </div>
            </div>

            @if (trainerStep() === 1) {
              <form class="form-grid" [formGroup]="trainerPersonalForm" (ngSubmit)="nextTrainerStep()">
                <div class="grid grid-2">
                  <label class="field"><span>First name</span>
                    <input class="control" formControlName="firstName" autocomplete="given-name" />
                    @if (trainerSubmitted() && trainerPersonalForm.controls.firstName.invalid) { <small class="field-error">Required.</small> }
                  </label>
                  <label class="field"><span>Last name</span>
                    <input class="control" formControlName="lastName" autocomplete="family-name" />
                    @if (trainerSubmitted() && trainerPersonalForm.controls.lastName.invalid) { <small class="field-error">Required.</small> }
                  </label>
                </div>
                <div class="grid grid-2">
                  <label class="field icon-field"><span>Email</span>
                    <span class="input-wrap"><i class="material-symbols-outlined">mail</i>
                      <input class="control" type="email" formControlName="email" autocomplete="email" />
                    </span>
                    @if (trainerSubmitted() && trainerPersonalForm.controls.email.invalid) { <small class="field-error">Valid email required.</small> }
                  </label>
                  <label class="field"><span>Phone</span>
                    <input class="control" formControlName="phone" autocomplete="tel" placeholder="+216 ..." />
                  </label>
                </div>
                <div class="grid grid-2">
                  <label class="field icon-field"><span>Password</span>
                    <span class="input-wrap"><i class="material-symbols-outlined">lock</i>
                      <input class="control" type="password" formControlName="password" autocomplete="new-password" />
                    </span>
                    @if (trainerSubmitted() && trainerPersonalForm.controls.password.invalid) { <small class="field-error">8+ chars, upper, lower, number.</small> }
                  </label>
                  <label class="field icon-field"><span>Confirm password</span>
                    <span class="input-wrap"><i class="material-symbols-outlined">lock</i>
                      <input class="control" type="password" formControlName="confirmPassword" autocomplete="new-password" />
                    </span>
                    @if (trainerSubmitted() && !passwordsMatch()) { <small class="field-error">Passwords must match.</small> }
                  </label>
                </div>
                <button class="btn btn-primary submit-btn" type="submit">
                  Continue <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            } @else {
              <form class="form-grid" [formGroup]="trainerPortfolioForm" (ngSubmit)="submitTrainer()">
                <div class="grid grid-2">
                  <label class="field"><span>Specialty</span>
                    <input class="control" formControlName="specialty" placeholder="e.g. Compliance, Sales..." />
                    @if (trainerSubmitted() && trainerPortfolioForm.controls.specialty.invalid) { <small class="field-error">Required.</small> }
                  </label>
                  <label class="field"><span>Portfolio URL</span>
                    <input class="control" formControlName="portfolioUrl" placeholder="https://..." />
                    @if (trainerSubmitted() && trainerPortfolioForm.controls.portfolioUrl.invalid) { <small class="field-error">Must start with http(s)://</small> }
                  </label>
                </div>
                <label class="field"><span>Bio</span>
                  <textarea class="control textarea-sm" formControlName="bio" placeholder="What outcomes do you help teams achieve?"></textarea>
                  @if (trainerSubmitted() && trainerPortfolioForm.controls.bio.invalid) { <small class="field-error">Required.</small> }
                </label>
                <div class="grid grid-2">
                  <label class="field"><span>Social links</span>
                    <input class="control" formControlName="socialLinks" placeholder="LinkedIn, GitHub..." />
                  </label>
                  <label class="field"><span>Motivation</span>
                    <input class="control" formControlName="motivation" placeholder="Why teach on EduFlow?" />
                    @if (trainerSubmitted() && trainerPortfolioForm.controls.motivation.invalid) { <small class="field-error">Required.</small> }
                  </label>
                </div>
                <div class="file-grid">
                  <label class="upload-card" [class.has-file]="cvFile()">
                    <span class="material-symbols-outlined">upload_file</span>
                    <strong>CV</strong>
                    <small>{{ cvFile()?.name || 'Required · PDF · Max 10MB' }}</small>
                    <input type="file" accept="application/pdf,.pdf" (change)="selectFile($event, 'cv')" />
                  </label>
                  <label class="upload-card" [class.has-file]="certificateFile()">
                    <span class="material-symbols-outlined">workspace_premium</span>
                    <strong>Certificate</strong>
                    <small>{{ certificateFile()?.name || 'Optional PDF' }}</small>
                    <input type="file" accept="application/pdf,.pdf" (change)="selectFile($event, 'certificate')" />
                  </label>
                  <label class="upload-card" [class.has-file]="diplomaFile()">
                    <span class="material-symbols-outlined">school</span>
                    <strong>Diploma</strong>
                    <small>{{ diplomaFile()?.name || 'Optional PDF' }}</small>
                    <input type="file" accept="application/pdf,.pdf" (change)="selectFile($event, 'diploma')" />
                  </label>
                </div>
                @if (fileError()) { <p class="alert alert-error">{{ fileError() }}</p> }
                @if (message()) { <p class="alert" [class.alert-error]="hasErrors()">{{ message() }}</p> }
                <div class="form-actions">
                  <button class="btn btn-secondary" type="button" (click)="trainerStep.set(1)" [disabled]="loading()">Back</button>
                  <button class="btn btn-primary" type="submit" [disabled]="loading()">
                    @if (loading()) { <span class="material-symbols-outlined spin">progress_activity</span> Submitting... }
                    @else { Submit application <span class="material-symbols-outlined">arrow_forward</span> }
                  </button>
                </div>
              </form>
            }
          </div>
        }

        <footer class="card-footer">
          <span>Already have an account?</span>
          <a routerLink="/auth/login">Login</a>
        </footer>
      </section>
    </div>
  `,
  styles: [`
    :host { display: grid; width: min(860px, 100%); }

    .register-page { display: grid; align-items: center; min-height: calc(100vh - 56px); }

    .register-card {
      width: 100%;
      display: grid;
      gap: 24px;
      padding: clamp(24px, 3vw, 36px);
      border: 1px solid rgba(215, 227, 248, 0.7);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 16px 48px rgba(15, 23, 42, 0.08);
      animation: fadeInUp 0.4s ease both;
    }

    .brand { display: inline-flex; align-items: center; gap: 10px; color: var(--color-heading); font-weight: 800; font-size: 16px; }
    .brand-mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 18px; font-weight: 800; }

    .card-header { display: grid; gap: 8px; }
    .card-header.center { text-align: center; justify-items: center; }
    .card-header .badge { justify-self: start; }
    .card-header.center .badge { justify-self: center; }

    h1, h2, p { margin: 0; }
    h1 { color: var(--color-heading); font-size: clamp(24px, 3vw, 32px); line-height: 1.2; font-weight: 800; letter-spacing: -0.02em; }
    h2 { color: var(--color-heading); font-size: 18px; font-weight: 800; }
    .card-header p:not(.badge), .role-card p, .card-footer { color: var(--color-muted); font-size: 14px; line-height: 1.55; }

    /* Role cards */
    .choice-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .role-card {
      display: grid; gap: 8px; align-content: center; justify-items: center;
      min-height: 200px; padding: 24px;
      border: 1.5px solid var(--color-border); border-radius: 18px;
      cursor: pointer; text-align: center;
      transition: border-color var(--transition-base), box-shadow var(--transition-base), transform var(--transition-base);
    }
    .role-card:hover { border-color: var(--color-primary); box-shadow: 0 8px 28px rgba(79, 70, 229, 0.1); transform: translateY(-2px); }
    .role-icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 26px; }
    .role-arrow { color: var(--color-muted); font-size: 18px; transition: color var(--transition-base), transform var(--transition-base); }
    .role-card:hover .role-arrow { color: var(--color-primary); transform: translateX(4px); }

    .flow { display: grid; gap: 20px; }
    .back-link { justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0; border: 0; color: var(--color-primary); background: transparent; font-weight: 700; font-size: 13px; cursor: pointer; }

    /* Form inputs */
    .register-card .field > span { font-size: 13px; letter-spacing: 0; text-transform: none; font-weight: 700; }
    .register-card .control { min-height: 48px; background: #fff; font-weight: 500; }
    .form-grid { gap: 16px; }

    .input-wrap { position: relative; display: block; }
    .input-wrap i { position: absolute; top: 50%; left: 14px; z-index: 1; transform: translateY(-50%); color: var(--color-muted); font-style: normal; font-size: 18px; }
    .icon-field .control { padding-left: 44px; }
    .textarea-sm { min-height: 90px !important; resize: vertical; }

    /* Stepper */
    .stepper { display: flex; align-items: center; gap: 0; }
    .step { display: flex; align-items: center; gap: 8px; }
    .step-dot {
      display: grid; place-items: center; width: 28px; height: 28px; border-radius: 999px; flex-shrink: 0;
      font-size: 12px; font-weight: 800;
      color: var(--color-muted); background: rgba(100, 116, 139, 0.1); border: 2px solid transparent;
      transition: all var(--transition-base);
    }
    .step-dot i { font-size: 16px; }
    .step.active .step-dot, .step.done .step-dot { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
    .step-label { font-size: 13px; font-weight: 700; color: var(--color-muted); white-space: nowrap; }
    .step.active .step-label, .step.done .step-label { color: var(--color-heading); }
    .step-line { flex: 1; height: 2px; margin: 0 12px; background: rgba(100, 116, 139, 0.15); border-radius: 1px; transition: background var(--transition-base); }
    .step-line.filled { background: var(--color-primary); }

    /* Upload cards */
    .file-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .upload-card {
      display: grid; justify-items: center; gap: 6px; padding: 16px 12px;
      border: 1.5px dashed var(--color-border-strong); border-radius: 14px;
      background: var(--color-surface-soft); text-align: center; cursor: pointer;
      transition: border-color var(--transition-base), background var(--transition-base);
    }
    .upload-card:hover { border-color: rgba(79, 70, 229, 0.4); background: #f5f7ff; }
    .upload-card.has-file { border-style: solid; border-color: rgba(16, 185, 129, 0.4); background: #ecfdf5; }
    .upload-card > .material-symbols-outlined { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 12px; color: var(--color-primary); background: var(--color-primary-soft); font-size: 20px; }
    .upload-card.has-file > .material-symbols-outlined { color: #059669; background: rgba(16, 185, 129, 0.12); }
    .upload-card strong { color: var(--color-heading); font-size: 13px; }
    .upload-card small { max-width: 100%; overflow: hidden; color: var(--color-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
    .upload-card input { display: none; }

    .submit-btn { width: 100%; min-height: 48px; }
    .form-actions .btn { min-height: 48px; min-width: 140px; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; font-size: 18px; }

    .card-footer { display: flex; justify-content: center; gap: 6px; padding-top: 4px; text-align: center; border-top: 1px solid var(--color-border); padding-top: 16px; }
    .card-footer a { color: var(--color-primary); font-weight: 700; }

    @media (max-width: 760px) {
      :host { width: 100%; }
      .register-card { padding: 20px 16px; border-radius: 20px; }
      .choice-grid, .grid-2, .file-grid, .stepper { grid-template-columns: 1fr; }
      .stepper { flex-direction: column; gap: 4px; }
      .step-line { width: 2px; height: 16px; margin: 0; }
      .role-card { min-height: auto; }
      .form-actions { flex-direction: column-reverse; }
      .form-actions .btn { width: 100%; min-width: 0; }
    }
  `]
})
export class RegisterCompanyPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly mode = signal<RegisterMode>('choice');
  readonly trainerStep = signal(1);
  readonly trainerSubmitted = signal(false);
  readonly message = signal('');
  readonly loading = signal(false);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly hasErrors = signal(false);
  readonly fileError = signal('');
  readonly cvFile = signal<File | null>(null);
  readonly certificateFile = signal<File | null>(null);
  readonly diplomaFile = signal<File | null>(null);

  readonly companyForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    companyName: ['', Validators.required],
    industry: [''],
    website: [''],
    companySize: ['']
  });

  readonly trainerPersonalForm = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
    confirmPassword: ['', Validators.required]
  });

  readonly trainerPortfolioForm = this.fb.group({
    specialty: ['', Validators.required],
    bio: ['', Validators.required],
    portfolioUrl: ['', Validators.pattern(/^https?:\/\/.+/)],
    socialLinks: [''],
    motivation: ['', Validators.required]
  });

  setMode(mode: RegisterMode): void {
    this.mode.set(mode);
    this.message.set('');
    this.hasErrors.set(false);
    this.fieldErrors.set({});
    this.fileError.set('');
    this.trainerSubmitted.set(false);
    this.trainerStep.set(1);
  }

  error(field: string): string {
    return controlError(this.fieldErrors(), field);
  }

  passwordsMatch(): boolean {
    const personal = this.trainerPersonalForm.getRawValue();
    return personal.password === personal.confirmPassword;
  }

  nextTrainerStep(): void {
    this.trainerSubmitted.set(true);
    if (this.trainerPersonalForm.invalid || !this.passwordsMatch()) return;
    this.trainerSubmitted.set(false);
    this.trainerStep.set(2);
  }

  selectFile(event: Event, target: TrainerFileTarget): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) { this.setFile(target, null); return; }
    if (file.size > 10 * 1024 * 1024) { this.fileError.set('PDF must be 10MB or smaller.'); input.value = ''; this.setFile(target, null); return; }
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) { this.fileError.set('Only PDF files accepted.'); input.value = ''; this.setFile(target, null); return; }
    this.fileError.set('');
    this.setFile(target, file);
  }

  submitCompany(): void {
    if (this.companyForm.invalid) return;
    this.loading.set(true);
    this.hasErrors.set(false);
    this.fieldErrors.set({});
    this.auth.registerCompany(this.companyForm.getRawValue()).subscribe({
      next: () => { this.loading.set(false); this.message.set('Account created. Check your email to verify.'); this.toast.success('Company account created.'); },
      error: (error) => { const p = parseApiError(error); this.loading.set(false); this.hasErrors.set(true); this.fieldErrors.set(p.fieldErrors); this.message.set(p.message); }
    });
  }

  submitTrainer(): void {
    this.trainerSubmitted.set(true);
    this.message.set('');
    this.hasErrors.set(false);
    if (this.trainerPortfolioForm.invalid || !this.cvFile()) { this.fileError.set(!this.cvFile() ? 'CV PDF is required.' : this.fileError()); return; }
    const personal = this.trainerPersonalForm.getRawValue();
    const portfolio = this.trainerPortfolioForm.getRawValue();
    const formData = new FormData();
    Object.entries({ ...personal, ...portfolio }).forEach(([key, value]) => formData.append(key, String(value ?? '')));
    formData.append('cv', this.cvFile()!);
    if (this.certificateFile()) formData.append('certificate', this.certificateFile()!);
    if (this.diplomaFile()) formData.append('diploma', this.diplomaFile()!);
    this.loading.set(true);
    this.auth.registerTrainer(formData).subscribe({
      next: () => { this.loading.set(false); this.toast.success('Application submitted.'); void this.router.navigate(['/auth/trainer-pending']); },
      error: (error) => { const p = parseApiError(error); this.loading.set(false); this.hasErrors.set(true); this.fieldErrors.set(p.fieldErrors); this.message.set(p.message); }
    });
  }

  private setFile(target: TrainerFileTarget, file: File | null): void {
    if (target === 'cv') this.cvFile.set(file);
    else if (target === 'certificate') this.certificateFile.set(file);
    else this.diplomaFile.set(file);
  }
}
