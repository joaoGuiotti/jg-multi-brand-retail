import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  MODAL_DATA,
  MODAL_REF,
  ModalRef,
  TableColumn,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiLoadingComponent,
  UiNumberPipe,
  UiTableColumnDirective,
  UiTableComponent,
} from '@shared/ui';
import { finalize } from 'rxjs';
import { Sale } from '../../../../core/models/sale.model';
import { SalesService } from '../../../../core/services/sales.service';

@Component({
  selector: 'app-sale-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    UiBadgeComponent,
    UiCardComponent,
    UiLoadingComponent,
    UiTableComponent,
    UiTableColumnDirective,
    UiNumberPipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sale-detail-modal.component.html',
})
export class SaleDetailModalComponent implements OnInit {
  private modalRef = inject(MODAL_REF) as ModalRef<void>;
  readonly saleId = inject(MODAL_DATA) as string;
  private salesService = inject(SalesService);
  private router = inject(Router);

  sale = signal<Sale | null>(null);
  isLoading = signal(true);
  errorMessage = signal('');

  // Accordion state for multiple returns: record of returnId -> boolean
  expandedReturns = signal<Record<string, boolean>>({});

  // Consolidated total of all returns
  totalRefunded = computed(() => {
    const s = this.sale();
    if (!s || !s.returns || s.returns.length === 0) return 0;
    return s.returns.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
  });

  toggleReturnExpansion(returnId: string): void {
    const current = this.expandedReturns();
    this.expandedReturns.set({
      ...current,
      [returnId]: !this.isReturnExpanded(returnId),
    });
  }

  isReturnExpanded(returnId: string): boolean {
    const current = this.expandedReturns();
    // Default to expanded (true) if not toggled
    return current[returnId] !== undefined ? current[returnId] : true;
  }

  onPrint(): void {
    const sale = this.sale();
    if (!sale) return;

    this.salesService.getReceipt(sale.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `receipt-${sale.invoiceNumber || sale.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.errorMessage.set('Failed to download receipt');
      },
    });
  }

  columns: TableColumn[] = [
    { key: 'product.name', label: 'Product', sortable: true },
    { key: 'quantity', label: 'Qty', width: '80px', sortable: true },
    { key: 'unitPrice', label: 'Unit Price', type: 'currency', width: '120px', sortable: true },
    { key: 'total', label: 'Total', type: 'currency', width: '120px', sortable: true },
  ];

  returnItemColumns: TableColumn[] = [
    { key: 'productName', label: 'Produto', sortable: false },
    { key: 'quantity', label: 'Qtd', width: '70px', sortable: false },
    { key: 'unitPrice', label: 'Vl. Unitário', type: 'currency', width: '120px', sortable: false },
    { key: 'condition', label: 'Condição', width: '120px', sortable: false },
    { key: 'total', label: 'Total', type: 'currency', width: '120px', sortable: false },
  ];

  ngOnInit(): void {
    this.loadSaleDetails();
  }

  loadSaleDetails(): void {
    this.isLoading.set(true);
    this.salesService
      .getSale(this.saleId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.sale.set(response.data);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Failed to load sale details');
        },
      });
  }

  close(): void {
    this.modalRef.close();
  }

  hasPendingReturns(): boolean {
    const sale = this.sale();
    if (!sale || !sale.returns) return false;
    return sale.returns.some((r) => ['REQUESTED', 'APPROVED'].includes(r.status));
  }

  initiateReturn(): void {
    const sale = this.sale();
    if (!sale) return;
    this.close();
    this.router.navigate(['/returns/new'], { queryParams: { saleId: sale.id } });
  }

  getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  }

  getReturnStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
    switch (status) {
      case 'REFUNDED':
        return 'success';
      case 'APPROVED':
        return 'info';
      case 'REQUESTED':
      case 'PENDING':
        return 'warning';
      case 'REJECTED':
        return 'error';
      default:
        return 'default';
    }
  }

  getItemConditionVariant(condition?: string): 'success' | 'warning' | 'error' | 'default' {
    switch (condition) {
      case 'GOOD':
        return 'success';
      case 'DAMAGED':
        return 'warning';
      case 'DEFECTIVE':
        return 'error';
      default:
        return 'default';
    }
  }

  getItemConditionLabel(condition?: string): string {
    switch (condition) {
      case 'GOOD':
        return 'Bom Estado';
      case 'DAMAGED':
        return 'Avariado';
      case 'DEFECTIVE':
        return 'Defeito';
      default:
        return condition || 'Padrão';
    }
  }

  getRefundTypeLabel(type?: string): string {
    switch (type) {
      case 'STORE_CREDIT':
        return 'Crédito em Loja';
      case 'CASH_REFUND':
        return 'Estorno Financeiro';
      case 'EXCHANGE':
        return 'Troca de Produto';
      default:
        return type || 'Reembolso';
    }
  }
}
