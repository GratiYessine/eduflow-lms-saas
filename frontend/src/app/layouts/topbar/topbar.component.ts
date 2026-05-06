import { Component, EventEmitter, HostListener, OnInit, Output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationResponse } from '../../core/models/api.models';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="topbar">
      <button class="menu-btn" type="button" (click)="menuClicked.emit()" aria-label="Open sidebar">
        <span class="material-symbols-outlined">menu</span>
      </button>
      <div class="search">
        <span class="material-symbols-outlined">search</span>
        <input placeholder="Search trainings, teams, certificates" />
      </div>
      <div class="topbar-actions">
        <div class="notification-menu" (click)="$event.stopPropagation()">
          <button class="notification-pill" type="button" (click)="toggleNotifications($event)" aria-label="Open notifications">
            <span class="material-symbols-outlined">notifications</span>
            @if (unreadCount()) { <strong>{{ unreadCount() }}</strong> }
          </button>
          @if (notificationsOpen()) {
            <section class="notification-preview">
              <div class="preview-head">
                <div>
                  <span>Inbox</span>
                  <strong>{{ unreadCount() }} unread</strong>
                </div>
                <a routerLink="/notifications" (click)="notificationsOpen.set(false)">View all</a>
              </div>
              <div class="preview-list">
                @for (notification of preview(); track notification.id) {
                  <button class="preview-item" type="button" [class.unread]="!notification.read" (click)="markRead(notification)">
                    <span class="material-symbols-outlined">{{ iconFor(notification.type) }}</span>
                    <span>
                      <strong>{{ notification.title }}</strong>
                      <small>{{ notification.message }}</small>
                    </span>
                  </button>
                } @empty {
                  <p class="empty-preview">No notifications yet.</p>
                }
              </div>
            </section>
          }
        </div>
        @if (auth.hasRole(['TRAINER', 'SUPER_ADMIN'])) {
          <a routerLink="/trainings/create" class="btn btn-primary">Create training</a>
        }
        <button type="button" class="btn btn-secondary" (click)="auth.logout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .topbar { position: sticky; top: 0; z-index: 40; display: flex; align-items: center; gap: 16px; min-height: 68px; padding: 12px 32px; background: rgba(255, 255, 255, 0.88); border-bottom: 1px solid var(--color-border); box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); backdrop-filter: blur(18px); }
    .menu-btn { display: none; width: 42px; height: 42px; border: 0; border-radius: var(--radius-md); color: #fff; background: var(--color-primary); }
    .search { position: relative; flex: 1; max-width: 520px; }
    .search span { position: absolute; top: 50%; left: 12px; transform: translateY(-50%); color: var(--color-muted); }
    .search input { width: 100%; min-height: 44px; padding: 9px 12px 9px 42px; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-soft); outline: none; }
    .search input:focus { border-color: var(--color-primary); background: #fff; box-shadow: 0 0 0 3px rgba(55, 48, 163, 0.14); }
    .topbar-actions { display: flex; gap: 8px; margin-left: auto; align-items: center; }
    .notification-menu { position: relative; }
    .notification-pill { position: relative; display: inline-grid; place-items: center; width: 44px; min-height: 44px; border-radius: var(--radius-md); background: #fff; border: 1px solid var(--color-border); color: var(--color-muted); cursor: pointer; }
    .notification-pill strong { position: absolute; top: -6px; right: -4px; display: grid; place-items: center; min-width: 19px; height: 19px; padding: 0 5px; border-radius: 999px; background: var(--color-danger); color: #fff; font-size: 11px; font-weight: 900; }
    .notification-preview { position: absolute; top: calc(100% + 12px); right: 0; width: min(360px, calc(100vw - 24px)); padding: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-xl); background: rgba(255,255,255,0.96); box-shadow: 0 24px 60px rgba(15,23,42,0.16); backdrop-filter: blur(18px); }
    .preview-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 6px 12px; }
    .preview-head div { display: grid; gap: 1px; }
    .preview-head span { color: var(--color-muted); font-size: 11px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
    .preview-head strong { color: var(--color-heading); font-size: 16px; }
    .preview-head a { color: var(--color-primary); font-weight: 850; }
    .preview-list { display: grid; gap: 8px; }
    .preview-item { display: grid; grid-template-columns: 36px 1fr; gap: 10px; width: 100%; padding: 10px; border-radius: var(--radius-lg); background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
    .preview-item:hover, .preview-item.unread { background: var(--color-primary-soft); }
    .preview-item > .material-symbols-outlined { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 13px; background: #fff; color: var(--color-primary); }
    .preview-item span:last-child { display: grid; gap: 2px; min-width: 0; }
    .preview-item strong, .preview-item small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .preview-item small, .empty-preview { color: var(--color-muted); }
    .empty-preview { margin: 0; padding: 18px; text-align: center; }
    @media (max-width: 960px) { .menu-btn { display: inline-grid; place-items: center; } .topbar { padding: 12px 16px; } .search { display: none; } }
    @media (max-width: 560px) { .topbar-actions > a { display: none; } }
  `]
})
export class TopbarComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly toast = inject(ToastService);
  readonly unreadCount = signal(0);
  readonly preview = signal<NotificationResponse[]>([]);
  readonly notificationsOpen = signal(false);

  @Output() menuClicked = new EventEmitter<void>();

  ngOnInit(): void {
    this.loadNotifications();
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.notificationsOpen.update((open) => !open);
    if (!this.preview().length) {
      this.loadNotifications();
    }
  }

  markRead(notification: NotificationResponse): void {
    if (notification.read) {
      return;
    }
    this.preview.update((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    this.unreadCount.update((count) => Math.max(0, count - 1));
    this.notifications.markRead(notification.id).pipe(catchError((error) => {
      this.preview.update((items) => items.map((item) => item.id === notification.id ? { ...item, read: false } : item));
      this.unreadCount.update((count) => count + 1);
      this.toast.error('Could not update notification.');
      return of(null);
    })).subscribe();
  }

  iconFor(type: string): string {
    const normalized = type.toLowerCase();
    if (normalized.includes('certificate')) {
      return 'workspace_premium';
    }
    if (normalized.includes('assignment')) {
      return 'assignment';
    }
    if (normalized.includes('invite')) {
      return 'person_add';
    }
    return 'notifications';
  }

  @HostListener('document:click')
  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  private loadNotifications(): void {
    this.notifications
      .list({ page: 0, size: 6, sort: 'createdAt,desc' })
      .pipe(catchError(() => of(null)))
      .subscribe((response) => {
        const items = response?.data?.content ?? [];
        this.preview.set(items);
        this.unreadCount.set(items.filter((item) => !item.read).length);
      });
  }
}
