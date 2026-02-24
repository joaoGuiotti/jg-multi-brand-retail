import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, OnInit, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BadgeVariant, TableColumn, TableConfig, TableSort, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiNumberPipe, UiTableComponent } from '@shared/ui';
import { IResponse } from 'src/app/core/models/response-base';
import { Product, ProductFilter } from '../../../../core/models/product.model';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UiButtonComponent, UiCardComponent, UiBadgeComponent, UiNumberPipe, UiTableComponent],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit, AfterViewInit {
    @ViewChild('nameTemplate', { static: true }) nameTmpl!: TemplateRef<any>;
    @ViewChild('stockQuantityTemplate', { static: true }) stockTmpl!: TemplateRef<any>;
    @ViewChild('activeTemplate', { static: true }) activeTmpl!: TemplateRef<any>;
    @ViewChild('actionsTemplate', { static: true }) actionsTmpl!: TemplateRef<any>;

    products = signal<Product[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');

    // Pagination
    currentPage = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    searchTerm = '';
    showActiveOnly = true;
    showLowStockOnly = false;
    currentSort = signal<TableSort | null>(null);


    columns = signal<TableColumn[]>([
        { key: 'name', label: 'Product', type: 'template', sortable: true },
        { key: 'sku', label: 'SKU', sortable: true },
        { key: 'salePrice', label: 'Price', type: 'currency', sortable: true },
        { key: 'costPrice', label: 'Cost', type: 'currency' },
        { key: 'stockQuantity', label: 'Stock', type: 'template', sortable: true },
        { key: 'active', label: 'Status', type: 'template' },
        { key: 'actions', label: 'Actions', type: 'template', width: '150px' }
    ]);

    tableConfig = computed<TableConfig>(() => ({
        stripedRow: true,
        loading: this.isLoading(),
        pagination: {
            enabled: true,
            pageSize: this.pageSize,
            totalItems: this.totalItems(),
            currentPage: this.currentPage()
        },
        rowIdKey: 'id'
    }));

    ngAfterViewInit(): void {
        this.columns.update(cols => cols.map(col => {
            if (col.key === 'name') col.cellTemplate = this.nameTmpl;
            if (col.key === 'stockQuantity') col.cellTemplate = this.stockTmpl;
            if (col.key === 'active') col.cellTemplate = this.activeTmpl;
            if (col.key === 'actions') col.cellTemplate = this.actionsTmpl;
            return col;
        }));
    }

    constructor(
        private productsService: ProductsService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadProducts();
    }

    loadProducts(): void {
        this.isLoading.set(true);
        this.errorMessage.set('');

        const filter: ProductFilter = {
            search: this.searchTerm || undefined,
            isActive: this.showActiveOnly,
            lowStock: this.showLowStockOnly || undefined,
            sortBy: this.currentSort()?.column as string,
            sortOrder: this.currentSort()?.direction as 'asc' | 'desc'
        };

        this.productsService.getProducts(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response: IResponse<Product[]>) => {
                const { meta, data } = response;
                this.products.set(data);
                this.totalItems.set(meta?.total!);
                this.isLoading.set(false);
            },
            error: (error) => {
                this.errorMessage.set(error.error?.message || 'Failed to load products');
                this.isLoading.set(false);
            }
        });
    }

    onSearch(): void {
        this.currentPage.set(1);
        this.loadProducts();
    }

    onFilterChange(): void {
        this.currentPage.set(1);
        this.loadProducts();
    }


    onPageChange(page: number): void {
        this.currentPage.set(page);
        this.loadProducts();
    }

    onSortChange(sort: TableSort): void {
        this.currentSort.set(sort.direction === 'none' ? null : sort);
        this.loadProducts();
    }

    editProduct(id: string): void {
        this.router.navigate(['/products', id, 'edit']);
    }

    deleteProduct(id: string): void {
        if (confirm('Are you sure you want to delete this product?')) {
            this.productsService.deleteProduct(id).subscribe({
                next: () => {
                    this.loadProducts();
                },
                error: (error) => {
                    this.errorMessage.set(error.error?.message || 'Failed to delete product');
                }
            });
        }
    }

    getStockVariant(product: Product): BadgeVariant {
        if (product.stockQuantity <= 0) return 'error';
        if (product.stockQuantity <= 10) return 'warning';
        return 'success';
    }

    getStockLevelText(product: Product): string {
        if (product.stockQuantity <= 0) {
            return 'Out of Stock';
        } else if (product.stockQuantity <= 10) {
            return 'Low Stock';
        } else {
            return 'In Stock';
        }
    }

}
