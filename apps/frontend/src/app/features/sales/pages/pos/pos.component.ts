import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiBadgeComponent, UiButtonComponent, UiNumberPipe } from '@shared/ui';
import { Product } from '../../../../core/models/product.model';
import { CreatePaymentDto } from '../../../../core/models/sale.model';
import { ProductsService } from '../../../../core/services/products.service';
import { SalesService } from '../../../../core/services/sales.service';
import { CartStore } from '../../store/cart.store';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, UiBadgeComponent, UiButtonComponent, UiNumberPipe],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.scss'
})
export class PosComponent {
    private productsService = inject(ProductsService);
    private salesService = inject(SalesService);
    private router = inject(Router);
    cartStore = inject(CartStore);

    searchTerm = '';
    searchResults = signal<Product[]>([]);
    isSearching = signal(false);
    showPaymentModal = signal(false);
    isProcessingSale = signal(false);
    errorMessage = signal('');

    // Payment modal
    selectedPaymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' = 'CASH';
    paymentAmount = 0;

    searchProducts(): void {
        if (!this.searchTerm || this.searchTerm.length < 2) {
            this.searchResults.set([]);
            return;
        }

        this.isSearching.set(true);
        this.productsService.getProducts(1, 20, { search: this.searchTerm, isActive: true }).subscribe({
            next: (response) => {
                this.searchResults.set(response.data);
                this.isSearching.set(false);
            },
            error: () => {
                this.isSearching.set(false);
            }
        });
    }

    addToCart(product: Product): void {
        if (product.stockQuantity <= 0) {
            alert('Product out of stock');
            return;
        }
        this.cartStore.addItem(product);
        this.searchTerm = '';
        this.searchResults.set([]);
    }

    removeFromCart(productId: string): void {
        this.cartStore.removeItem(productId);
    }

    updateQuantity(productId: string, quantity: number): void {
        this.cartStore.updateQuantity(productId, quantity);
    }

    incrementQuantity(productId: string): void {
        const item = this.cartStore.cartItems().find(i => i.product.id === productId);
        if (item) {
            this.updateQuantity(productId, item.quantity + 1);
        }
    }

    decrementQuantity(productId: string): void {
        const item = this.cartStore.cartItems().find(i => i.product.id === productId);
        if (item && item.quantity > 1) {
            this.updateQuantity(productId, item.quantity - 1);
        }
    }

    openPaymentModal(): void {
        if (this.cartStore.itemCount() === 0) {
            alert('Cart is empty');
            return;
        }
        this.paymentAmount = this.cartStore.total();
        this.showPaymentModal.set(true);
    }

    closePaymentModal(): void {
        this.showPaymentModal.set(false);
        this.errorMessage.set('');
    }

    processPayment(): void {
        if (this.paymentAmount < this.cartStore.total()) {
            this.errorMessage.set('Payment amount is less than total');
            return;
        }

        this.isProcessingSale.set(true);
        this.errorMessage.set('');

        const cartData = this.cartStore.getCartData();
        const payment: CreatePaymentDto = {
            method: this.selectedPaymentMethod,
            amount: this.paymentAmount
        };

        const saleData = {
            items: cartData.items,
            discount: cartData.discount,
            payments: [payment]
        };

        this.salesService.createSale(saleData).subscribe({
            next: (sale) => {
                this.cartStore.clearCart();
                this.closePaymentModal();
                this.isProcessingSale.set(false);
                alert(`Sale completed! Invoice: ${sale.invoiceNumber}`);
            },
            error: (error) => {
                this.errorMessage.set(error.error?.message || 'Failed to process sale');
                this.isProcessingSale.set(false);
            }
        });
    }

    clearCart(): void {
        if (confirm('Clear cart?')) {
            this.cartStore.clearCart();
        }
    }
}
