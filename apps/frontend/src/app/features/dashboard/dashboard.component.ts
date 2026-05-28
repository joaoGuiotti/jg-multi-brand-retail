import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, UiPageHeaderComponent } from '@shared/ui';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardService } from '../../core/services/dashboard.service';
import { InventoryMovementsComponent } from './components/inventory-movements/inventory-movements.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { RecentSalesComponent } from './components/recent-sales/recent-sales.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NgApexchartsModule,
    QuickActionsComponent,
    KpiCardsComponent,
    RevenueChartComponent,
    RecentSalesComponent,
    InventoryMovementsComponent,
    UiPageHeaderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DashboardService],
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  public dashboardService = inject(DashboardService);
  private themeService = inject(ThemeService);

  isLoading = this.dashboardService.isLoading;
  connectionState = this.dashboardService.connectionState;
  isStale = this.dashboardService.isStale;

  // KPI data
  revenueToday = this.dashboardService.revenueToday;
  salesToday = this.dashboardService.salesToday;
  lowStock = this.dashboardService.lowStock;
  outOfStock = this.dashboardService.outOfStock;
  totalProducts = this.dashboardService.totalProducts;

  // Recent data
  recentSales = this.dashboardService.recentSales;
  recentMovements = this.dashboardService.recentMovements;

  // Chart data
  chartOptions = this.dashboardService.chartOptions;

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      untracked(() => {
        const currentOptions = this.chartOptions();
        if (currentOptions) {
          this.chartOptions.set({
            ...currentOptions,
            theme: {
              mode: theme
            },
            tooltip: {
              ...currentOptions.tooltip,
              theme: theme
            },
            grid: {
              ...currentOptions.grid,
              borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'
            }
          });
        }
      });
    });
  }

  ngOnInit(): void {
    this.dashboardService.loadSnapshot();
    this.dashboardService.connectSSE();
    this.dashboardService.startChartAutoRefresh();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
