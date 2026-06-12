
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
    TableColumn,
    TableConfig,
    TableSort,
    UiBadgeComponent,
    UiButtonComponent,
    UiCardComponent,
    UiModalService,
    UiPageHeaderComponent,
    UiTableColumnDirective,
    UiTableComponent
} from '@shared/ui';
import { InventoryFilter, InventoryMovement, MovementType, StockSummary } from '../../../../core/models/inventory.model';
import { Product } from '../../../../core/models/product.model';
import { InventoryService } from '../../../../core/services/inventory.service';
import { ProductsService } from '../../../../core/services/products.service';
import { AddMovementModalComponent } from '../../components/add-movement-modal/add-movement-modal.component';

@Component({
    selector: 'app-inventory-list',
    standalone: true,
    imports: [
    FormsModule,
    UiButtonComponent,
    UiBadgeComponent,
    UiCardComponent,
    UiTableComponent,
    UiPageHeaderComponent,
    UiTableColumnDirective
],
    templateUrl: './inventory-list.component.html',
    styleUrl: './inventory-list.component.scss',
})
export class InventoryListComponent implements OnInit {
    movements = signal<InventoryMovement[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');
    summary = signal<StockSummary | null>(null);
    products = signal<Product[]>([]);

    // Pagination
    currentPage = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    selectedType = signal<MovementType | ''>('');
    selectedProductId = signal('');
    startDate = signal('');
    endDate = signal('');
    currentSort = signal<TableSort | null>(null);

    readonly movementTypes: MovementType[] = ['ENTRY', 'EXIT', 'ADJUSTMENT', 'RETURN'];

    columns: TableColumn[] = [
        { key: 'createdAt', label: 'Date', sortable: true },
        { key: 'type', label: 'Type' },
        { key: 'product', label: 'Product', sortable: false },
        { key: 'quantity', label: 'Quantity' },
        { key: 'reference', label: 'Reference', sortable: false },
    ];

    tableConfig = computed<TableConfig>(() => ({
        stripedRow: true,
        dragColumn: true,
        loading: this.isLoading(),
        sortable: true,
        pagination: {
            enabled: true,
            pageSize: this.pageSize,
            totalItems: this.totalItems(),
            currentPage: this.currentPage(),
        },
        rowIdKey: 'id',
    }));

    constructor(
        private inventoryService: InventoryService,
        private productsService: ProductsService,
        private modalService: UiModalService,
    ) { }

    ngOnInit(): void {
        this.loadSummary();
        this.loadMovements();
        this.loadProducts();
    }

    loadSummary(): void {
        this.inventoryService.getStockSummary().subscribe({
            next: (data) => this.summary.set(data),
            error: () => { },
        });
    }

    loadProducts(): void {
        this.productsService.getProducts(1, 200).subscribe({
            next: (res) => this.products.set(res.data),
            error: () => { },
        });
    }

    loadMovements(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        const filter: InventoryFilter = {
            type: (this.selectedType() as MovementType) || undefined,
            productId: this.selectedProductId() || undefined,
            startDate: this.startDate() || undefined,
            endDate: this.endDate() || undefined,
            sortBy: this.currentSort()?.column as string,
            sortOrder: this.currentSort()?.direction as 'asc' | 'desc',
        };

        this.inventoryService.getMovements(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response) => {
                this.movements.set(response.data);
                this.totalItems.set(response?.meta?.total ?? 0);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set(error.error?.message || 'Failed to load movements');
                this.isLoading.set(false);
            },
        });
    }

    onFilterChange(): void {
        this.currentPage.set(1);
        this.loadMovements();
    }

    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadMovements();
    }

    onSortChange(sort: TableSort): void {
        this.currentSort.set(sort.direction === 'none' ? null : sort);
        this.loadMovements();
    }

    openAddMovement(): void {
        this.modalService
            .open(AddMovementModalComponent, {
                title: 'ADD MOVEMENT',
                data: { products: this.products() },
                minWidth: '480px',
            })
            .afterClosed()
            .subscribe((result) => {
                if (result) {
                    this.loadSummary();
                    this.loadMovements();
                }
            })
    }

    getProduct(productId: string): Product | undefined {
        return this.products().find((p) => p.id === productId);
    }

    getMovementEntries(): { key: MovementType; value: number }[] {
        const s = this.summary();
        if (!s) return [];
        return Object.entries(s.recentMovements).map(([key, value]) => ({
            key: key as MovementType,
            value: value as number,
        }));
    }

    getTypeVariant(type: MovementType): 'success' | 'warning' | 'error' | 'info' | 'default' {
        switch (type) {
            case 'ENTRY': return 'success';
            case 'EXIT': return 'error';
            case 'ADJUSTMENT': return 'warning';
            case 'RETURN': return 'info';
        }
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return (
            date.toLocaleDateString('pt-BR') +
            ' ' +
            date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        );
    }

    isDownloadingReport = signal(false);

    downloadReport(): void {
        this.isDownloadingReport.set(true);
        this.inventoryService
            .getReport({
                startDate: this.startDate() || undefined,
                endDate: this.endDate() || undefined,
                type: (this.selectedType() as string) || undefined,
                productId: this.selectedProductId() || undefined,
            })
            .subscribe({
                next: (blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                    this.isDownloadingReport.set(false);
                },
                error: () => this.isDownloadingReport.set(false),
            });
    }
}
