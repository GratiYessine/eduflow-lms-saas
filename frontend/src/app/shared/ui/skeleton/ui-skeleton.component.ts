import { Component, Input } from '@angular/core';

@Component({
  selector: 'ui-skeleton',
  standalone: true,
  template: `
    <div class="skeleton-stack" [style.--rows]="rows">
      @for (line of skeletonRows(); track $index) {
        <span class="skeleton-line" [class.short]="line % 3 === 2" [class.medium]="line % 3 === 1"></span>
      }
    </div>
  `,
  styles: [`
    .skeleton-stack { display: grid; gap: 12px; width: 100%; }
    .skeleton-line {
      display: block;
      min-height: 18px;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(226,232,240,0.72), rgba(238,242,255,0.95), rgba(226,232,240,0.72));
      background-size: 220% 100%;
      animation: shimmer 1.35s ease-in-out infinite;
    }
    .skeleton-line.medium { width: 78%; }
    .skeleton-line.short { width: 54%; }
    @keyframes shimmer { 0% { background-position: 120% 0; } 100% { background-position: -120% 0; } }
  `]
})
export class UiSkeletonComponent {
  @Input() rows = 3;

  skeletonRows(): number[] {
    return Array.from({ length: Math.max(1, this.rows) }, (_, index) => index);
  }
}
