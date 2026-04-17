import { Injectable, computed, signal } from '@angular/core';
import { CreateReturnDto, CreateReturnItemDto, RefundType, ReturnItemCondition } from '../../../core/models/return.model';
import { Sale } from '../../../core/models/sale.model';

export interface ReturnWizardState {
  sale: Sale | null;
  items: CreateReturnItemDto[];
  refundType: RefundType;
  reason: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReturnsStore {
  private state = signal<ReturnWizardState>({
    sale: null,
    items: [],
    refundType: 'STORE_CREDIT',
    reason: '',
  });

  // Read-only signals
  wizardState = this.state.asReadonly();
  selectedSale = computed(() => this.state().sale);
  selectedItems = computed(() => this.state().items);

  // Computed totals
  totalRefund = computed(() => {
    const saleItems = this.state().sale?.items ?? [];
    return this.state().items.reduce((sum, item) => {
      const saleItem = saleItems.find((si) => si.productId === item.productId);
      return sum + (saleItem?.unitPrice ?? 0) * item.quantity;
    }, 0);
  });

  // Actions
  initWizard(sale: Sale): void {
    this.state.set({
      sale,
      items: [],
      refundType: 'STORE_CREDIT',
      reason: '',
    });
  }

  toggleItem(productId: string, productName: string, sku: string, quantity: number, unitPrice: number, condition: ReturnItemCondition): void {
    this.state.update((s) => {
      const existing = s.items.find((i) => i.productId === productId);
      if (existing) {
        return {
          ...s,
          items: s.items.filter((i) => i.productId !== productId),
        };
      } else {
        return {
          ...s,
          items: [...s.items, { productId, productName, sku, quantity, unitPrice, condition }],
        };
      }
    });
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const sale = this.state().sale;
    const saleItem = sale?.items.find(i => i.productId === productId);
    const maxQty = saleItem?.quantity ?? quantity;
    const validQty = Math.max(1, Math.min(quantity, maxQty));

    this.state.update((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, quantity: validQty } : i,
      ),
    }));
  }

  updateItemCondition(productId: string, condition: ReturnItemCondition): void {
    this.state.update((s) => ({
      ...s,
      items: s.items.map((i) =>
        i.productId === productId ? { ...i, condition } : i,
      ),
    }));
  }

  setRefundType(refundType: RefundType): void {
    this.state.update((s) => ({ ...s, refundType }));
  }

  setReason(reason: string): void {
    this.state.update((s) => ({ ...s, reason }));
  }

  resetWizard(): void {
    this.state.set({
      sale: null,
      items: [],
      refundType: 'STORE_CREDIT',
      reason: '',
    });
  }

  getSubmitDto(): CreateReturnDto | null {
    const s = this.state();
    if (!s.sale || s.items.length === 0) return null;

    return {
      saleId: s.sale.id,
      refundType: s.refundType,
      reason: s.reason,
      items: s.items,
    };
  }
}
