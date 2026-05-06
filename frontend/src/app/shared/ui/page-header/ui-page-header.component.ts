import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-page-header',
  standalone: true,
  template: `
    <header class="page-header">
      <div>
        <p>{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <span class="muted">{{ description }}</span>
      </div>
      <div class="page-actions"><ng-content /></div>
    </header>
  `,
  styles: [`
    :host { display: block; width: 100%; max-width: 100%; min-width: 0; }
    .page-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; flex-wrap: wrap; width: 100%; max-width: 100%; min-width: 0; }
    .page-header > div:first-child { display: grid; gap: 6px; min-width: 0; max-width: 760px; }
    p { margin: 0; color: var(--color-primary); font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
    h1 { margin: 0; color: var(--color-heading); font-size: 38px; line-height: 1.12; font-weight: 900; letter-spacing: 0; }
    span { display: block; max-width: 68ch; font-size: 15px; line-height: 1.6; }
    .page-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    @media (max-width: 680px) { h1 { font-size: 30px; } .page-actions { width: 100%; } .page-actions ::ng-deep .btn { flex: 1 1 160px; } }
  `]
})
export class UiPageHeaderComponent {
  @Input() eyebrow = 'Workspace';
  @Input() title = '';
  @Input() description = '';
}
