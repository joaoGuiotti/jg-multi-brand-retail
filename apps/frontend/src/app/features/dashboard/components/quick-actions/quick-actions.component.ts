
import { Component, EventEmitter, Output, ChangeDetectionStrategy } from '@angular/core';
import { UiButtonComponent, UiCardComponent } from '@shared/ui';

@Component({
    selector: 'app-quick-actions',
    standalone: true,
    imports: [UiCardComponent, UiButtonComponent],
    template: `
    <ui-card [shadow]="true" padding="md" class="mb-6">
      <div class="flex flex-wrap items-center gap-4">
        <h2 class="text-lg font-semibold text-content mr-4">Quick Actions</h2>
        
        <ui-button variant="primary" (clicked)="action.emit('pos')">
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            New Sale
          </span>
        </ui-button>

        <ui-button variant="secondary" (clicked)="action.emit('products')">
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </span>
        </ui-button>

        <ui-button variant="secondary" (clicked)="action.emit('inventory')">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              Inventory
            </span>
        </ui-button>

        <ui-button variant="ghost" (clicked)="action.emit('sales')">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Sales History
            </span>
        </ui-button>
      </div>
    </ui-card>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class QuickActionsComponent {
    @Output() action = new EventEmitter<string>();
}
