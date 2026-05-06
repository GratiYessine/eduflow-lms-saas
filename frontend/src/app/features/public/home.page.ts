import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface HeroStat {
  icon: string;
  value: string;
  label: string;
}

interface Feature {
  icon: string;
  title: string;
  body: string;
}

interface Domain {
  icon: string;
  title: string;
  body: string;
  meta: string;
}

interface Program {
  category: string;
  level: string;
  title: string;
  body: string;
  duration: string;
  rating: string;
  trainer: string;
  tone: string;
}

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero__content">
        <p class="pill">
          <span class="material-symbols-outlined">rocket_launch</span>
          B2B Learning Platform
        </p>
        <h1>Train teams.<br><span class="gradient-text">Measure growth.</span></h1>
        <p class="hero__subtitle">
          A modern LMS for companies, trainers, and learners. Programs, quizzes, progress tracking, and certificates — all in one workspace.
        </p>
        <div class="hero__cta">
          <a class="btn btn-primary btn-lg" routerLink="/auth/register">
            Get Started Free
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
          <a class="btn btn-secondary btn-lg" routerLink="/auth/login">Login</a>
        </div>
        <div class="hero__stats">
          @for (stat of stats; track stat.label) {
            <article class="stat-card">
              <span class="material-symbols-outlined stat-icon">{{ stat.icon }}</span>
              <div>
                <strong>{{ stat.value }}</strong>
                <span>{{ stat.label }}</span>
              </div>
            </article>
          }
        </div>
      </div>
      <div class="hero__visual">
        <div class="visual-frame">
          <img src="/assets/eduflow-home-hero.jpg" alt="Professional training session in progress" loading="eager" />
        </div>
        <article class="float-card float-card--top">
          <span class="float-icon material-symbols-outlined">workspace_premium</span>
          <div>
            <strong>Certificate ready</strong>
            <small>84 learners completed</small>
          </div>
        </article>
        <article class="float-card float-card--bottom">
          <span class="float-num">92%</span>
          <div>
            <strong>Team progress</strong>
            <small>Compliance path</small>
          </div>
        </article>
      </div>
    </section>

    <!-- Features -->
    <section id="features" class="section">
      <div class="section__header">
        <p class="pill pill--muted">
          <span class="material-symbols-outlined">auto_awesome</span>
          Platform features
        </p>
        <h2>Everything you need to run professional training.</h2>
      </div>
      <div class="feature-grid">
        @for (f of features; track f.title) {
          <article class="feature-card">
            <span class="feature-icon material-symbols-outlined">{{ f.icon }}</span>
            <h3>{{ f.title }}</h3>
            <p>{{ f.body }}</p>
          </article>
        }
      </div>
    </section>

    <!-- Domains -->
    <section class="section section--alt">
      <div class="section__header">
        <p class="pill pill--muted">
          <span class="material-symbols-outlined">category</span>
          Training domains
        </p>
        <h2>Organize programs by business need.</h2>
      </div>
      <div class="domain-grid">
        @for (domain of domains; track domain.title) {
          <article class="domain-card">
            <div class="domain-icon-wrap">
              <span class="material-symbols-outlined">{{ domain.icon }}</span>
            </div>
            <span class="domain-tag">{{ domain.meta }}</span>
            <h3>{{ domain.title }}</h3>
            <p>{{ domain.body }}</p>
          </article>
        }
      </div>
    </section>

    <!-- Programs -->
    <section id="programs" class="section">
      <div class="programs-top">
        <div>
          <p class="pill pill--muted">
            <span class="material-symbols-outlined">library_books</span>
            Featured programs
          </p>
          <h2>Course cards built for B2B training.</h2>
        </div>
        <a class="btn btn-secondary" routerLink="/auth/login">
          Open workspace
          <span class="material-symbols-outlined">arrow_forward</span>
        </a>
      </div>
      <div class="program-grid">
        @for (program of programs; track program.title) {
          <article class="program-card">
            <div class="program-media" [class]="program.tone">
              <span>{{ program.category }}</span>
              <strong>{{ program.level }}</strong>
            </div>
            <div class="program-body">
              <h3>{{ program.title }}</h3>
              <p>{{ program.body }}</p>
              <div class="program-meta">
                <span><span class="material-symbols-outlined">schedule</span>{{ program.duration }}</span>
                <span><span class="material-symbols-outlined">star</span>{{ program.rating }}</span>
              </div>
            </div>
            <footer>
              <span>{{ program.trainer }}</span>
              <a routerLink="/auth/register">Enroll &rarr;</a>
            </footer>
          </article>
        }
      </div>
    </section>

    <!-- How it works -->
    <section id="workflow" class="section section--alt">
      <div class="workflow">
        <div class="workflow__copy">
          <p class="pill pill--muted">
            <span class="material-symbols-outlined">route</span>
            How it works
          </p>
          <h2>From content to completion in three steps.</h2>
        </div>
        <div class="workflow__steps">
          @for (step of steps; track step.num) {
            <article class="step-card">
              <span class="step-num">{{ step.num }}</span>
              <div>
                <h3>{{ step.title }}</h3>
                <p>{{ step.body }}</p>
              </div>
            </article>
          }
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="final-cta">
      <div class="cta-inner">
        <div class="cta-copy">
          <h2>Ready to launch your training workspace?</h2>
          <p>Start building professional programs for your teams today.</p>
        </div>
        <div class="cta-actions">
          <a class="btn btn-primary btn-lg" routerLink="/auth/register">
            Create free account
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
          <a class="btn btn-secondary btn-lg" routerLink="/auth/login">Login</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    h1, h2, h3, p { margin: 0; }

    /* ── Shared ── */
    .pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: var(--color-primary-strong);
      background: var(--color-primary-soft);
    }

    .pill .material-symbols-outlined { font-size: 16px; }

    .pill--muted {
      color: var(--color-muted);
      background: rgba(100, 116, 139, 0.08);
    }

    .section {
      width: min(1140px, calc(100% - 48px));
      margin: 0 auto;
      padding: 72px 0;
    }

    .section--alt {
      background: transparent;
    }

    .section__header {
      display: grid;
      gap: 12px;
      max-width: 560px;
      margin: 0 auto 40px;
      text-align: center;
      justify-items: center;
    }

    .section__header h2,
    .programs-top h2,
    .workflow__copy h2,
    .cta-inner h2 {
      color: var(--color-heading);
      font-size: clamp(26px, 2.8vw, 34px);
      line-height: 1.2;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    /* ── Hero ── */
    .hero {
      display: grid;
      grid-template-columns: 1fr minmax(340px, 0.9fr);
      gap: 48px;
      align-items: center;
      width: min(1140px, calc(100% - 48px));
      margin: 0 auto;
      padding: 56px 0 48px;
      animation: fadeInUp 0.6s ease both;
    }

    .hero__content { display: grid; gap: 20px; }

    h1 {
      color: var(--color-heading);
      font-size: clamp(40px, 6vw, 64px);
      line-height: 1.0;
      font-weight: 900;
      letter-spacing: -0.03em;
    }

    .gradient-text {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 50%, var(--color-cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero__subtitle {
      max-width: 520px;
      color: var(--color-muted);
      font-size: 16px;
      line-height: 1.7;
    }

    .hero__cta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .btn-lg {
      min-height: 50px;
      padding-inline: 24px;
      font-size: 15px;
    }

    .hero__stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 8px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }

    .stat-icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      font-size: 18px;
      flex-shrink: 0;
    }

    .stat-card strong {
      display: block;
      color: var(--color-heading);
      font-size: 15px;
      font-weight: 800;
      line-height: 1.2;
    }

    .stat-card span { color: var(--color-muted); font-size: 12px; font-weight: 600; }

    /* ── Hero Visual ── */
    .hero__visual {
      position: relative;
    }

    .visual-frame {
      border-radius: 24px;
      overflow: hidden;
      background: linear-gradient(145deg, #eef2ff, #ecfeff);
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
    }

    .visual-frame img {
      display: block;
      width: 100%;
      height: 420px;
      object-fit: cover;
      object-position: top center;
    }

    .float-card {
      position: absolute;
      z-index: 2;
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 12px 16px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(12px);
      animation: fadeInUp 0.7s ease 0.3s both;
    }

    .float-card--top { top: 24px; right: -12px; }
    .float-card--bottom { left: -12px; bottom: 32px; }

    .float-icon { color: var(--color-primary); font-size: 24px; }
    .float-num { color: var(--color-primary); font-size: 22px; font-weight: 900; }
    .float-card strong { display: block; color: var(--color-heading); font-size: 13px; font-weight: 800; }
    .float-card small { display: block; color: var(--color-muted); font-size: 11px; font-weight: 600; }

    /* ── Features ── */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .feature-card {
      display: grid;
      gap: 12px;
      padding: 24px;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
    }

    .feature-card:hover {
      transform: translateY(-4px);
      border-color: rgba(79, 70, 229, 0.2);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    }

    .feature-icon {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      font-size: 22px;
    }

    .feature-card h3 {
      color: var(--color-heading);
      font-size: 17px;
      font-weight: 800;
      letter-spacing: -0.01em;
    }

    .feature-card p,
    .domain-card p,
    .workflow__copy p,
    .step-card p {
      color: var(--color-muted);
      font-size: 14px;
      line-height: 1.65;
    }

    /* ── Domains ── */
    .domain-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .domain-card {
      display: grid;
      gap: 12px;
      padding: 24px;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      transition: transform var(--transition-base), box-shadow var(--transition-base), border-color var(--transition-base);
    }

    .domain-card:hover {
      transform: translateY(-4px);
      border-color: rgba(79, 70, 229, 0.18);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    }

    .domain-icon-wrap {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: 14px;
      color: #0f766e;
      background: linear-gradient(135deg, #ecfeff, #f0fdf4);
    }

    .domain-tag {
      display: inline-block;
      width: fit-content;
      padding: 4px 10px;
      border-radius: 999px;
      color: var(--color-primary);
      background: var(--color-primary-soft);
      font-size: 11px;
      font-weight: 700;
    }

    .domain-card h3 {
      color: var(--color-heading);
      font-size: 16px;
      font-weight: 800;
    }

    /* ── Programs ── */
    .programs-top {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 20px;
      margin-bottom: 32px;
    }

    .programs-top > div { display: grid; gap: 12px; max-width: 480px; }

    .program-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .program-card {
      display: flex;
      flex-direction: column;
      min-width: 0;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
      overflow: hidden;
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .program-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
    }

    .program-media {
      display: flex;
      justify-content: space-between;
      min-height: 130px;
      padding: 20px;
      color: #fff;
      background: linear-gradient(135deg, #4f46e5, #06b6d4);
    }

    .program-media.violet { background: linear-gradient(135deg, #4338ca, #7c3aed); }
    .program-media.green { background: linear-gradient(135deg, #0f766e, #10b981); }
    .program-media.orange { background: linear-gradient(135deg, #f59e0b, #ef4444); }

    .program-media span,
    .program-media strong {
      align-self: start;
      padding: 5px 10px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      font-size: 11px;
      font-weight: 700;
    }

    .program-body {
      display: grid;
      gap: 8px;
      flex: 1;
      padding: 20px;
    }

    .program-body h3 {
      color: var(--color-heading);
      font-size: 16px;
      font-weight: 800;
      line-height: 1.3;
    }

    .program-body p {
      color: var(--color-muted);
      font-size: 13px;
      line-height: 1.6;
    }

    .program-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 4px;
      color: var(--color-muted);
      font-size: 12px;
      font-weight: 700;
    }

    .program-meta span {
      display: inline-flex;
      gap: 4px;
      align-items: center;
    }

    .program-meta .material-symbols-outlined {
      color: var(--color-warning);
      font-size: 16px;
    }

    .program-card footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      border-top: 1px solid rgba(215, 227, 248, 0.6);
      color: var(--color-heading);
      font-size: 13px;
      font-weight: 700;
    }

    .program-card footer a {
      color: var(--color-primary);
      font-weight: 700;
    }

    /* ── Workflow ── */
    .workflow {
      display: grid;
      grid-template-columns: 0.85fr 1.15fr;
      gap: 40px;
      align-items: start;
    }

    .workflow__copy { display: grid; gap: 12px; }
    .workflow__steps { display: grid; gap: 12px; }

    .step-card {
      display: flex;
      gap: 16px;
      padding: 20px;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.92);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
      transition: transform var(--transition-base), box-shadow var(--transition-base);
    }

    .step-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(15, 23, 42, 0.08);
    }

    .step-num {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 12px;
      color: #fff;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      font-size: 15px;
      font-weight: 800;
    }

    .step-card h3 {
      color: var(--color-heading);
      font-size: 15px;
      font-weight: 800;
      margin-bottom: 4px;
    }

    /* ── Final CTA ── */
    .final-cta {
      width: min(1140px, calc(100% - 48px));
      margin: 0 auto;
      padding-bottom: 48px;
    }

    .cta-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 32px;
      padding: 32px 40px;
      border: 1px solid rgba(215, 227, 248, 0.8);
      border-radius: 24px;
      background: linear-gradient(135deg, rgba(238, 242, 255, 0.8), rgba(236, 254, 255, 0.6));
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.06);
    }

    .cta-copy { display: grid; gap: 8px; max-width: 480px; }
    .cta-copy p { color: var(--color-muted); font-size: 15px; line-height: 1.6; }

    .cta-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }

    /* ── Responsive ── */
    @media (max-width: 1000px) {
      .hero { grid-template-columns: 1fr; padding: 40px 0 32px; }
      .hero__visual { max-width: 560px; }
      .domain-grid { grid-template-columns: repeat(2, 1fr); }
      .program-grid { grid-template-columns: repeat(2, 1fr); }
      .workflow { grid-template-columns: 1fr; }
      .programs-top { align-items: start; flex-direction: column; }
      .cta-inner { flex-direction: column; text-align: center; align-items: center; }
    }

    @media (max-width: 720px) {
      .hero, .section, .final-cta { width: min(100% - 32px, 1140px); }
      .hero { gap: 32px; }
      .hero__stats { grid-template-columns: 1fr; }
      .feature-grid,
      .domain-grid,
      .program-grid { grid-template-columns: 1fr; }
      .visual-frame img { height: 280px; }
      .float-card--top { right: 8px; top: 12px; }
      .float-card--bottom { left: 8px; bottom: 12px; }
      .section { padding: 48px 0; }
      .cta-inner { padding: 24px; }
      .cta-actions { flex-direction: column; width: 100%; }
      .cta-actions .btn { width: 100%; justify-content: center; }
      .hero__cta { flex-direction: column; width: 100%; }
      .hero__cta .btn { width: 100%; justify-content: center; }
    }
  `]
})
export class HomePage {
  readonly stats: HeroStat[] = [
    { icon: 'group', value: '5 Roles', label: 'Admin, trainer, manager, learner' },
    { icon: 'monitoring', value: '360° View', label: 'Progress, quizzes, certificates' },
    { icon: 'business', value: 'B2B Ready', label: 'Built for companies at scale' }
  ];

  readonly features: Feature[] = [
    {
      icon: 'school',
      title: 'Trainer-led programs',
      body: 'Trainers build structured courses with lessons, quizzes, and completion rules.'
    },
    {
      icon: 'assignment_ind',
      title: 'Team assignments',
      body: 'Assign training paths to companies, teams, or individual learners.'
    },
    {
      icon: 'insights',
      title: 'Progress tracking',
      body: 'Track completion rates, quiz scores, and certificate readiness in real time.'
    }
  ];

  readonly domains: Domain[] = [
    {
      icon: 'admin_panel_settings',
      title: 'Compliance',
      body: 'Assign required programs and track completion records.',
      meta: 'Required paths'
    },
    {
      icon: 'groups',
      title: 'Onboarding',
      body: 'Structured learning paths for new employees by team.',
      meta: 'Team launch'
    },
    {
      icon: 'leaderboard',
      title: 'Leadership',
      body: 'Practical training for managers with progress visibility.',
      meta: 'Manager growth'
    },
    {
      icon: 'support_agent',
      title: 'Customer success',
      body: 'Train client-facing teams with quizzes and tracking.',
      meta: 'Client teams'
    }
  ];

  readonly programs: Program[] = [
    {
      category: 'Company path',
      level: 'Intermediate',
      title: 'Compliance Essentials for Distributed Teams',
      body: 'Policies, knowledge checks, and completion certificates.',
      duration: '8 lessons',
      rating: '4.9',
      trainer: 'Trainer workspace',
      tone: 'violet'
    },
    {
      category: 'Trainer-led',
      level: 'Advanced',
      title: 'Leadership Enablement Sprint',
      body: 'Coach learners, approve completion, and follow progress.',
      duration: '6 modules',
      rating: '4.8',
      trainer: 'Approval flow',
      tone: 'green'
    },
    {
      category: 'Learner path',
      level: 'Starter',
      title: 'Sales & Customer Success Onboarding',
      body: 'Lessons, quiz feedback, and certificate readiness.',
      duration: '10 lessons',
      rating: '4.7',
      trainer: 'Progress tracked',
      tone: 'orange'
    }
  ];

  readonly steps = [
    { num: '01', title: 'Create programs', body: 'Trainers build trainings with lessons, quizzes, and rules.' },
    { num: '02', title: 'Assign by audience', body: 'Target companies, teams, or individual learners.' },
    { num: '03', title: 'Measure outcomes', body: 'Track progress, scores, approvals, and certificates.' }
  ];
}
