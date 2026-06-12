import { Component, Inject, OnInit, Optional, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MODAL_DATA, MODAL_REF, ModalRef, UiButtonComponent, UiCardComponent, UiHasRoleDirective, UiInputFieldComponent, UiPageHeaderComponent } from '@shared/ui';
import { ProductsService } from '../../../../core/services/products.service';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [ReactiveFormsModule, UiButtonComponent, UiCardComponent, UiInputFieldComponent, UiHasRoleDirective, UiPageHeaderComponent],
    templateUrl: './product-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './product-form.component.scss'
})
export class ProductFormComponent implements OnInit {
    productForm: FormGroup;
    isEditMode = false;
    productId: string | null = null;
    isLoading = false;
    errorMessage = '';
    isSubmitting = false;

    get isModal(): boolean {
        return this.modalRef !== null;
    }

    constructor(
        private fb: FormBuilder,
        private productsService: ProductsService,
        private router: Router,
        private route: ActivatedRoute,
        @Optional() @Inject(MODAL_REF) private modalRef: ModalRef,
        @Optional() @Inject(MODAL_DATA) private modalData: any
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
        if (this.isModal) {
            this.productId = this.modalData?.['id'];
        } else {
            this.productId = this.route.snapshot.paramMap.get('id');
        }
        if (this.productId) {
            this.isEditMode = true;
            this.loadProduct(this.productId);
        }
    }

    loadProduct(id: string): void {
        this.isLoading = true;
        this.productsService.getProduct(id).subscribe({
            next: ({ data }) => {
                this.productForm.patchValue({
                    name: data.name,
                    description: data.description,
                    sku: data.sku,
                    barcode: data.barcode,
                    costPrice: data.costPrice,
                    salePrice: data.salePrice,
                    stockQuantity: data.stockQuantity,
                    active: data.active
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
                        if (this.isModal) {
                            this.modalRef.close({ refresh: true });
                        } else {
                            this.router.navigate(['/products']);
                        }
                    },
                    error: (error) => {
                        this.errorMessage = error.error?.message || 'Failed to update product';
                        this.isSubmitting = false;
                    }
                });
            } else {
                this.productsService.createProduct(formValue).subscribe({
                    next: () => {
                        if (this.isModal) {
                            this.modalRef.close({ refresh: true });
                        } else {
                            this.router.navigate(['/products']);
                        }
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
        if (this.isModal) {
            this.modalRef.close();
        } else {
            this.router.navigate(['/products']);
        }
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
