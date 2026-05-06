import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ToastService } from './core/services/toast.service';
import { UiToastComponent } from './shared/ui/toast/ui-toast.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastComponent],
  template: `
    <router-outlet />
    <ui-toast [message]="toast.current()?.message ?? ''" [tone]="toast.current()?.tone ?? 'info'" />
  `,
  styleUrl: './app.scss'
})
export class App {
  readonly toast = inject(ToastService);
}
