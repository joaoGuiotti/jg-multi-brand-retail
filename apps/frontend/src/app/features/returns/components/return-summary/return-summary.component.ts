import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReturnsStore } from '../../store/returns.store';

@Component({
  selector: 'app-return-summary',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './return-summary.component.html',
})
export class ReturnSummaryComponent {
  protected store = inject(ReturnsStore);

  getRefundTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      STORE_CREDIT: 'Crédito em Loja',
      CASH_REFUND: 'Reembolso em Dinheiro',
      EXCHANGE: 'Troca de Produto',
    };
    return labels[type] || type;
  }
}
