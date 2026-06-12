import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { UiBadgeComponent, UiButtonComponent, UiCardComponent } from '@shared/ui';
import { DashboardRecentSale } from '../../../../core/models/dashboard.model';

@Component({
    selector: 'app-recent-sales',
    standalone: true,
    imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiButtonComponent],
    template: `
    <ui-card [shadow]="true" padding="none">
      <div class="p-6 border-b border-outline flex items-center justify-between">
        <h2 class="text-xl font-semibold text-content">Recent Sales</h2>
        <ui-button variant="ghost" size="sm" (click)="viewAll.emit()">View all</ui-button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-surface-alt/50 border-b border-outline">
            <tr>
              <th class="px-6 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider">Sale ID</th>
              <th class="px-6 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-xs font-semibold text-content-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline">
            @for (sale of recentSales; track sale.id) {
            <tr class="hover:bg-surface-alt/30 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-content">#{{ sale.id.substring(0, 8) }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-content-secondary">{{ sale.customerId ? 'Customer ' + sale.customerId.substring(0,4) : 'Walk-in Customer' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-semibold text-content">{{ sale.total | currency:'BRL' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <ui-badge [variant]="getSaleStatusVariant(sale.status)">{{ sale.status }}</ui-badge>
              </td>
            </tr>
            } @empty {
            <tr>
              <td colspan="4" class="px-6 py-8 text-center text-content-secondary italic">No recent sales found</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
    </ui-card>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    styles: [`
    :host {
      display: block;
    }
    @keyframes flashNew {
      0% { background-color: rgba(74, 222, 128, 0.4); }
      100% { background-color: transparent; }
    }
    tbody tr:first-child {
      animation: flashNew 1.5s ease-out;
    }
  `]
})
export class RecentSalesComponent {
    @Input() recentSales: DashboardRecentSale[] = [];
    @Output() viewAll = new EventEmitter<void>();

    getSaleStatusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    }
}
