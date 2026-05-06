import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface EntityOption {
  id: number;
  label: string;
  meta?: string;
  icon?: string;
  avatar?: string;
}

@Component({
  selector: 'ui-entity-combobox',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field combo-field">
      @if (label) { <span>{{ label }}</span> }
      <div class="combo" [class.is-open]="open()" [class.is-disabled]="disabled">
        <input
          class="control combo-input"
          [ngModel]="query()"
          (ngModelChange)="type($event)"
          (focus)="openMenu()"
          (blur)="closeLater()"
          (keydown)="handleKeydown($event)"
          [placeholder]="placeholder"
          [disabled]="disabled"
          autocomplete="off"
          role="combobox"
          [attr.aria-expanded]="open()"
        />
        @if (value) {
          <button class="combo-icon" type="button" (mousedown)="$event.preventDefault()" (click)="clear()" [disabled]="disabled">
            <span class="material-symbols-outlined">close</span>
          </button>
        } @else {
          <span class="combo-icon passive"><span class="material-symbols-outlined">expand_more</span></span>
        }
        @if (open() && !disabled) {
          <div class="combo-menu">
            @if (loading) {
              <div class="combo-state">Loading...</div>
            } @else {
              @for (option of filteredOptions(); track option.id; let index = $index) {
                <button type="button" class="combo-option" [class.active]="index === activeIndex()" (mousedown)="$event.preventDefault()" (click)="select(option)">
                  @if (option.avatar) {
                    <img [src]="option.avatar" [alt]="option.label" />
                  } @else {
                    <span class="option-avatar">{{ option.icon || initials(option.label) }}</span>
                  }
                  <span class="option-copy">
                    <strong>{{ option.label }}</strong>
                    @if (option.meta) { <small>{{ option.meta }}</small> }
                  </span>
                </button>
              } @empty {
                <div class="combo-state">{{ emptyText }}</div>
              }
              @if (filteredOptions().length) {
                <div class="combo-footer">{{ filteredOptions().length }} result{{ filteredOptions().length === 1 ? '' : 's' }}</div>
              }
            }
          </div>
        }
      </div>
    </label>
  `,
  styles: [`
    .combo-field { position: relative; }
    .combo { position: relative; }
    .combo-input { padding-right: 42px; }
    .combo-icon { position: absolute; top: 5px; right: 6px; display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-muted); cursor: pointer; }
    .combo-icon:hover { background: var(--color-surface-raised); color: var(--color-text); }
    .combo-icon.passive { pointer-events: none; }
    .combo-menu { position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; right: 0; max-height: 260px; overflow: auto; padding: 6px; border: 1px solid var(--color-border-strong); border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-soft); }
    .combo-option { display: grid; grid-template-columns: 34px 1fr; gap: 10px; align-items: center; width: 100%; padding: 10px; border: 0; border-radius: var(--radius-md); background: transparent; color: var(--color-text); text-align: left; cursor: pointer; }
    .combo-option:hover, .combo-option.active { background: var(--color-surface-raised); }
    .combo-option img, .option-avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 12px; background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: #fff; font-size: 11px; font-weight: 900; object-fit: cover; }
    .option-copy { display: grid; gap: 2px; min-width: 0; }
    .combo-option strong { font-size: 14px; }
    .combo-option small, .combo-state { color: var(--color-muted); font-size: 12px; font-weight: 700; }
    .combo-option strong, .combo-option small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .combo-state { padding: 12px; text-align: center; }
    .combo-footer { margin: 4px 4px 0; padding-top: 8px; border-top: 1px solid var(--color-border); color: var(--color-muted); font-size: 11px; font-weight: 800; text-align: center; }
    .is-disabled { opacity: 0.72; }
  `]
})
export class EntityComboboxComponent implements OnChanges {
  @Input() label = '';
  @Input() placeholder = 'Search...';
  @Input() emptyText = 'No matches found.';
  @Input() options: EntityOption[] = [];
  @Input() value: number | null = null;
  @Input() loading = false;
  @Input() disabled = false;
  @Output() valueChange = new EventEmitter<number | null>();

  readonly query = signal('');
  readonly open = signal(false);
  readonly activeIndex = signal(0);

  ngOnChanges(): void {
    const selected = this.selectedOption();
    if (selected && !this.open()) {
      this.query.set(selected.label);
    }
    if (!this.value && !this.open()) {
      this.query.set('');
    }
  }

  type(value: string): void {
    this.query.set(value);
    this.open.set(true);
    this.activeIndex.set(0);
    const selected = this.selectedOption();
    if (selected && selected.label !== value) {
      this.valueChange.emit(null);
    }
  }

  filteredOptions(): EntityOption[] {
    const term = this.query().trim().toLowerCase();
    const options = term
      ? this.options.filter((option) => `${option.label} ${option.meta ?? ''}`.toLowerCase().includes(term))
      : this.options;
    return options.slice(0, 12);
  }

  select(option: EntityOption): void {
    this.query.set(option.label);
    this.valueChange.emit(option.id);
    this.open.set(false);
  }

  clear(): void {
    this.query.set('');
    this.valueChange.emit(null);
    this.open.set(true);
  }

  closeLater(): void {
    setTimeout(() => this.open.set(false), 120);
  }

  openMenu(): void {
    this.open.set(true);
    this.activeIndex.set(0);
  }

  handleKeydown(event: KeyboardEvent): void {
    const options = this.filteredOptions();
    if (!options.length) {
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open.set(true);
      this.activeIndex.update((index) => Math.min(index + 1, options.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => Math.max(index - 1, 0));
    }
    if (event.key === 'Enter' && this.open()) {
      event.preventDefault();
      this.select(options[this.activeIndex()] ?? options[0]);
    }
    if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  initials(label: string): string {
    return label
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  }

  private selectedOption(): EntityOption | undefined {
    return this.options.find((option) => option.id === this.value);
  }
}
