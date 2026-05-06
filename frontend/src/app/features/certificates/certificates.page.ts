import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CertificateResponse } from '../../core/models/api.models';
import { CertificateService } from '../../core/services/certificate.service';
import { ToastService } from '../../core/services/toast.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiDataTableComponent } from '../../shared/ui/data-table/ui-data-table.component';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton/ui-skeleton.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UiPageHeaderComponent, UiDataTableComponent, UiSkeletonComponent, UiEmptyStateComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Credentials" title="Certificates" description="Learner achievements with verification-ready certificate numbers.">
        <a class="btn btn-secondary" routerLink="/progress">View progress</a>
      </ui-page-header>

      <section class="grid grid-3">
        <ui-stat-card label="Total certificates" [value]="certificates().length" icon="workspace_premium" />
        <ui-stat-card label="Recent (30 days)" [value]="recentCount()" icon="schedule" [trend]="recentTrend()" />
        <ui-stat-card label="Unique trainings" [value]="uniqueTrainingCount()" icon="auto_stories" />
      </section>

      @if (loading()) {
        <section class="card">
          <div class="skeleton-grid">
            @for (i of [1,2,3]; track i) {
              <div class="skeleton-row" style="height: 120px;"></div>
            }
          </div>
        </section>
        <section class="card"><ui-skeleton [rows]="5" /></section>
      } @else if (certificates().length) {
        @if (filteredCertificates().length || searchControl.value) {
          <section class="card filter-section">
            <div class="search-input-wrap">
              <span class="material-symbols-outlined">search</span>
              <input class="control" type="text" placeholder="Search by certificate number or verification code..." [formControl]="searchControl" />
            </div>
          </section>
        }

        @if (filteredCertificates().length) {
          <section class="certificate-grid">
            @for (certificate of filteredCertificates(); track certificate.id) {
              <article class="certificate-card card-interactive">
                <div class="certificate-ribbon">
                  <span class="material-symbols-outlined">workspace_premium</span>
                </div>
                <div class="certificate-body">
                  <span class="certificate-eyebrow">Certificate</span>
                  <h2>{{ certificate.certificateNumber }}</h2>
                  <div class="certificate-ids">
                    <span class="id-chip">
                      <span class="material-symbols-outlined">auto_stories</span>
                      Training #{{ certificate.trainingId }}
                    </span>
                    <span class="id-chip">
                      <span class="material-symbols-outlined">person</span>
                      Learner #{{ certificate.learnerId }}
                    </span>
                  </div>
                  <div class="certificate-meta">
                    <span><span class="material-symbols-outlined">calendar_today</span>{{ issuedLabel(certificate) }}</span>
                    <span><span class="material-symbols-outlined">verified</span>{{ certificate.verificationCode }}</span>
                  </div>
                  <button class="btn btn-primary btn-sm" type="button" (click)="download(certificate)">
                    <span class="material-symbols-outlined">download</span>
                    Download PDF
                  </button>
                </div>
              </article>
            }
          </section>

          <section class="card">
            <div class="toolbar table-title">
              <h2>Certificate records</h2>
              <span class="badge badge-info">{{ filteredCertificates().length }} total</span>
            </div>
            <ui-data-table [columns]="columns" [rows]="filteredRows()" />
          </section>
        } @else {
          <ui-empty-state
            icon="search_off"
            title="No matching certificates"
            description="No certificates match your search. Try a different term."
          />
        }
      } @else {
        <ui-empty-state
          icon="workspace_premium"
          title="No certificates yet"
          description="Approved completions and generated certificates will appear here."
        />
      }
    </div>
  `,
  styles: [`
    .filter-section { padding: var(--space-4) var(--space-5); }
    .certificate-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 18px; }
    .certificate-card {
      display: grid;
      grid-template-columns: 80px 1fr;
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-xl);
      background: #fff;
      box-shadow: var(--shadow-soft);
    }
    .certificate-ribbon {
      display: grid;
      place-items: center;
      color: #fff;
      background:
        radial-gradient(circle at top, rgba(255,255,255,0.2), transparent 42%),
        linear-gradient(180deg, var(--color-primary), var(--color-accent));
    }
    .certificate-ribbon span { font-size: 34px; }
    .certificate-body { display: grid; gap: 10px; padding: 18px 20px; }
    .certificate-eyebrow {
      color: var(--color-primary);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h2, p { margin: 0; }
    h2 {
      color: var(--color-heading);
      font-size: 18px;
      font-weight: 900;
      overflow-wrap: anywhere;
      line-height: 1.3;
    }
    .certificate-ids {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .id-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 999px;
      background: var(--color-surface-soft);
      border: 1px solid var(--color-border);
      color: var(--color-muted);
      font-size: 12px;
      font-weight: 700;
    }
    .id-chip .material-symbols-outlined { font-size: 14px; }
    .certificate-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .certificate-meta span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border-radius: 999px;
      background: var(--color-primary-soft);
      color: var(--color-primary-strong);
      font-size: 12px;
      font-weight: 850;
    }
    .certificate-meta .material-symbols-outlined { font-size: 14px; }
    .table-title { margin-bottom: 16px; }
    @media (max-width: 520px) {
      .certificate-card { grid-template-columns: 1fr; }
      .certificate-ribbon { min-height: 72px; }
    }
  `]
})
export class CertificatesPage implements OnInit {
  private readonly certificateService = inject(CertificateService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly certificates = signal<CertificateResponse[]>([]);
  readonly searchControl = new FormControl('');
  readonly searchTerm = signal('');

  readonly filteredCertificates = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.certificates();
    return this.certificates().filter(c =>
      c.certificateNumber?.toLowerCase().includes(term) ||
      c.verificationCode?.toLowerCase().includes(term)
    );
  });

  readonly filteredRows = computed(() =>
    this.filteredCertificates().map(c => ({
      id: c.id,
      number: c.certificateNumber,
      learnerId: `#${c.learnerId}`,
      trainingId: `#${c.trainingId}`,
      issued: c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : '-',
      verification: c.verificationCode
    }))
  );

  readonly recentCount = computed(() => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return this.certificates().filter(c => c.issuedAt && new Date(c.issuedAt).getTime() > thirtyDaysAgo).length;
  });

  readonly recentTrend = computed(() => {
    const count = this.recentCount();
    return count > 0 ? `${count} new this month` : 'None this month';
  });

  readonly uniqueTrainingCount = computed(() => {
    const ids = new Set(this.certificates().map(c => c.trainingId));
    return ids.size;
  });

  readonly columns = [
    { key: 'number', label: 'Certificate' },
    { key: 'learnerId', label: 'Learner' },
    { key: 'trainingId', label: 'Training' },
    { key: 'issued', label: 'Issued' },
    { key: 'verification', label: 'Verification' }
  ];

  ngOnInit(): void {
    this.load();
    this.searchControl.valueChanges.subscribe(val => this.searchTerm.set(val ?? ''));
  }

  load(): void {
    this.loading.set(true);
    this.certificateService.my().subscribe({
      next: (response) => {
        this.certificates.set(response.data ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  issuedLabel(certificate: CertificateResponse): string {
    return certificate.issuedAt ? new Date(certificate.issuedAt).toLocaleDateString() : 'Recently issued';
  }

  download(certificate: CertificateResponse): void {
    this.certificateService.download(certificate.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${certificate.certificateNumber}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      },
      error: (error) => this.toast.error(parseApiError(error).message)
    });
  }
}
