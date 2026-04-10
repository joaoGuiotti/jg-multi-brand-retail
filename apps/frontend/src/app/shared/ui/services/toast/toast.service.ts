import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  readonly toasts = computed(() => this.toastsSignal());

  show(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    
    this.toastsSignal.update(toasts => [...toasts, newToast]);

    if (toast.duration !== 0) {
      setTimeout(() => this.remove(id), toast.duration || 5000);
    }
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }

  success(title: string, message: string) {
    this.show({ type: 'success', title, message });
  }

  error(title: string, message: string) {
    this.show({ type: 'error', title, message });
  }

  info(title: string, message: string) {
    this.show({ type: 'info', title, message });
  }

  warning(title: string, message: string) {
    this.show({ type: 'warning', title, message });
  }
}
