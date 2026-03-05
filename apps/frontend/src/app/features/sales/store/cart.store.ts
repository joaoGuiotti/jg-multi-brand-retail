import { Injectable, computed, signal } from '@angular/core';
import { Customer } from '../../../core/models/customer.model';
import { Product } from '../../../core/models/product.model';

export interface CartItem {
    product: Product;
    quantity: number;
    unitPrice: number;
    discount: number;
}

@Injectable({
    providedIn: 'root'
})
export class CartStore {
    private items = signal<CartItem[]>([]);
    private customer = signal<Customer | null>(null);

    // Read-only signals
    cartItems = this.items.asReadonly();
    selectedCustomer = this.customer.asReadonly();

    customerId = computed(() => this.customer()?.id || null);

    // Computed values
    itemCount = computed(() =>
        this.items().reduce((sum, item) => sum + item.quantity, 0)
    );

    subtotal = computed(() =>
        this.items().reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    );

    totalDiscount = computed(() =>
        this.items().reduce((sum, item) => sum + item.discount, 0)
    );

    total = computed(() => this.subtotal() - this.totalDiscount());

    // Actions
    addItem(product: Product, quantity = 1): void {
        const existingItem = this.items().find(item => item.product.id === product.id);

        if (existingItem) {
            this.updateQuantity(product.id, existingItem.quantity + quantity);
        } else {
            this.items.update(items => [...items, {
                product,
                quantity,
                unitPrice: product.salePrice,
                discount: 0
            }]);
        }
    }

    removeItem(productId: string): void {
        this.items.update(items => items.filter(item => item.product.id !== productId));
    }

    updateQuantity(productId: string, quantity: number): void {
        if (quantity <= 0) {
            this.removeItem(productId);
            return;
        }

        this.items.update(items =>
            items.map(item =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    }

    updateDiscount(productId: string, discount: number): void {
        this.items.update(items =>
            items.map(item =>
                item.product.id === productId
                    ? { ...item, discount }
                    : item
            )
        );
    }

    setCustomer(customer: Customer | null): void {
        this.customer.set(customer);
    }

    clearCart(): void {
        this.items.set([]);
        this.customer.set(null);
    }

    getCartData() {
        return {
            customerId: this.customer()?.id,
            items: this.items().map(item => ({
                productId: item.product.id,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount
            })),
            subtotal: this.subtotal(),
            discount: this.totalDiscount(),
            total: this.total()
        };
    }
}
