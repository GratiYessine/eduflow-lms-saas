import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  template: `
    <div class="empty-state card">
      <span class="material-symbols-outlined">{{ icon }}</span>
      <h3>{{ title }}</h3>
      <p class="muted">{{ description }}</p>
      <ng-content />
    </div>
  `,
  styles: [`
    .empty-state { display: grid; justify-items: center; gap: 10px; text-align: center; padding: 42px 18px; border-style: dashed; }
    .empty-state span { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 18px; color: var(--color-primary-strong); background: var(--color-primary-soft); font-size: 32px; }
    h3, p { margin: 0; }
    h3 { color: var(--color-heading); font-size: 18px; }
    p { max-width: 48ch; line-height: 1.6; }
  `]
})
export class UiEmptyStateComponent {
  @Input() title = 'Nothing here yet';
  @Input() description = 'Create your first item to get started.';
  @Input() icon = 'inbox';
}
