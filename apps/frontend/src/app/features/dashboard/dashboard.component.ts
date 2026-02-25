import { CommonModule } from '@angular/common';
import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService } from '@shared/ui';
import { NgApexchartsModule } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { InventoryMovement } from '../../core/models/inventory.model';
import { Sale } from '../../core/models/sale.model';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import { SalesService } from '../../core/services/sales.service';
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
    InventoryMovementsComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private productsService = inject(ProductsService);
  private themeService = inject(ThemeService);

  isLoading = signal(true);

  // KPI data
  revenueToday = signal(0);
  salesToday = signal(0);
  lowStock = signal(0);
  outOfStock = signal(0);
  totalProducts = signal(0);

  // Recent data
  recentSales = signal<Sale[]>([]);
  recentMovements = signal<InventoryMovement[]>([]);

  // Chart data
  chartOptions = signal<any>(null);

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
    const todayStr = new Date().toISOString().split('T')[0];

    forkJoin({
      salesToday: this.salesService.getSales(1, 100, { startDate: todayStr }),
      recentSales: this.salesService.getSales(1, 6),
      stockSummary: this.inventoryService.getStockSummary(),
      recentMovements: this.inventoryService.getMovements(1, 6),
      products: this.productsService.getProducts(1, 1),
      revenueReport: this.salesService.getDailyRevenueReport(7),
    }).subscribe({
      next: ({ salesToday, recentSales, stockSummary, recentMovements, products, revenueReport }) => {
        // Sales today
        const completedToday = (salesToday.data ?? []).filter((s: Sale) => s.status === 'COMPLETED');
        this.salesToday.set(completedToday.length);
        this.revenueToday.set(completedToday.reduce((sum: number, s: Sale) => sum + s.total, 0));

        // Recent sales
        this.recentSales.set(recentSales.data ?? []);

        // Stock summary
        this.lowStock.set(stockSummary.stock.lowStock);
        this.outOfStock.set(stockSummary.stock.outOfStock);
        this.totalProducts.set(stockSummary.stock.total);

        // Recent movements
        this.recentMovements.set(recentMovements.data ?? []);

        // Products total from meta
        if (products.meta?.total) {
          this.totalProducts.set(products.meta.total);
        }

        // Setup Chart
        if (revenueReport && (revenueReport as any).data) {
          this.setupChart((revenueReport as any).data);
        }

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  private setupChart(data: { date: string; revenue: number }[]): void {
    const categories = data.map(d => {
      const date = new Date(d.date);
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const series = data.map(d => d.revenue);

    this.chartOptions.set({
      series: [{
        name: 'Revenue',
        data: series
      }],
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'inherit',
        background: 'transparent'
      },
      theme: {
        mode: this.themeService.theme()
      },
      colors: ['#3b82f6'], // Primary blue
      dataLabels: { enabled: false },
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: '#94a3b8',
            fontSize: '12px'
          },
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100]
        }
      },
      tooltip: {
        theme: this.themeService.theme(),
        y: {
          formatter: (val: number) => this.formatCurrency(val)
        }
      },
      grid: {
        borderColor: this.themeService.theme() === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0',
        strokeDashArray: 4,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      }
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
