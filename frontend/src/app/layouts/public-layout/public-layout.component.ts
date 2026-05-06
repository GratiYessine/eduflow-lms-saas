import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <main class="public-shell">
      <header class="public-nav">
        <a class="public-brand" routerLink="/" (click)="menuOpen.set(false)">
          <span class="brand-icon material-symbols-outlined">school</span>
          <span>EduFlow</span>
        </a>

        <nav class="desktop-links" aria-label="Public navigation">
          <a routerLink="/" fragment="features" routerLinkActive="active">Features</a>
          <a routerLink="/" fragment="programs" routerLinkActive="active">Programs</a>
          <a routerLink="/" fragment="workflow" routerLinkActive="active">How it works</a>
        </nav>

        <div class="desktop-actions">
          <a class="btn btn-ghost nav-btn" routerLink="/auth/login">Login</a>
          <a class="btn btn-primary nav-btn" routerLink="/auth/register">
            Get Started
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
        </div>

        <button class="mobile-menu" type="button" (click)="menuOpen.set(!menuOpen())" aria-label="Toggle navigation">
          <span class="material-symbols-outlined">{{ menuOpen() ? 'close' : 'menu' }}</span>
        </button>
      </header>

      @if (menuOpen()) {
        <nav class="mobile-panel" aria-label="Mobile public navigation">
          <a routerLink="/" fragment="features" (click)="menuOpen.set(false)">Features</a>
          <a routerLink="/" fragment="programs" (click)="menuOpen.set(false)">Programs</a>
          <a routerLink="/" fragment="workflow" (click)="menuOpen.set(false)">How it works</a>
          <div class="mobile-actions">
            <a class="btn btn-secondary" routerLink="/auth/login" (click)="menuOpen.set(false)">Login</a>
            <a class="btn btn-primary" routerLink="/auth/register" (click)="menuOpen.set(false)">Get Started</a>
          </div>
        </nav>
      }

      <router-outlet />

      <footer class="public-footer">
        <div class="footer-inner">
          <a class="footer-brand" routerLink="/">
            <span class="material-symbols-outlined">school</span>
            <strong>EduFlow</strong>
          </a>
          <nav class="footer-links">
            <a routerLink="/" fragment="features">Features</a>
            <a routerLink="/" fragment="programs">Programs</a>
            <a routerLink="/auth/login">Login</a>
            <a routerLink="/auth/register">Register</a>
          </nav>
          <p class="footer-copy">&copy; 2026 EduFlow. All rights reserved.</p>
        </div>
      </footer>
    </main>
  `,
  styles: [`
    .public-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-background);
      color: var(--color-text);
    }

    .public-nav {
      position: sticky;
      top: 0;
      z-index: 80;
      display: flex;
      align-items: center;
      gap: 32px;
      height: 64px;
      padding: 0 clamp(20px, 4vw, 48px);
      border-bottom: 1px solid rgba(215, 227, 248, 0.6);
      background: rgba(255, 255, 255, 0.72);
      backdrop-filter: blur(20px) saturate(1.4);
    }

    .public-brand {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--color-heading);
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.02em;
      white-space: nowrap;
    }

    .brand-icon {
      display: grid;
      place-items: center;
      width: 34px;
      height: 34px;
      border-radius: 10px;
      color: #fff;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      font-size: 20px;
    }

    .desktop-links {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--color-muted);
      font-size: 14px;
      font-weight: 600;
    }

    .desktop-links a {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      transition: color var(--transition-base), background var(--transition-base);
    }

    .desktop-links a:hover,
    .desktop-links a.active {
      color: var(--color-primary);
      background: var(--color-primary-soft);
    }

    .desktop-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .nav-btn {
      min-height: 38px;
      font-size: 13px;
    }

    .btn-ghost.nav-btn {
      color: var(--color-heading);
      font-weight: 600;
    }

    .btn-ghost.nav-btn:hover {
      color: var(--color-primary);
      background: var(--color-primary-soft);
    }

    .mobile-menu {
      display: none;
      margin-left: auto;
      width: 40px;
      height: 40px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      color: var(--color-heading);
      background: #fff;
      cursor: pointer;
      transition: border-color var(--transition-base);
    }

    .mobile-menu:hover {
      border-color: var(--color-primary);
    }

    .mobile-panel {
      position: sticky;
      top: 64px;
      z-index: 70;
      display: grid;
      gap: 4px;
      padding: 12px 20px 16px;
      border-bottom: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(16px);
      animation: fadeInUp 0.2s ease both;
    }

    .mobile-panel a {
      min-height: 44px;
      display: flex;
      align-items: center;
      padding: 0 12px;
      border-radius: var(--radius-sm);
      color: var(--color-heading);
      font-weight: 600;
      transition: background var(--transition-base);
    }

    .mobile-panel a:hover {
      background: var(--color-primary-soft);
    }

    .mobile-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      padding-top: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--color-border);
    }

    /* Footer */
    .public-footer {
      margin-top: auto;
      border-top: 1px solid var(--color-border);
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(12px);
    }

    .footer-inner {
      display: flex;
      align-items: center;
      gap: 24px;
      width: min(1180px, calc(100% - 40px));
      margin: 0 auto;
      padding: 24px 0;
    }

    .footer-brand {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: var(--color-heading);
      font-size: 15px;
    }

    .footer-brand .material-symbols-outlined {
      color: var(--color-primary);
      font-size: 20px;
    }

    .footer-links {
      display: flex;
      gap: 24px;
      color: var(--color-muted);
      font-size: 13px;
      font-weight: 600;
    }

    .footer-links a:hover {
      color: var(--color-primary);
    }

    .footer-copy {
      margin: 0 0 0 auto;
      color: var(--color-muted);
      font-size: 13px;
    }

    @media (max-width: 820px) {
      .desktop-links,
      .desktop-actions {
        display: none;
      }

      .mobile-menu {
        display: inline-grid;
        place-items: center;
      }

      .footer-inner {
        flex-direction: column;
        gap: 16px;
        text-align: center;
      }

      .footer-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 16px;
      }

      .footer-copy {
        margin-left: 0;
      }
    }
  `]
})
export class PublicLayoutComponent {
  readonly menuOpen = signal(false);
}
