import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MODAL_DATA, MODAL_REF, ModalRef, UiButtonComponent, UiInputFieldComponent, UiNumberPipe } from '@shared/ui';
import { CreatePaymentDto } from '../../../../core/models/sale.model';
import { SalesService } from '../../../../core/services/sales.service';
import { CartStore } from '../../store/cart.store';

export interface PaymentModalData {
    total: number;
}

export interface PaymentModalResult {
    invoiceNumber: string;
}

@Component({
    selector: 'app-payment-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, UiButtonComponent, UiInputFieldComponent, UiNumberPipe],
    templateUrl: './payment-modal.component.html',
})
export class PaymentModalComponent {
    // ── Injected via child Injector (no @Input() needed) ─────────────────────
    private modalRef = inject(MODAL_REF) as ModalRef<PaymentModalResult>;
    readonly data = inject(MODAL_DATA) as PaymentModalData;

    // ── Services ──────────────────────────────────────────────────────────────
    private salesService = inject(SalesService);
    cartStore = inject(CartStore);

    // ── State ─────────────────────────────────────────────────────────────────
    selectedPaymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' = 'CASH';
    paymentAmount = this.data?.total ?? 0;
    isProcessing = false;
    errorMessage = '';

    get change(): number {
        return this.paymentAmount - this.cartStore.total();
    }

    processPayment(): void {
        if (this.paymentAmount < this.cartStore.total()) {
            this.errorMessage = 'Payment amount is less than total';
            return;
        }

        this.isProcessing = true;
        this.errorMessage = '';

        const cartData = this.cartStore.getCartData();
        const payment: CreatePaymentDto = {
            method: this.selectedPaymentMethod,
            amount: this.paymentAmount,
        };

        this.salesService
            .createSale({
                items: cartData.items,
                discount: cartData.discount,
                payments: [payment],
                customerId: cartData.customerId
            })
            .subscribe({
                next: (response) => {
                    this.cartStore.clearCart();
                    this.isProcessing = false;
                    this.modalRef.close({ invoiceNumber: response.data.invoiceNumber });
                },
                error: (error) => {
                    this.errorMessage = error.error?.message || 'Failed to process sale';
                    this.isProcessing = false;
                },
            });
    }

    cancel(): void {
        this.modalRef.dismiss('cancel');
    }
}
