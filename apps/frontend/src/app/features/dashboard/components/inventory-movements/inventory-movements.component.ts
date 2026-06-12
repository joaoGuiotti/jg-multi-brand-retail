import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { UiBadgeComponent, UiButtonComponent, UiCardComponent } from '@shared/ui';
import { DashboardRecentMovement } from '../../../../core/models/dashboard.model';

@Component({
    selector: 'app-inventory-movements',
    standalone: true,
    imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiButtonComponent],
    template: `
    <ui-card [shadow]="true" padding="none">
      <div class="p-6 border-b border-outline flex items-center justify-between">
        <h2 class="text-xl font-semibold text-content">Recent Movements</h2>
        <ui-button variant="ghost" size="sm" (click)="viewAll.emit()">View all</ui-button>
      </div>

      <div class="p-0">
        <div class="divide-y divide-outline">
          @for (movement of recentMovements; track movement.id) {
          <div class="p-4 hover:bg-surface-alt/30 transition-colors flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full flex items-center justify-center"
                   [ngClass]="{
                     'bg-success/10 text-success': movement.type === 'ENTRY' || movement.type === 'RETURN',
                     'bg-error/10 text-error': movement.type === 'EXIT',
                     'bg-warning/10 text-warning': movement.type === 'ADJUSTMENT'
                   }">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        [attr.d]="movement.type === 'ENTRY' || movement.type === 'RETURN' ? 'M12 4v16m8-8H4' : 'M20 12H4'" />
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-content">{{ movement.productName || 'Product ID: ' + movement.productId.substring(0, 8) }}</p>
                <p class="text-xs text-content-secondary">{{ movement.quantity }} units • {{ formatDate(movement.createdAt) }}</p>
              </div>
            </div>
            <ui-badge [variant]="getMovementVariant(movement.type)">{{ movement.type }}</ui-badge>
          </div>
          } @empty {
          <div class="px-6 py-8 text-center text-content-secondary italic">No recent movements found</div>
          }
        </div>
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
    .divide-y > div:first-child {
      animation: flashNew 1.5s ease-out;
    }
  `]
})
export class InventoryMovementsComponent {
    @Input() recentMovements: DashboardRecentMovement[] = [];
    @Output() viewAll = new EventEmitter<void>();

    formatDate(dateString: string): string {
        const d = new Date(dateString);
        return (
            d.toLocaleDateString('pt-BR') +
            ' ' +
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
    }

    getMovementVariant(type: string): 'success' | 'error' | 'warning' | 'info' {
        switch (type) {
            case 'ENTRY': return 'success';
            case 'EXIT': return 'error';
            case 'ADJUSTMENT': return 'warning';
            case 'RETURN': return 'info';
            default: return 'info';
        }
    }
}
