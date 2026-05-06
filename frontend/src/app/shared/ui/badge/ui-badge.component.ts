import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-badge',
  standalone: true,
  template: `<span class="badge" [class.badge-success]="tone === 'success'" [class.badge-warning]="tone === 'warning'" [class.badge-danger]="tone === 'danger'" [class.badge-info]="tone === 'info'"><ng-content /></span>`
})
export class UiBadgeComponent {
  @Input() tone: 'success' | 'warning' | 'danger' | 'info' = 'info';
}
