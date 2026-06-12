
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MODAL_DATA, MODAL_REF, ModalRef, UiButtonComponent, UiInputFieldComponent } from '@shared/ui';
import { CreateMovementDto, MovementType } from '../../../../core/models/inventory.model';
import { Product } from '../../../../core/models/product.model';
import { InventoryService } from '../../../../core/services/inventory.service';

@Component({
    selector: 'app-add-movement-modal',
    standalone: true,
    imports: [ReactiveFormsModule, UiButtonComponent, UiInputFieldComponent],
    templateUrl: './add-movement-modal.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './add-movement-modal.component.scss',
})
export class AddMovementModalComponent implements OnInit {
    private modalRef = inject(MODAL_REF) as ModalRef<boolean>;
    private modalData = inject(MODAL_DATA) as { products: Product[] };
    private inventoryService = inject(InventoryService);
    private fb = inject(FormBuilder);

    form!: FormGroup;
    isLoading = signal(false);
    errorMessage = signal('');

    readonly movementTypes: { value: MovementType; label: string }[] = [
        { value: 'ENTRY', label: 'Entry (Stock In)' },
        { value: 'EXIT', label: 'Exit (Stock Out)' },
        { value: 'ADJUSTMENT', label: 'Adjustment (Set Stock)' },
        { value: 'RETURN', label: 'Return' },
    ];

    get products(): Product[] {
        return this.modalData?.products ?? [];
    }

    ngOnInit(): void {
        this.form = this.fb.group({
            productId: ['', Validators.required],
            type: ['ENTRY', Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            reference: [''],
        });
    }

    onSubmit(): void {
        if (this.form.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const dto: CreateMovementDto = {
            productId: this.form.value.productId,
            type: this.form.value.type,
            quantity: Number(this.form.value.quantity),
            reference: this.form.value.reference || undefined,
        };

        this.inventoryService.createMovement(dto).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.modalRef.close(true);
            },
            error: (err) => {
                this.errorMessage.set(err.error?.message || 'Failed to create movement');
                this.isLoading.set(false);
            },
        });
    }

    dismiss(): void {
        this.modalRef.dismiss();
    }
}
