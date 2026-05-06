import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { NotificationResponse } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { parseApiError } from '../../core/utils/api-error.util';
import { UiEmptyStateComponent } from '../../shared/ui/empty-state/ui-empty-state.component';
import { UiPageHeaderComponent } from '../../shared/ui/page-header/ui-page-header.component';
import { UiSkeletonComponent } from '../../shared/ui/skeleton/ui-skeleton.component';
import { UiStatCardComponent } from '../../shared/ui/stat-card/ui-stat-card.component';

type NotificationFilter = 'all' | 'unread' | 'read';

@Component({
  standalone: true,
  imports: [UiPageHeaderComponent, UiEmptyStateComponent, UiSkeletonComponent, UiStatCardComponent],
  template: `
    <div class="page-stack">
      <ui-page-header eyebrow="Inbox" title="Notifications" description="Training assignments, invitations, approvals and certificate updates.">
        <button class="btn btn-secondary" type="button" (click)="markAllRead()" [disabled]="busy() || !unreadCount()">
          <span class="material-symbols-outlined">done_all</span>
          Mark all read
        </button>
      </ui-page-header>

      <section class="grid grid-3">
        <ui-stat-card label="Total" [value]="notifications().length" icon="notifications" />
        <ui-stat-card label="Unread" [value]="unreadCount()" icon="mark_email_unread" [trend]="unreadTrend()" />
        <ui-stat-card label="Read" [value]="readCount()" icon="mark_email_read" />
      </section>

      <section class="notification-shell">
        <aside class="card inbox-summary">
          <span class="summary-icon material-symbols-outlined">notifications</span>
          <h2>{{ unreadCount() }}</h2>
          <p class="muted">Unread notifications need attention.</p>
          <div class="segmented" role="group" aria-label="Notification filter">
            <button class="segment" type="button" [class.active]="filter() === 'all'" (click)="filter.set('all')">
              All
              <span class="segment-count">{{ notifications().length }}</span>
            </button>
            <button class="segment" type="button" [class.active]="filter() === 'unread'" (click)="filter.set('unread')">
              Unread
              <span class="segment-count">{{ unreadCount() }}</span>
            </button>
            <button class="segment" type="button" [class.active]="filter() === 'read'" (click)="filter.set('read')">
              Read
              <span class="segment-count">{{ readCount() }}</span>
            </button>
          </div>
        </aside>

        <article class="card notification-panel">
          <div class="toolbar">
            <div>
              <h2>Activity feed</h2>
              <p class="muted">{{ filteredNotifications().length }} notification{{ filteredNotifications().length === 1 ? '' : 's' }}</p>
            </div>
            <span class="badge badge-info">{{ filterLabel() }}</span>
          </div>

          @if (loading()) {
            <div class="skeleton-card"><ui-skeleton [rows]="7" /></div>
          } @else if (filteredNotifications().length) {
            <div class="notification-list">
              @for (notification of filteredNotifications(); track notification.id) {
                <article class="notification-item" [class.unread]="!notification.read">
                  <span class="notification-icon material-symbols-outlined">{{ iconFor(notification.type) }}</span>
                  <div class="notification-copy">
                    <div class="notification-header">
                      <h3>{{ notification.title }}</h3>
                      <div class="notification-badges">
                        <span class="badge notification-type-badge" [class]="typeBadgeClass(notification.type)">{{ typeLabel(notification.type) }}</span>
                        <span class="badge" [class.badge-success]="notification.read" [class.badge-warning]="!notification.read">{{ notification.read ? 'Read' : 'New' }}</span>
                      </div>
                    </div>
                    <p>{{ notification.message }}</p>
                    <div class="notification-footer">
                      <small class="muted">
                        <span class="material-symbols-outlined">schedule</span>
                        {{ relativeTime(notification.createdAt) }}
                      </small>
                      @if (!notification.read) {
                        <button class="mark-read-btn" type="button" (click)="markRead(notification)" [disabled]="busy()" title="Mark as read">
                          <span class="material-symbols-outlined">done</span>
                        </button>
                      }
                    </div>
                  </div>
                </article>
              }
            </div>
          } @else {
            <ui-empty-state icon="notifications_off" title="Nothing here" description="Notifications matching this filter will appear here." />
          }
        </article>
      </section>
    </div>
  `,
  styles: [`
    .notification-shell { display: grid; grid-template-columns: minmax(260px, 0.36fr) minmax(0, 1fr); gap: var(--space-5); align-items: start; }
    .inbox-summary { display: grid; gap: var(--space-4); align-content: start; }
    .summary-icon { display: grid; place-items: center; width: 56px; height: 56px; border-radius: 18px; background: var(--color-primary-soft); color: var(--color-primary); font-size: 32px; }
    .inbox-summary h2, .notification-panel h2 { margin: 0; color: var(--color-heading); font-weight: 900; }
    .inbox-summary h2 { font-size: 48px; line-height: 1; }
    .notification-panel { display: grid; gap: var(--space-4); }
    .skeleton-card { padding: 8px 0; }
    .segment-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 999px;
      background: rgba(100, 116, 139, 0.1);
      font-size: 11px;
      font-weight: 800;
    }
    .segment.active .segment-count {
      background: var(--color-primary-soft);
      color: var(--color-primary-strong);
    }
    .notification-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .notification-badges {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }
    .notification-type-badge {
      font-size: 10px;
      min-height: 22px;
      padding: 0 8px;
      letter-spacing: 0.03em;
    }
    .notification-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 2px;
    }
    .notification-footer small {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }
    .notification-footer .material-symbols-outlined { font-size: 14px; }
    .mark-read-btn {
      display: inline-grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: rgba(255, 255, 255, 0.9);
      color: var(--color-muted);
      cursor: pointer;
      transition: all var(--transition-base);
      flex-shrink: 0;
    }
    .mark-read-btn:hover:not(:disabled) {
      border-color: var(--color-primary);
      color: var(--color-primary);
      background: var(--color-primary-soft);
    }
    .mark-read-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .mark-read-btn .material-symbols-outlined { font-size: 16px; }
    @media (max-width: 900px) { .notification-shell { grid-template-columns: 1fr; } }
  `]
})
export class NotificationsPage implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly filter = signal<NotificationFilter>('all');
  readonly notifications = signal<NotificationResponse[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter((item) => !item.read).length);
  readonly readCount = computed(() => this.notifications().filter((item) => item.read).length);
  readonly unreadTrend = computed(() => {
    const count = this.unreadCount();
    return count > 0 ? `${count} need attention` : 'All caught up';
  });
  readonly filteredNotifications = computed(() => {
    const filter = this.filter();
    if (filter === 'unread') {
      return this.notifications().filter((item) => !item.read);
    }
    if (filter === 'read') {
      return this.notifications().filter((item) => item.read);
    }
    return this.notifications();
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.notificationService.list({ page: 0, size: 50, sort: 'createdAt,desc' }).subscribe({
      next: (response) => {
        this.notifications.set(response.data?.content ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  markRead(notification: NotificationResponse): void {
    if (notification.read) {
      return;
    }
    const previous = this.notifications();
    this.notifications.update((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    this.busy.set(true);
    this.notificationService.markRead(notification.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Notification marked as read.');
      },
      error: (error) => {
        this.busy.set(false);
        this.notifications.set(previous);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  markAllRead(): void {
    if (!this.unreadCount()) {
      return;
    }
    const previous = this.notifications();
    this.notifications.update((items) => items.map((item) => ({ ...item, read: true })));
    this.busy.set(true);
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('All notifications marked as read.');
      },
      error: (error) => {
        this.busy.set(false);
        this.notifications.set(previous);
        this.toast.error(parseApiError(error).message);
      }
    });
  }

  filterLabel(): string {
    if (this.filter() === 'unread') {
      return 'Unread only';
    }
    if (this.filter() === 'read') {
      return 'Read only';
    }
    return 'All activity';
  }

  iconFor(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('certificate')) {
      return 'workspace_premium';
    }
    if (normalized.includes('assignment')) {
      return 'assignment';
    }
    if (normalized.includes('invite') || normalized.includes('invitation')) {
      return 'person_add';
    }
    if (normalized.includes('approval') || normalized.includes('progress')) {
      return 'task_alt';
    }
    if (normalized.includes('training')) {
      return 'auto_stories';
    }
    return 'notifications';
  }

  typeLabel(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('certificate')) return 'Certificate';
    if (normalized.includes('assignment')) return 'Assignment';
    if (normalized.includes('invite') || normalized.includes('invitation')) return 'Invitation';
    if (normalized.includes('approval')) return 'Approval';
    if (normalized.includes('progress')) return 'Progress';
    if (normalized.includes('training')) return 'Training';
    return 'System';
  }

  typeBadgeClass(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('certificate')) return 'badge-success';
    if (normalized.includes('assignment')) return 'badge-info';
    if (normalized.includes('invite') || normalized.includes('invitation')) return 'badge-warning';
    if (normalized.includes('approval') || normalized.includes('progress')) return 'badge-info';
    return 'badge-info';
  }

  relativeTime(value: string): string {
    if (!value) return '-';
    const now = Date.now();
    const then = new Date(value).getTime();
    const diff = now - then;

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;

    return new Date(value).toLocaleDateString();
  }
}
