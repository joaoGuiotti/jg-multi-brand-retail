import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UiButtonComponent, UiCardComponent } from '@shared/ui';
import { Product } from '../../../../core/models/product.model';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiCardComponent],
    templateUrl: './product-form.component.html',
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
    productForm: FormGroup;
    isEditMode = false;
    productId: string | null = null;
    isLoading = false;
    errorMessage = '';
    isSubmitting = false;

    constructor(
        private fb: FormBuilder,
        private productsService: ProductsService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.productForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: [''],
            sku: ['', [Validators.required]],
            barcode: [''],
            costPrice: [0, [Validators.min(0)]],
            salePrice: [0, [Validators.required, Validators.min(0)]],
            stockQuantity: [0, [Validators.required, Validators.min(0)]],
            active: [true]
        });
    }

    ngOnInit(): void {
        this.productId = this.route.snapshot.paramMap.get('id');
        if (this.productId) {
            this.isEditMode = true;
            this.loadProduct(this.productId);
        }
    }

    loadProduct(id: string): void {
        this.isLoading = true;
        this.productsService.getProduct(id).subscribe({
            next: (product: Product) => {
                this.productForm.patchValue({
                    name: product.name,
                    description: product.description || '',
                    sku: product.sku,
                    barcode: product.barcode || '',
                    costPrice: product.costPrice,
                    salePrice: product.salePrice,
                    stockQuantity: product.stockQuantity,
                    active: product.active
                });
                this.isLoading = false;
            },
            error: (error) => {
                this.errorMessage = error.error?.message || 'Failed to load product';
                this.isLoading = false;
            }
        });
    }

    onSubmit(): void {
        if (this.productForm.valid) {
            this.isSubmitting = true;
            this.errorMessage = '';

            const formValue = this.productForm.value;

            if (this.isEditMode && this.productId) {
                this.productsService.updateProduct(this.productId, formValue).subscribe({
                    next: () => {
                        this.router.navigate(['/products']);
                    },
                    error: (error) => {
                        this.errorMessage = error.error?.message || 'Failed to update product';
                        this.isSubmitting = false;
                    }
                });
            } else {
                this.productsService.createProduct(formValue).subscribe({
                    next: () => {
                        this.router.navigate(['/products']);
                    },
                    error: (error) => {
                        this.errorMessage = error.error?.message || 'Failed to create product';
                        this.isSubmitting = false;
                    }
                });
            }
        }
    }

    cancel(): void {
        this.router.navigate(['/products']);
    }

    get name() { return this.productForm.get('name'); }
    get sku() { return this.productForm.get('sku'); }
    get salePrice() { return this.productForm.get('salePrice'); }
    get stockQuantity() { return this.productForm.get('stockQuantity'); }

    get calculatedMargin(): number {
        const salePrice = this.productForm.get('salePrice')?.value || 0;
        const costPrice = this.productForm.get('costPrice')?.value || 0;
        if (costPrice === 0) return 0;
        return ((salePrice - costPrice) / costPrice) * 100;
    }
}
