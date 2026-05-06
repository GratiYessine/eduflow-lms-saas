import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { Role } from '../../core/models/api.models';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: Role[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar-overlay" [class.open]="open" (click)="closed.emit()"></div>
    <aside class="sidebar" [class.open]="open">
      <a class="sidebar-brand" routerLink="/dashboard" (click)="closed.emit()">
        <span class="material-symbols-outlined">school</span>
        <div>
          <strong>EduFlow</strong>
          <small>B2B LMS</small>
        </div>
      </a>

      <nav>
        <p>Workspace</p>
        @for (item of visibleNavItems(); track item.route) {
          <a [routerLink]="item.route" routerLinkActive="active" (click)="closed.emit()">
            <span class="material-symbols-outlined">{{ item.icon }}</span>
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="sidebar-profile">
        <div class="avatar">{{ initials() }}</div>
        <div>
          <strong>{{ displayName() }}</strong>
          <small>{{ roleLabel() }}</small>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 100; display: flex; flex-direction: column; gap: 26px; width: var(--sidebar-width); padding: 24px 18px 18px; overflow-y: auto; background: radial-gradient(circle at top left, rgba(129, 140, 248, 0.16), transparent 28%), linear-gradient(180deg, #0f172a 0%, #1e1b4b 52%, #312e81 100%); border-right: 1px solid rgba(148, 163, 184, 0.08); box-shadow: 24px 0 44px rgba(15, 23, 42, 0.16); }
    .sidebar-brand { display: flex; gap: 12px; align-items: center; padding: 0 10px 22px; border-bottom: 1px solid rgba(255,255,255,0.1); color: #fff; }
    .sidebar-brand > span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 14px; color: #fff; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); box-shadow: 0 12px 24px rgba(79, 70, 229, 0.28); }
    strong, small { display: block; min-width: 0; } .sidebar-brand strong { font-size: 20px; line-height: 1.1; letter-spacing: 0; } small { margin-top: 4px; color: rgba(226, 232, 240, 0.58); font-size: 11px; font-weight: 850; letter-spacing: 0.08em; text-transform: uppercase; }
    nav { display: grid; gap: 6px; }
    nav p { margin: 0 0 8px 12px; color: rgba(226, 232, 240, 0.48); font-size: 11px; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
    nav a { position: relative; display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 11px 14px; border-radius: 16px; color: rgba(226, 232, 240, 0.68); font-weight: 750; transition: transform 180ms ease, background 180ms ease, color 180ms ease, box-shadow 180ms ease; }
    nav a:hover { transform: translateX(2px); color: #fff; background: rgba(255,255,255,0.08); }
    nav a.active { color: #fff; background: linear-gradient(135deg, rgba(99,102,241,0.24), rgba(139,92,246,0.2)); box-shadow: inset 0 0 0 1px rgba(199,210,254,0.18), 0 12px 24px rgba(15,23,42,0.18); }
    nav a.active::before { content: ''; position: absolute; inset: 12px auto 12px -7px; width: 4px; border-radius: 999px; background: #a5b4fc; }
    .sidebar-profile { margin-top: auto; display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; background: rgba(255,255,255,0.08); box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05); color: #fff; }
    .sidebar-profile .avatar { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; border-radius: 14px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); font-size: 12px; font-weight: 900; }
    .sidebar-profile strong { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 13px; }
    .sidebar-profile small { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sidebar-overlay { display: none; }
    @media (max-width: 960px) {
      .sidebar { transform: translateX(-100%); transition: transform 240ms ease; box-shadow: none; }
      .sidebar.open { transform: translateX(0); box-shadow: 24px 0 44px rgba(15, 23, 42, 0.2); }
      .sidebar-overlay { position: fixed; inset: 0; z-index: 90; display: block; pointer-events: none; background: rgba(15, 23, 42, 0); transition: background 220ms ease; }
      .sidebar-overlay.open { pointer-events: auto; background: rgba(15, 23, 42, 0.46); backdrop-filter: blur(4px); }
    }
  `]
})
export class SidebarComponent {
  private readonly auth = inject(AuthService);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();

  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard', roles: ['SUPER_ADMIN', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] },
    { label: 'Company', icon: 'business', route: '/company', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER'] },
    { label: 'Trainings', icon: 'auto_stories', route: '/trainings', roles: ['SUPER_ADMIN', 'TRAINER', 'LEARNER'] },
    { label: 'Create training', icon: 'add_circle', route: '/trainings/create', roles: ['SUPER_ADMIN', 'TRAINER'] },
    { label: 'Assignments', icon: 'assignment', route: '/assignments', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] },
    { label: 'Progress', icon: 'trending_up', route: '/progress', roles: ['SUPER_ADMIN', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] },
    { label: 'Teams', icon: 'groups', route: '/teams', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'TEAM_MANAGER'] },
    { label: 'Users', icon: 'manage_accounts', route: '/users', roles: ['SUPER_ADMIN', 'COMPANY_ADMIN'] },
    { label: 'Trainer Applications', icon: 'verified_user', route: '/admin/trainers/pending', roles: ['SUPER_ADMIN'] },
    { label: 'Notifications', icon: 'notifications', route: '/notifications', roles: ['SUPER_ADMIN', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] },
    { label: 'Certificates', icon: 'workspace_premium', route: '/certificates', roles: ['SUPER_ADMIN', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] },
    { label: 'Profile', icon: 'account_circle', route: '/profile', roles: ['SUPER_ADMIN', 'TRAINER', 'COMPANY_ADMIN', 'TEAM_MANAGER', 'LEARNER'] }
  ];

  readonly visibleNavItems = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role ? this.navItems.filter((item) => item.roles.includes(role)) : this.navItems.slice(0, 1);
  });

  readonly displayName = computed(() => {
    const user = this.auth.currentUser();
    return user ? `${user.firstName} ${user.lastName}` : 'EduFlow user';
  });

  readonly initials = computed(() => {
    const user = this.auth.currentUser();
    if (!user) {
      return 'EF';
    }
    return `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || 'EF';
  });

  readonly roleLabel = computed(() => {
    const role = this.auth.currentUser()?.role;
    return role ? role.replaceAll('_', ' ').toLowerCase() : 'Workspace';
  });
}
