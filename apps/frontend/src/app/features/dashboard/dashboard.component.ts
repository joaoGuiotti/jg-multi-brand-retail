import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UiBadgeComponent, UiButtonComponent, UiCardComponent } from '@shared/ui';
import { forkJoin } from 'rxjs';
import { InventoryMovement, MovementType } from '../../core/models/inventory.model';
import { Sale } from '../../core/models/sale.model';
import { InventoryService } from '../../core/services/inventory.service';
import { ProductsService } from '../../core/services/products.service';
import { SalesService } from '../../core/services/sales.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, UiCardComponent, UiBadgeComponent, UiButtonComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private salesService = inject(SalesService);
  private inventoryService = inject(InventoryService);
  private productsService = inject(ProductsService);

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

  ngOnInit(): void {
    const todayStr = new Date().toISOString().split('T')[0];

    forkJoin({
      salesToday: this.salesService.getSales(1, 100, { startDate: todayStr }),
      recentSales: this.salesService.getSales(1, 6),
      stockSummary: this.inventoryService.getStockSummary(),
      recentMovements: this.inventoryService.getMovements(1, 6),
      products: this.productsService.getProducts(1, 1),
    }).subscribe({
      next: ({ salesToday, recentSales, stockSummary, recentMovements, products }) => {
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

        // Products total from meta (overrides stock summary count)
        if (products.meta?.total) {
          this.totalProducts.set(products.meta.total);
        }

        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  formatDate(dateString: string): string {
    const d = new Date(dateString);
    return (
      d.toLocaleDateString('pt-BR') +
      ' ' +
      d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    );
  }

  getSaleStatusVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'PENDING': return 'warning';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  }

  getMovementVariant(type: MovementType): 'success' | 'error' | 'warning' | 'info' {
    switch (type) {
      case 'ENTRY': return 'success';
      case 'EXIT': return 'error';
      case 'ADJUSTMENT': return 'warning';
      case 'RETURN': return 'info';
    }
  }
}
