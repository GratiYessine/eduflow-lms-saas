import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-form-field',
  standalone: true,
  template: `
    <label class="field">
      <span>{{ label }}</span>
      <ng-content />
      @if (hint) {
        <small class="muted">{{ hint }}</small>
      }
    </label>
  `
})
export class UiFormFieldComponent {
  @Input({ required: true }) label = '';
  @Input() hint = '';
}
