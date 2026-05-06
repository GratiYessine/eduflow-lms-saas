import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'action';
}

@Component({
  selector: 'ui-data-table',
  standalone: true,
  template: `
    @if (rows.length) {
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              @for (column of columns; track column.key) {
                <th>{{ column.label }}</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row['id'] ?? $index) {
              <tr [class.clickable]="rowClick.observed" (click)="rowClick.emit(row)">
                @for (column of columns; track column.key) {
                  <td>
                    @if (column.type === 'status') {
                      <span class="badge" [class]="statusBadgeClass(row[column.key])">{{ row[column.key] }}</span>
                    } @else {
                      {{ row[column.key] }}
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="empty-inline">{{ emptyText }}</div>
    }
  `,
  styles: [`
    .clickable { cursor: pointer; }
    .clickable:hover td { background: rgba(238, 242, 255, 0.72) !important; }
  `]
})
export class UiDataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() rows: Array<Record<string, unknown>> = [];
  @Input() emptyText = 'No data available.';
  @Output() rowClick = new EventEmitter<Record<string, unknown>>();

  statusBadgeClass(value: unknown): string {
    const status = String(value ?? '').toUpperCase();
    if (status === 'ACTIVE' || status === 'PUBLISHED' || status === 'APPROVED' || status === 'COMPLETED') {
      return 'badge-success';
    }
    if (status === 'PENDING' || status === 'DRAFT' || status === 'IN_PROGRESS' || status === 'CREATING' || status === 'NOT_STARTED') {
      return 'badge-warning';
    }
    if (status === 'SUSPENDED' || status === 'ARCHIVED' || status === 'REJECTED') {
      return 'badge-danger';
    }
    return 'badge-info';
  }
}
