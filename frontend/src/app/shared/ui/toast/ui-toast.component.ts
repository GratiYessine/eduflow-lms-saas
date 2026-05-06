import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-toast',
  standalone: true,
  template: `
    @if (message) {
      <div class="toast" [class.toast-success]="tone === 'success'" [class.toast-error]="tone === 'error'">
        {{ message }}
      </div>
    }
  `,
  styles: [`
    .toast { position: fixed; right: 24px; bottom: 24px; z-index: 300; padding: 12px 16px; border-radius: var(--radius-sm); background: #0f172a; color: #fff; box-shadow: var(--shadow-hover); font-weight: 700; }
    .toast-success { background: #047857; }
    .toast-error { background: var(--color-danger-strong); }
  `]
})
export class UiToastComponent {
  @Input() message = '';
  @Input() tone: 'info' | 'success' | 'error' = 'info';
}
