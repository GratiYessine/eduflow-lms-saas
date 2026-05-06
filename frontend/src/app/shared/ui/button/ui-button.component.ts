import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-button',
  standalone: true,
  template: `
    <button class="btn" [class.btn-primary]="variant === 'primary'" [class.btn-secondary]="variant === 'secondary'" [class.btn-ghost]="variant === 'ghost'" [type]="type" [disabled]="disabled" (click)="clicked.emit()">
      @if (icon) {
        <span class="material-symbols-outlined">{{ icon }}</span>
      }
      <ng-content />
    </button>
  `,
  imports: []
})
export class UiButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() icon = '';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<void>();
}
