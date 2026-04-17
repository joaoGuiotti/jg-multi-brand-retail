import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReturnsStore } from '../../store/returns.store';
import { Sale, SaleItem } from '../../../../core/models/sale.model';
import { ReturnItemCondition } from '../../../../core/models/return.model';

import { UiButtonComponent, UiCardComponent } from '@shared/ui';

@Component({
  selector: 'app-return-item-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiCardComponent],
  templateUrl: './return-item-selector.component.html',
})
export class ReturnItemSelectorComponent {
  @Input({ required: true }) sale!: Sale;
  protected store = inject(ReturnsStore);

  isItemSelected(productId: string): boolean {
    return this.store.selectedItems().some((i) => i.productId === productId);
  }

  getItemSelected(productId: string) {
    return this.store.selectedItems().find((i) => i.productId === productId);
  }

  toggleItem(item: SaleItem): void {
    this.store.toggleItem(
      item.productId, 
      item.product?.name ?? 'Produto Desconhecido', 
      item.product?.sku ?? '', 
      item.quantity, 
      item.unitPrice, 
      'GOOD'
    );
  }

  updateQuantity(productId: string, quantity: number, max: number): void {
    const validQty = Math.max(1, Math.min(quantity, max));
    this.store.updateItemQuantity(productId, validQty);
  }

  updateCondition(productId: string, condition: ReturnItemCondition): void {
    this.store.updateItemCondition(productId, condition);
  }
}
