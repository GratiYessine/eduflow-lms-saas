import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-progress-bar',
  standalone: true,
  template: `<div class="progress" role="progressbar" [attr.aria-valuenow]="value" aria-valuemin="0" aria-valuemax="100"><span [style.width.%]="value"></span></div>`,
  styles: [`
    .progress { height: 9px; overflow: hidden; border-radius: 999px; background: #e2e8f0; }
    .progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--color-primary-strong), var(--color-secondary)); }
  `]
})
export class UiProgressBarComponent {
  @Input() value = 0;
}
