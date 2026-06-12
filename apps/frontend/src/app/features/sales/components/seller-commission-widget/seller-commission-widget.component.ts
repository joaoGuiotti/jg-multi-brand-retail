import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';

import { UiCardComponent, UiNumberPipe } from '@shared/ui';
import { CommissionsService, CommissionMetrics } from '../../../../core/services/commissions.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-seller-commission-widget',
  standalone: true,
  imports: [UiCardComponent, UiNumberPipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    @if (metrics() && !isAdmin()) {
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <!-- Meta do Mês -->
        <ui-card [shadow]="true" padding="sm" class="relative overflow-hidden">
          <div class="flex flex-col">
            <p class="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Meta do Mês</p>
            <div class="flex items-end justify-between">
              <span class="text-2xl font-bold text-content">
                {{ metrics()!.targetAmount | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
              </span>
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-2 w-full bg-border rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500 ease-out"
              [style.width.%]="Math.min(metrics()!.progressPercentage, 100)"></div>
            </div>
            <p class="text-xs text-content-secondary mt-2 text-right">
              {{ metrics()!.progressPercentage }}% concluído
            </p>
          </div>
        </ui-card>
        <!-- Total Vendido -->
        <ui-card [shadow]="true" padding="sm">
          <div class="flex flex-col">
            <p class="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Total Vendido</p>
            <div class="flex items-end justify-between">
              <span class="text-2xl font-bold text-content">
                {{ metrics()!.totalSold | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
              </span>
              <div class="h-10 w-10 rounded-full bg-info/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-info" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                </svg>
              </div>
            </div>
          </div>
        </ui-card>
        <!-- Comissão (Ganhos) -->
        <ui-card [shadow]="true" padding="sm" class="relative overflow-hidden bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <div class="flex flex-col">
            <p class="text-xs font-semibold text-success uppercase tracking-wider mb-2">Comissão Acumulada</p>
            <div class="flex items-end justify-between">
              <span class="text-2xl font-bold text-success">
                {{ metrics()!.commissionEarned | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
              </span>
              <div class="h-10 w-10 rounded-full bg-success flex items-center justify-center shadow-lg shadow-success/30">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </ui-card>
      </div>
    }
    `
})
export class SellerCommissionWidgetComponent implements OnInit {
  private commissionsService = inject(CommissionsService);
  private authService = inject(AuthService);
  
  metrics = signal<CommissionMetrics | null>(null);
  isAdmin = signal(false);
  Math = Math;

  ngOnInit() {
    const user = this.authService.user();
    if (user) {
      this.isAdmin.set(user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');
    }
    
    // Only load metrics if it's an actual seller, admins don't have targets
    if (!this.isAdmin()) {
      this.loadMetrics();
    }
  }

  loadMetrics() {
    const today = new Date();
    // Fetch dashboard metrics for the current logged in user (no userId param)
    this.commissionsService.getDashboardMetrics(today.getMonth() + 1, today.getFullYear()).subscribe({
      next: (response) => this.metrics.set(response.data),
      error: (err) => console.error('Error loading commission metrics', err)
    });
  }
}
