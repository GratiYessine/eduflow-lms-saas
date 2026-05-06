import { Injectable, signal } from '@angular/core';

export interface ToastState {
  message: string;
  tone: 'info' | 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly current = signal<ToastState | null>(null);
  private timeoutId?: number;

  show(message: string, tone: ToastState['tone'] = 'info'): void {
    window.clearTimeout(this.timeoutId);
    this.current.set({ message, tone });
    this.timeoutId = window.setTimeout(() => this.current.set(null), 4200);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }
}
