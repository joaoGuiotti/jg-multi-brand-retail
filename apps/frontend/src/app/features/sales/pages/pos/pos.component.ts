import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ModalService, UiBadgeComponent, UiButtonComponent, UiNumberPipe } from '@shared/ui';
import { Product } from '../../../../core/models/product.model';
import { ProductsService } from '../../../../core/services/products.service';
import { CartStore } from '../../store/cart.store';
import { PaymentModalComponent, PaymentModalResult } from './payment-modal.component';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [CommonModule, FormsModule, UiBadgeComponent, UiButtonComponent, UiNumberPipe],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.scss'
})
export class PosComponent {
    private productsService = inject(ProductsService);
    private modalService = inject(ModalService);
    private router = inject(Router);
    cartStore = inject(CartStore);

    searchTerm = '';
    searchResults = signal<Product[]>([]);
    isSearching = signal(false);

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

        const ref = this.modalService.open<PaymentModalComponent, { total: number }, PaymentModalResult>(
            PaymentModalComponent,
            {
                title: 'Process Payment',
                closable: true,
                data: { total: this.cartStore.total() },
                maxWidth: '480px',
                zIndex: 1000,
            }
        );

        // Inject the ModalRef into the content component after creation
        // The component's modalRef property is set by the service via setInput
        ref.afterClosed()
            .then((result) => {
                if (result?.invoiceNumber) {
                    alert(`Sale completed! Invoice: ${result.invoiceNumber}`);
                }
            })
            .catch(() => {
                // dismissed — no action needed
            });
    }

    clearCart(): void {
        if (confirm('Clear cart?')) {
            this.cartStore.clearCart();
        }
    }
}
