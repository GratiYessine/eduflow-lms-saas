import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent],
  template: `
    <div class="shell app-shell">
      <app-sidebar [open]="sidebarOpen()" (closed)="sidebarOpen.set(false)" />
      <div class="shell-main">
        <app-topbar (menuClicked)="sidebarOpen.set(true)" />
        <section class="shell-content">
          <router-outlet />
        </section>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display: flex; }
    .shell-main { min-width: 0; flex: 1; margin-left: var(--sidebar-width); }
    .shell-content { width: min(1280px, 100%); margin: 0 auto; padding: 32px; }
    @media (max-width: 960px) { .shell-main { margin-left: 0; } .shell-content { padding: 18px; } }
  `]
})
export class AppShellComponent {
  readonly sidebarOpen = signal(false);
}
