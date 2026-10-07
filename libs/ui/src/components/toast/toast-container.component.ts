import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ToastService } from '../../services/toast/toast.service';
import { ToastComponent } from './toast.component';

@Component({
  selector: 'ui-toast-container',
  standalone: true,
  imports: [ToastComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="fixed top-20 right-0 z-[9999] p-8 pointer-events-none flex flex-col gap-2 items-end overflow-visible"
      style="min-width: 400px;"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <ui-toast [toast]="toast" (close)="toastService.remove(toast.id)"></ui-toast>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
