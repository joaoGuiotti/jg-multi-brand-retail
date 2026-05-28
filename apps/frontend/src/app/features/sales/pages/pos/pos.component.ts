import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UiAutocompleteComponent, UiBadgeComponent, UiButtonComponent, UiCardComponent, UiDocumentPipe, UiModalService, UiNumberPipe, UiPageHeaderComponent } from '@shared/ui';
import { Customer } from '../../../../core/models/customer.model';
import { Product } from '../../../../core/models/product.model';
import { CustomersService } from '../../../../core/services/customers.service';
import { ProductsService } from '../../../../core/services/products.service';
import { CartStore } from '../../store/cart.store';
import { LoyaltyStore } from '../../../loyalty/store/loyalty.store';
import { LoyaltyBadgeComponent } from '../../../loyalty/components/loyalty-badge/loyalty-badge.component';
import { RedeemDialogComponent } from '../../../loyalty/components/redeem-dialog/redeem-dialog.component';
import { PaymentModalComponent, PaymentModalResult } from './payment-modal.component';

@Component({
    selector: 'app-pos',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        UiBadgeComponent, 
        UiButtonComponent, 
        UiCardComponent, 
        UiNumberPipe, 
        UiDocumentPipe, 
        UiAutocompleteComponent,
        LoyaltyBadgeComponent,
        UiPageHeaderComponent
    ],
    templateUrl: './pos.component.html',
    styleUrl: './pos.component.scss'
})
export class PosComponent {
    private productsService = inject(ProductsService);
    private customersService = inject(CustomersService);
    private modalService = inject(UiModalService);
    private router = inject(Router);
    cartStore = inject(CartStore);
    protected loyaltyStore = inject(LoyaltyStore);

    customerSearchTerm = '';
    customerSearchResults = signal<Customer[]>([]);
    isSearchingCustomer = signal(false);
    selectedCustomer = this.cartStore.selectedCustomer;

    searchTerm = '';
    searchResults = signal<Product[]>([]);
    isSearching = signal(false);

    constructor() {
        this.loyaltyStore.loadConfig();

        effect(() => {
            const customer = this.selectedCustomer();
            if (customer) {
                this.loyaltyStore.loadCustomerAccount(customer.id);
            } else {
                this.loyaltyStore.clearCustomer();
            }
        });
    }

    searchProducts(event?: { query: string }): void {
        const query = event ? event.query : this.searchTerm;
        const search = query && query.length >= 2 ? query : '';

        this.isSearching.set(true);
        this.productsService.getProducts(1, 20, { search, isActive: true }).subscribe({
            next: (response) => {
                this.searchResults.set(response.data);
                this.isSearching.set(false);
            },
            error: () => {
                this.isSearching.set(false);
            }
        });
    }

    searchCustomers(event?: { query: string }): void {
        const query = event ? event.query : this.customerSearchTerm;
        const search = query && query.length >= 2 ? query : '';

        this.isSearchingCustomer.set(true);
        this.customersService.getCustomers(1, 20, { search, isActive: true }).subscribe({
            next: (response) => {
                this.customerSearchResults.set(response.data);
                this.isSearchingCustomer.set(false);
            },
            error: () => {
                this.isSearchingCustomer.set(false);
            }
        });
    }

    selectCustomer(customer: Customer): void {
        this.cartStore.setCustomer(customer);
        this.customerSearchTerm = '';
        this.customerSearchResults.set([]);
    }

    removeCustomer(): void {
        this.cartStore.setCustomer(null);
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

    openRedeemModal(): void {
        const customer = this.selectedCustomer();
        if (!customer) return;

        const ref = this.modalService.open<any, number>(
            RedeemDialogComponent,
            {
                title: 'Resgatar Cashback',
                closable: true,
                data: {
                    cartSubtotal: this.cartStore.total(),
                    customerId: customer.id
                },
                maxWidth: '480px',
                zIndex: 1010
            }
        );

        ref.afterClosed().subscribe((pointsToRedeem) => {
            if (pointsToRedeem && pointsToRedeem > 0) {
                this.loyaltyStore.setPointsToRedeem(pointsToRedeem);
            }
        });
    }

    get totalToPay(): number {
        return Math.max(0, this.cartStore.total() - this.loyaltyStore.discountApplied());
    }

    openPaymentModal(): void {
        if (this.cartStore.itemCount() === 0) {
            alert('Cart is empty');
            return;
        }

        const discount = this.loyaltyStore.discountApplied();
        const totalToPay = this.totalToPay;

        const ref = this.modalService.open<{ total: number }, PaymentModalResult>(
            PaymentModalComponent,
            {
                title: 'Process Payment',
                closable: true,
                data: { total: totalToPay },
                maxWidth: '480px',
                zIndex: 1000,
            }
        );

        // Inject the ModalRef into the content component after creation
        // The component's modalRef property is set by the service via setInput
        ref.afterClosed()
            .subscribe((result) => {
                if (result?.invoiceNumber) {
                    alert(`Venda finalizada! Cupom: ${result.invoiceNumber}`);
                }
            })
    }

    clearCart(): void {
        if (confirm('Clear cart?')) {
            this.cartStore.clearCart();
        }
    }
}
