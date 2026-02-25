import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BadgeVariant, TableColumn, TableConfig, TableSort, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiNumberPipe, UiTableColumnDirective, UiTableComponent } from '@shared/ui';
import { IResponse } from 'src/app/core/models/response-base';
import { Product, ProductFilter } from '../../../../core/models/product.model';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UiButtonComponent, UiCardComponent, UiBadgeComponent, UiNumberPipe, UiTableComponent, UiTableColumnDirective],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {

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
        { key: 'name', label: 'Product' },
        { key: 'sku', label: 'SKU' },
        { key: 'salePrice', label: 'Price', type: 'currency' },
        { key: 'costPrice', label: 'Cost', type: 'currency' },
        { key: 'stockQuantity', label: 'Stock' },
        { key: 'active', label: 'Status' },
        { key: 'actions', label: 'Actions', width: '150px', sortable: false }
    ]);

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
