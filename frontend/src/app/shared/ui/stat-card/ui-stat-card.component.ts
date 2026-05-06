import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-stat-card',
  standalone: true,
  template: `
    <article class="card stat-card">
      <div class="stat-icon material-symbols-outlined">{{ icon }}</div>
      <div>
        <p class="muted">{{ label }}</p>
        <strong>{{ value }}</strong>
        @if (trend) {
          <span>{{ trend }}</span>
        }
      </div>
    </article>
  `,
  styles: [`
    .stat-card { display: grid; gap: 28px; min-height: 158px; align-content: space-between; overflow: hidden; }
    .stat-card::before { content: ''; position: absolute; inset: 0 0 auto; height: 3px; background: linear-gradient(90deg, var(--color-primary), transparent); }
    .stat-card strong { display: block; color: var(--color-heading); font-size: 32px; line-height: 1.1; font-weight: 900; letter-spacing: 0; }
    .stat-card p { margin: 0; font-size: 12px; font-weight: 850; text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-card span { color: var(--color-muted); font-size: 12px; font-weight: 800; }
    .stat-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 16px; background: var(--color-primary-soft); color: var(--color-primary); box-shadow: inset 0 0 0 1px rgba(79, 70, 229, 0.1); }
  `]
})
export class UiStatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() trend = '';
  @Input() icon = 'analytics';
}
