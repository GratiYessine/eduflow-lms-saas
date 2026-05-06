import { Component, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'ui-textarea',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: UiTextareaComponent, multi: true }],
  template: `<textarea class="control" [placeholder]="placeholder" [value]="value" (input)="update($event)" (blur)="onTouched()"></textarea>`
})
export class UiTextareaComponent implements ControlValueAccessor {
  @Input() placeholder = '';
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
    this.value = (event.target as HTMLTextAreaElement).value;
    this.onChange(this.value);
  }
}
