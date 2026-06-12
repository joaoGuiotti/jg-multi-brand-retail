import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UiCardComponent } from '@shared/ui';

@Component({
    selector: 'app-kpi-cards',
    standalone: true,
    imports: [CommonModule, UiCardComponent],
    template: `
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Revenue Today -->
      <ui-card [shadow]="true" padding="sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-content-secondary mb-1">Revenue Today</p>
            <p class="text-xl font-bold text-content">{{ revenueToday | currency:'BRL' }}</p>
            <p class="text-xs text-content-secondary mt-1">{{ salesToday }} completed sales</p>
          </div>
          <div class="kpi-icon bg-primary/10 flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="text-primary w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </ui-card>

      <!-- Total Products -->
      <ui-card [shadow]="true" padding="sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-content-secondary mb-1">Total Products</p>
            <p class="text-xl font-bold text-content">{{ totalProducts }}</p>
            <p class="text-xs text-content-secondary mt-1">registered in catalog</p>
          </div>
          <div class="kpi-icon bg-success/10 flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="text-success w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        </div>
      </ui-card>

      <!-- Low Stock Alerts -->
      <ui-card [shadow]="true" padding="sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-content-secondary mb-1">Low Stock</p>
            <p class="text-xl font-bold text-warning">{{ lowStock }}</p>
            <p class="text-xs text-content-secondary mt-1">items below minimum</p>
          </div>
          <div class="kpi-icon bg-warning/10 flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="text-warning w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>
      </ui-card>

      <!-- Out of Stock -->
      <ui-card [shadow]="true" padding="sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-xs text-content-secondary mb-1">Out of Stock</p>
            <p class="text-xl font-bold text-error">{{ outOfStock }}</p>
            <p class="text-xs text-content-secondary mt-1">items with zero stock</p>
          </div>
          <div class="kpi-icon bg-error/10 flex items-center justify-center w-10 h-10 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="text-error w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </div>
      </ui-card>
    </div>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      display: block;
    }
  `]
})
export class KpiCardsComponent {
    @Input() revenueToday = 0;
    @Input() salesToday = 0;
    @Input() totalProducts = 0;
    @Input() lowStock = 0;
    @Input() outOfStock = 0;
}
