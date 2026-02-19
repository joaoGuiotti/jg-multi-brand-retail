import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BadgeVariant, UiBadgeComponent, UiButtonComponent, UiCardComponent } from '@shared/ui';
import { Product, ProductFilter } from '../../../../core/models/product.model';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, UiButtonComponent, UiCardComponent, UiBadgeComponent],
    templateUrl: './product-list.component.html',
    styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
    products = signal<Product[]>([]);
    isLoading = signal(false);
    errorMessage = signal('');

    // Pagination
    currentPage = signal(1);
    totalPages = signal(1);
    totalItems = signal(0);
    pageSize = 10;

    // Filters
    searchTerm = '';
    showActiveOnly = true;
    showLowStockOnly = false;

    // Expose Math to template
    Math = Math;

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
            lowStock: this.showLowStockOnly || undefined
        };

        this.productsService.getProducts(this.currentPage(), this.pageSize, filter).subscribe({
            next: (response) => {
                this.products.set(response.data);
                this.totalItems.set(response.total);
                this.totalPages.set(response.totalPages);
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

    nextPage(): void {
        if (this.currentPage() < this.totalPages()) {
            this.currentPage.update(p => p + 1);
            this.loadProducts();
        }
    }

    previousPage(): void {
        if (this.currentPage() > 1) {
            this.currentPage.update(p => p - 1);
            this.loadProducts();
        }
    }

    goToPage(page: number): void {
        this.currentPage.set(page);
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

    getStockLevelClass(product: Product): string {
        if (product.stockQuantity <= 0) {
            return 'text-red-600 bg-red-50';
        } else if (product.stockQuantity <= 10) {
            return 'text-yellow-600 bg-yellow-50';
        } else {
            return 'text-green-600 bg-green-50';
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

    get pageNumbers(): number[] {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, this.currentPage() - Math.floor(maxVisible / 2));
        let end = Math.min(this.totalPages(), start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    }
}
