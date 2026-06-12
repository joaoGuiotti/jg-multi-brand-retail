import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDropList } from '@angular/cdk/drag-drop';

import { Component, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, ToastService, UiButtonComponent, UiPageHeaderComponent } from '@shared/ui';
import { NgApexchartsModule } from 'ng-apexcharts';
import { WidgetId } from '../../core/models/dashboard-layout.model';
import { DashboardLayoutService } from '../../core/services/dashboard-layout.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardEditToolbarComponent } from './components/dashboard-edit-toolbar/dashboard-edit-toolbar.component';
import { InventoryMovementsComponent } from './components/inventory-movements/inventory-movements.component';
import { KpiCardsComponent } from './components/kpi-cards/kpi-cards.component';
import { QuickActionsComponent } from './components/quick-actions/quick-actions.component';
import { RecentSalesComponent } from './components/recent-sales/recent-sales.component';
import { RevenueChartComponent } from './components/revenue-chart/revenue-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    NgApexchartsModule,
    QuickActionsComponent,
    KpiCardsComponent,
    RevenueChartComponent,
    RecentSalesComponent,
    InventoryMovementsComponent,
    UiPageHeaderComponent,
    UiButtonComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    DashboardEditToolbarComponent
],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  providers: [DashboardService],
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  public dashboardService = inject(DashboardService);
  public layoutService = inject(DashboardLayoutService);
  private themeService = inject(ThemeService);
  private toastService = inject(ToastService);

  isLoading = this.dashboardService.isLoading;
  connectionState = this.dashboardService.connectionState;
  isStale = this.dashboardService.isStale;

  // Layout State
  widgetOrder = this.layoutService.widgetOrder;
  isEditMode = this.layoutService.isEditMode;
  isSaving = signal<boolean>(false);

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
    this.layoutService.loadLayout();
    this.dashboardService.loadSnapshot();
    this.dashboardService.connectSSE();
    this.dashboardService.startChartAutoRefresh();
  }

  // Layout Actions
  enterEditMode() {
    this.layoutService.enterEditMode();
  }

  cancelEditMode() {
    this.layoutService.cancelEditMode();
  }

  saveLayout() {
    this.isSaving.set(true);
    // Fake delay to show loading state
    setTimeout(() => {
      const success = this.layoutService.saveLayout();
      this.isSaving.set(false);
      if (success) {
        this.toastService.success('Sucesso', 'Layout do dashboard salvo com sucesso!');
      } else {
        this.toastService.error('Erro', 'Não foi possível salvar o layout. Tente novamente.');
      }
    }, 500);
  }

  resetLayout() {
    if (this.layoutService.resetToDefault()) {
      this.toastService.success('Sucesso', 'Layout restaurado ao padrão.');
    }
  }

  onDrop(event: CdkDragDrop<WidgetId[]>) {
    this.layoutService.moveWidget(event);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }
}
