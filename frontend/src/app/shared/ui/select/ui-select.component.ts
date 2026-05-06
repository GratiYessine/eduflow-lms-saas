import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'ui-select',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: UiSelectComponent, multi: true }],
  template: `
    <select class="control" [value]="value" (change)="update($event)" (blur)="onTouched()">
      <option value="" disabled>{{ placeholder }}</option>
      @for (option of options; track option.value) {
        <option [value]="option.value">{{ option.label }}</option>
      }
    </select>
  `
})
export class UiSelectComponent implements ControlValueAccessor {
  @Input() placeholder = 'Select an option';
  @Input() options: SelectOption[] = [];
  value = '';
  onChange: (value: string) => void = () => undefined;
  onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  update(event: Event): void {
    this.value = (event.target as HTMLSelectElement).value;
    this.onChange(this.value);
  }
}
