import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FileUploadService } from '../../core/services/file-upload.service';
import { ToastService } from '../../core/services/toast.service';
import { TrainingService } from '../../core/services/training.service';
import { controlError, parseApiError } from '../../core/utils/api-error.util';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiProgressBarComponent } from '../../shared/ui/progress-bar/ui-progress-bar.component';
import { UiSelectComponent } from '../../shared/ui/select/ui-select.component';
import { UiTextareaComponent } from '../../shared/ui/textarea/ui-textarea.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiPageHeaderComponent, UiTextareaComponent, UiSelectComponent, UiProgressBarComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Course builder" title="Create training" description="Build a polished trainer-owned program with the same clear flow learners will see later.">
        <a class="btn btn-secondary" routerLink="/trainings">Back to catalog</a>
      </ui-page-header>

      <form class="builder-layout" [formGroup]="form" (ngSubmit)="submit()">
        <section class="builder-main">
          <article class="card form-section">
            <div class="section-heading">
              <span class="section-number">1</span>
              <div>
                <h2>Program basics</h2>
                <p class="muted">Give learners a clear title, promise and category.</p>
              </div>
            </div>
            <label class="field">
              <span>Title</span>
              <input class="control" formControlName="title" placeholder="Example: Workplace cybersecurity foundations" />
              @if (error('title')) { <small class="field-error">{{ error('title') }}</small> }
            </label>
            <label class="field">
              <span>Short description</span>
              <input class="control" formControlName="shortDescription" placeholder="One sentence that explains the outcome" />
              @if (error('shortDescription')) { <small class="field-error">{{ error('shortDescription') }}</small> }
            </label>
            <div class="grid grid-3">
              <label class="field"><span>Category</span><input class="control" formControlName="category" placeholder="Compliance, Sales, HR..." /></label>
              <label class="field"><span>Level</span><ui-select [options]="levels" formControlName="level" /></label>
              <label class="field"><span>Language</span><input class="control" formControlName="language" placeholder="en" /></label>
            </div>
          </article>

          <article class="card form-section">
            <div class="section-heading">
              <span class="section-number">2</span>
              <div>
                <h2>Learning experience</h2>
                <p class="muted">Add the full program description and optional intro media.</p>
              </div>
            </div>
            <label class="field"><span>Description</span><ui-textarea formControlName="description" placeholder="Describe the outcomes, audience, prerequisites and structure." /></label>
            <div class="grid grid-2">
              <label class="field"><span>Duration minutes</span><input class="control" type="number" min="0" formControlName="durationMinutes" /></label>
              <label class="field"><span>Price</span><input class="control" type="number" min="0" step="0.01" formControlName="price" /></label>
            </div>
            <label class="field"><span>Intro video URL</span><input class="control" formControlName="introVideoUrl" placeholder="https://..." /></label>
          </article>

          <article class="card form-section">
            <div class="section-heading">
              <span class="section-number">3</span>
              <div>
                <h2>Thumbnail</h2>
                <p class="muted">Use an image that helps learners recognize the program quickly.</p>
              </div>
            </div>
            <label class="upload-zone">
              <span class="material-symbols-outlined">image</span>
              <strong>Upload training thumbnail</strong>
              <small>PNG, JPG or WebP up to the backend file limit.</small>
              <input type="file" accept="image/*" (change)="uploadThumbnail($event)" />
            </label>
            @if (uploadProgress() > 0 && uploadProgress() < 100) {
              <ui-progress-bar [value]="uploadProgress()" />
            }
            @if (form.controls.thumbnailUrl.value) {
              <p class="alert alert-success">Thumbnail uploaded and attached to this draft.</p>
            }
          </article>
        </section>

        <aside class="builder-side">
          <article class="card review-card">
            <span class="review-eyebrow">Draft preview</span>
            @if (form.controls.thumbnailUrl.value) {
              <img class="review-image" [src]="form.controls.thumbnailUrl.value" alt="Training thumbnail preview" />
            }
            <h2>{{ form.controls.title.value || 'Untitled training' }}</h2>
            <p>{{ form.controls.shortDescription.value || 'Add a short description to make this program easy to scan.' }}</p>
            <div class="review-meta">
              <span>{{ form.controls.category.value || 'General' }}</span>
              <span>{{ form.controls.level.value }}</span>
              <span>{{ form.controls.durationMinutes.value || 0 }} min</span>
            </div>
            @if (message()) {
              <p class="alert" [class.alert-error]="hasErrors">{{ message() }}</p>
            }
            <div class="form-actions">
              <button class="btn btn-secondary" type="button" (click)="reset()">Reset</button>
              <button class="btn btn-primary" type="submit" [disabled]="form.invalid || saving()">
                <span class="material-symbols-outlined">save</span>
                {{ saving() ? 'Saving...' : 'Save draft' }}
              </button>
            </div>
          </article>

          <article class="card builder-path">
            <span class="review-eyebrow">Trainer workflow</span>
            <div class="path-step"><strong>1</strong><span>Save a clean training draft</span></div>
            <div class="path-step"><strong>2</strong><span>Add lessons with content and video URLs</span></div>
            <div class="path-step"><strong>3</strong><span>Create quiz questions and answer choices</span></div>
            <div class="path-step"><strong>4</strong><span>Publish when the learner experience is ready</span></div>
          </article>
        </aside>
      </form>
    </div>
  `,
  styles: [`
    .builder-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 0.42fr); gap: 24px; align-items: start; }
    .builder-main, .form-section, .review-card { display: grid; gap: var(--space-4); }
    .builder-side { display: grid; gap: var(--space-4); }
    .builder-side { position: sticky; top: 92px; }
    .section-heading { display: flex; align-items: flex-start; gap: 14px; }
    .section-number { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border-radius: 14px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: #fff; font-weight: 900; box-shadow: 0 12px 24px rgba(79,70,229,0.22); }
    h2, p { margin: 0; }
    h2 { color: var(--color-heading); font-size: 20px; font-weight: 900; }
    .upload-zone { display: grid; justify-items: center; gap: 8px; padding: 28px 18px; border: 1.5px dashed var(--color-border-strong); border-radius: var(--radius-xl); background: radial-gradient(circle at top center, rgba(99,102,241,0.08), transparent 44%), rgba(255,255,255,0.76); text-align: center; cursor: pointer; }
    .upload-zone input { display: none; }
    .upload-zone > span { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 18px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 32px; }
    .upload-zone strong { color: var(--color-heading); }
    .upload-zone small { color: var(--color-muted); }
    .review-card { overflow: hidden; }
    .review-card::before { content: ''; position: absolute; inset: 0 0 auto; height: 4px; background: linear-gradient(90deg, var(--color-primary), var(--color-accent)); }
    .review-image { width: 100%; max-height: 160px; object-fit: cover; border-radius: var(--radius-lg); border: 1px solid var(--color-border); }
    .review-eyebrow { color: var(--color-primary); font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
    .review-meta { display: flex; flex-wrap: wrap; gap: 8px; }
    .review-meta span { min-height: 28px; padding: 5px 11px; border-radius: 999px; background: var(--color-primary-soft); color: var(--color-primary-strong); font-size: 12px; font-weight: 850; }
    .builder-path { display: grid; gap: 12px; }
    .path-step { display: grid; grid-template-columns: 32px 1fr; gap: 10px; align-items: center; padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: rgba(248,250,252,0.78); }
    .path-step strong { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 12px; color: #fff; background: var(--color-primary); }
    .path-step span { color: var(--color-muted); font-weight: 800; }
    @media (max-width: 980px) { .builder-layout { grid-template-columns: 1fr; } .builder-side { position: static; } }
  `]
})
export class CreateTrainingPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly trainings = inject(TrainingService);
  private readonly files = inject(FileUploadService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly saving = signal(false);
  readonly uploadProgress = signal(0);
  readonly fieldErrors = signal<Record<string, string>>({});
  readonly message = signal('');
  hasErrors = false;

  readonly levels = [
    { label: 'Beginner', value: 'BEGINNER' },
    { label: 'Intermediate', value: 'INTERMEDIATE' },
    { label: 'Advanced', value: 'ADVANCED' }
  ];
  readonly form = this.fb.group({
    title: ['', Validators.required],
    shortDescription: [''],
    description: [''],
    thumbnailUrl: [''],
    introVideoUrl: [''],
    category: [''],
    level: ['BEGINNER', Validators.required],
    language: ['en', Validators.required],
    durationMinutes: [0, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]]
  });

  error(field: string): string {
    return controlError(this.fieldErrors(), field);
  }

  uploadThumbnail(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    try {
      this.files.upload(file, 'TRAINING_THUMBNAIL').subscribe({
        next: (state) => {
          this.uploadProgress.set(state.progress);
          if (state.file) {
            this.form.controls.thumbnailUrl.setValue(state.file.url);
            this.toast.success('Thumbnail uploaded.');
          }
        },
        error: (error) => this.toast.error(parseApiError(error).message)
      });
    } catch (error) {
      this.toast.error(error instanceof Error ? error.message : 'Invalid file.');
    }
  }

  reset(): void {
    this.form.reset({
      title: '',
      shortDescription: '',
      description: '',
      thumbnailUrl: '',
      introVideoUrl: '',
      category: '',
      level: 'BEGINNER',
      language: 'en',
      durationMinutes: 0,
      price: 0
    });
    this.message.set('');
    this.fieldErrors.set({});
    this.hasErrors = false;
    this.uploadProgress.set(0);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.hasErrors = false;
    this.fieldErrors.set({});
    this.message.set('');
    const payload = this.form.getRawValue();
    this.trainings
      .create({
        ...payload,
        level: payload.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
        durationMinutes: Number(payload.durationMinutes),
        price: Number(payload.price)
      })
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.toast.success(response.message || 'Training created successfully.');
          void this.router.navigate(['/trainings', response.data?.id]);
        },
        error: (error) => {
          const parsed = parseApiError(error);
          this.saving.set(false);
          this.hasErrors = true;
          this.fieldErrors.set(parsed.fieldErrors);
          this.message.set(parsed.message);
        }
      });
  }
}
