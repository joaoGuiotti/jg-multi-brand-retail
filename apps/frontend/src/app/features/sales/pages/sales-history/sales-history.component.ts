import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { TableColumn, TableConfig, TableSort, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiNumberPipe, UiTableColumnDirective, UiTableComponent } from '@shared/ui';
import { Sale, SaleFilter } from '../../../../core/models/sale.model';
import { SalesService } from '../../../../core/services/sales.service';

@Component({
    selector: 'app-sales-history',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UiButtonComponent, UiBadgeComponent, UiCardComponent, UiTableComponent, UiTableColumnDirective, UiNumberPipe],
    templateUrl: './sales-history.component.html',
    styleUrl: './sales-history.component.scss'
})
export class SalesHistoryComponent implements OnInit {
    sales = signal<Sale[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');

    // Pagination
    currentPage = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    selectedStatus = signal<'PENDING' | 'COMPLETED' | 'CANCELLED' | ''>('');
    startDate = signal('');
    endDate = signal('');
    currentSort = signal<TableSort | null>(null);
    columns: TableColumn[] = [
        { key: 'invoiceNumber', label: 'Invoice' },
        { key: 'createdAt', label: 'Date', type: 'date' },
        { key: 'items', label: 'Items', sortable: false },
        { key: 'total', label: 'Total', type: 'currency' },
        { key: 'status', label: 'Status' },
        { key: 'actions', label: 'Actions', width: '150px', sortable: false }
    ];

    tableConfig = computed<TableConfig>(() => ({
        stripedRow: true,
        loading: this.isLoading(),
        sortable: true,
        pagination: {
            enabled: true,
            pageSize: this.pageSize,
            totalItems: this.totalItems(),
            currentPage: this.currentPage()
        },
        rowIdKey: 'id'
    }));

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
            status: (this.selectedStatus() as any) || undefined,
            startDate: this.startDate() || undefined,
            endDate: this.endDate() || undefined,
            sortBy: this.currentSort()?.column as string,
            sortOrder: this.currentSort()?.direction as 'asc' | 'desc'
        };

        this.salesService.getSales(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response) => {
                this.sales.set(response.data);
                this.totalItems.set(response?.meta?.total!);
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

    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadSales();
    }

    onSortChange(sort: TableSort): void {
        this.currentSort.set(sort.direction === 'none' ? null : sort);
        this.loadSales();
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
