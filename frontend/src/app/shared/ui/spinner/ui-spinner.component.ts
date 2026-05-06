import { Component } from '@angular/core';

@Component({
  selector: 'ui-spinner',
  standalone: true,
  template: `<span class="spinner" aria-label="Loading"></span>`,
  styles: [`
    .spinner { display: inline-block; width: 22px; height: 22px; border-radius: 50%; border: 3px solid #cbd5e1; border-top-color: var(--color-primary-strong); animation: spin 800ms linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class UiSpinnerComponent {}
