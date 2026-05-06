import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ui-modal',
  standalone: true,
  template: `
    @if (open) {
      <div class="modal-backdrop" (click)="closed.emit()">
        <section class="modal card" (click)="$event.stopPropagation()">
          <div class="toolbar">
            <h2>{{ title }}</h2>
            <button class="modal-close" type="button" (click)="closed.emit()" aria-label="Close dialog">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <ng-content />
        </section>
      </div>
    }
  `,
  styles: [`
    .modal-backdrop { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: rgba(15, 23, 42, 0.46); backdrop-filter: blur(10px); }
    .modal { width: min(620px, 100%); max-height: min(760px, calc(100vh - 48px)); overflow: auto; box-shadow: 0 32px 90px rgba(15, 23, 42, 0.24); }
    h2 { margin: 0; color: var(--color-heading); font-size: 20px; line-height: 1.25; }
    .modal-close { display: inline-grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; color: var(--color-muted); background: var(--color-surface-soft); cursor: pointer; }
    .modal-close:hover { color: var(--color-primary-strong); background: var(--color-primary-soft); }
  `]
})
export class UiModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Output() closed = new EventEmitter<void>();
}
