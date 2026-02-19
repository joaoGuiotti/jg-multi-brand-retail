import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { UiBadgeComponent, UiButtonComponent, UiCardComponent } from '@shared/ui';
import { Sale, SaleFilter } from '../../../../core/models/sale.model';
import { SalesService } from '../../../../core/services/sales.service';

@Component({
    selector: 'app-sales-history',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UiButtonComponent, UiBadgeComponent, UiCardComponent],
    templateUrl: './sales-history.component.html',
    styleUrl: './sales-history.component.scss'
})
export class SalesHistoryComponent implements OnInit {
    sales = signal<Sale[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');

    // Pagination
    currentPage = signal(1);
    totalPages = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    selectedStatus: 'PENDING' | 'COMPLETED' | 'CANCELLED' | '' = '';
    startDate = '';
    endDate = '';

    // Expose Math to template
    Math = Math;

    constructor(
        private salesService: SalesService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadSales();
    }

    loadSales(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        const filter: SaleFilter = {
            status: this.selectedStatus || undefined,
            startDate: this.startDate || undefined,
            endDate: this.endDate || undefined
        };

        this.salesService.getSales(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response) => {
                this.sales.set(response.data);
                this.totalItems.set(response.meta.total);
                this.totalPages.set(Math.ceil(response.meta.total / this.pageSize));
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set(error.error?.message || 'Failed to load sales');
                this.isLoading.set(false);
            }
        });
    }

    onFilterChange(): void {
        this.currentPage.set(1);
        this.loadSales();
    }

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.loadSales();
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.loadSales();
        }
    }

    viewSale(id: string): void {
        this.router.navigate(['/sales', id]);
    }

    getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
        switch (status) {
            case 'COMPLETED': return 'success';
            case 'PENDING': return 'warning';
            case 'CANCELLED': return 'error';
            default: return 'default';
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }
}
