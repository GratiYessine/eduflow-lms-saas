import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <main class="auth-layout" [class.register-focused]="router.url.startsWith('/auth/register')">
      <section class="auth-brand">
        <a class="brand-lockup" routerLink="/">
          <span class="material-symbols-outlined">school</span>
          <strong>EduFlow</strong>
        </a>

        <div class="brand-copy">
          <h1>Train teams. Track growth. Certify results.</h1>
          <p>A modern B2B learning platform for companies, trainers, and teams.</p>
        </div>

        <div class="auth-metrics">
          <div class="metric-card">
            <span class="material-symbols-outlined">trending_up</span>
            <div>
              <strong>85%</strong>
              <span>Faster onboarding</span>
            </div>
          </div>
          <div class="metric-card">
            <span class="material-symbols-outlined">verified</span>
            <div>
              <strong>100%</strong>
              <span>Compliance tracking</span>
            </div>
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <router-outlet />
      </section>
    </main>
  `,
  styles: [`
    .auth-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--color-background);
    }

    /* ── Brand Panel ── */
    .auth-brand {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100vh;
      padding: 32px 40px;
      overflow: hidden;
      color: #fff;
      background:
        radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.4), transparent 40%),
        radial-gradient(circle at 80% 80%, rgba(124, 58, 237, 0.25), transparent 40%),
        linear-gradient(160deg, #0c0033 0%, #1a0d5e 50%, #0f0029 100%);
    }

    .auth-brand::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0.12;
      background-image:
        radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px);
      background-size: 28px 28px;
    }

    .brand-lockup,
    .brand-copy,
    .auth-metrics {
      position: relative;
      z-index: 1;
    }

    .brand-lockup {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      width: fit-content;
      color: #fff;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .brand-lockup span {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255,255,255,0.12);
      backdrop-filter: blur(12px);
      font-size: 22px;
    }

    .brand-copy {
      display: grid;
      gap: 16px;
      max-width: 480px;
      align-self: center;
    }

    .brand-copy h1 {
      margin: 0;
      font-size: clamp(32px, 3.5vw, 44px);
      line-height: 1.15;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-copy p {
      margin: 0;
      color: rgba(255, 255, 255, 0.7);
      font-size: 16px;
      line-height: 1.65;
    }

    /* ── Metrics ── */
    .auth-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px;
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
    }

    .metric-card .material-symbols-outlined {
      color: #6ffbbe;
      font-size: 24px;
    }

    .metric-card strong {
      display: block;
      font-size: 20px;
      font-weight: 800;
      line-height: 1.2;
    }

    .metric-card span {
      font-size: 13px;
      color: rgba(255, 255, 255, 0.6);
      font-weight: 600;
    }

    /* ── Auth Panel ── */
    .auth-panel {
      display: grid;
      align-items: center;
      justify-items: center;
      min-height: 100vh;
      padding: 40px 32px;
      background: var(--color-background);
    }

    .auth-panel > * {
      width: min(440px, 100%);
    }

    /* ── Register layout override ── */
    .auth-layout.register-focused {
      grid-template-columns: 1fr;
      background:
        radial-gradient(circle at 18% 12%, rgba(79, 70, 229, 0.08), transparent 40%),
        radial-gradient(circle at 80% 20%, rgba(6, 182, 212, 0.08), transparent 36%),
        linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    }

    .auth-layout.register-focused .auth-brand {
      display: none;
    }

    .auth-layout.register-focused .auth-panel {
      height: 100vh;
      overflow-y: auto;
      padding: 32px 24px;
      background: transparent;
    }

    .auth-layout.register-focused .auth-panel > * {
      width: min(860px, 100%);
    }

    /* ── Responsive ── */
    @media (max-width: 960px) {
      .auth-layout {
        grid-template-columns: 1fr;
      }

      .auth-brand {
        display: none;
      }
    }

    @media (max-width: 560px) {
      .auth-panel {
        padding: 24px 16px;
      }
    }
  `]
})
export class AuthLayoutComponent {
  constructor(readonly router: Router) {}
}
