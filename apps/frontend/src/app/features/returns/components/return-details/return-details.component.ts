import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiNumberPipe,
  UiTableColumnDirective,
  UiTableComponent
} from '@shared/ui';
import {
  ReturnItem,
  ReturnOrder,
  ReturnStatus
} from '../../../../core/models/return.model';
import {
  ReturnsService
} from '../../../../core/services/returns.service';
import {
  TableColumn
} from '../../../../shared/ui/components/table/models/table.types';
import {
  MODAL_DATA,
  MODAL_REF,
  ModalRef
} from '../../../../shared/ui/services/modal/modal.types';

@Component({
  selector: 'app-return-details',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    UiBadgeComponent,
    UiCardComponent,
    UiTableComponent,
    UiTableColumnDirective,
    UiNumberPipe
  ],
  template: `
    <div class="p-1">
      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }
    
      @if (!loading() && returnOrder(); as order) {
        <div>
          <!-- Header Info -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <p class="text-content-secondary text-sm"> <b>ID:</b> {{ order.id }}</p>
            </div>
            <ui-badge [variant]="getStatusVariant(order.status)" [dot]="true">
              {{ order.status }}
            </ui-badge>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ui-card padding="sm" [shadow]="false" class="bg-surface-hover/50">
              <h3 class="text-sm font-semibold text-content-secondary uppercase mb-3 text-xs tracking-wider">Informações Gerais</h3>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm text-content-secondary">Venda:</span>
                  <span class="text-sm font-medium text-content">#{{ order.saleId }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-content-secondary">Data Solicitação:</span>
                  <span class="text-sm font-medium text-content">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-content-secondary">Tipo Reembolso:</span>
                  <span class="text-sm font-medium text-content">{{ order.refundType }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm text-content-secondary">Total Reembolso:</span>
                  <span class="text-sm font-bold text-primary">{{ order.totalRefund | uiNumber: { prefix: 'R$ ' } }}</span>
                </div>
              </div>
            </ui-card>
            <ui-card padding="sm" [shadow]="false" class="bg-surface-hover/50">
              <h3 class="text-sm font-semibold text-content-secondary uppercase mb-3 text-xs tracking-wider">Motivo</h3>
              <p class="text-sm text-content italic">
                {{ order.reason || 'Nenhum motivo fornecido.' }}
              </p>
            </ui-card>
          </div>
          <!-- Items Table -->
          <h3 class="font-semibold mb-4 text-content">Itens Devolvidos</h3>
          <ui-table
            [columns]="itemColumns"
            [dataSource]="order.items"
            [config]="{ pagination: { enabled: false } }">
            <div *uiTableColumn="'product'; let row">
              <div class="text-sm font-medium">{{ row.productId }}</div>
            </div>
            <div *uiTableColumn="'condition'; let row">
              <ui-badge [variant]="getConditionVariant(row.condition)" size="sm">
                {{ row.condition }}
              </ui-badge>
            </div>
            <div *uiTableColumn="'total'; let row">
              <span class="text-sm font-medium">{{ row.total | uiNumber: { prefix: 'R$ ' } }}</span>
            </div>
          </ui-table>
          <!-- Actions -->
          <div class="mt-8 pt-6 border-t border-outline flex flex-wrap gap-3 justify-end">
            <ui-button variant="secondary" (clicked)="close()">Fechar</ui-button>
            @if (order.status === 'REQUESTED') {
              <ui-button variant="danger" [loading]="actionLoading()" (clicked)="updateStatus('REJECTED')">
                Reprovar
              </ui-button>
              <ui-button variant="primary" [loading]="actionLoading()" (clicked)="updateStatus('APPROVED')">
                Aprovar Devolução
              </ui-button>
            }
            @if (order.status === 'APPROVED') {
              <ui-button variant="success"
                [loading]="actionLoading()" (clicked)="processRefund()">
                Processar Reembolso
              </ui-button>
            }
          </div>
        </div>
      }
    </div>
    `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    :host { display: block; }
  `]
})
export class ReturnDetailsComponent implements OnInit {
  private returnsService = inject(ReturnsService);
  private modalData = inject(MODAL_DATA);
  private modalRef = inject<ModalRef<boolean>>(MODAL_REF);

  returnOrder = signal<ReturnOrder | null>(null);
  loading = signal(true);
  actionLoading = signal(false);

  itemColumns: TableColumn<ReturnItem>[] = [
    { key: 'product', label: 'Produto' },
    { key: 'quantity', label: 'Qtd' },
    { key: 'unitPrice', label: 'Preço Un.', type: 'currency' },
    { key: 'condition', label: 'Condição' },
    { key: 'total', label: 'Total' }
  ];

  ngOnInit() {
    const data = this.modalData as { id: string };
    const id = data.id;
    if (id) {
      this.loadDetails(id);
    }
  }

  loadDetails(id: string) {
    this.loading.set(true);
    this.returnsService.getReturn(id).subscribe({
      next: (res) => {
        this.returnOrder.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  updateStatus(status: ReturnStatus) {
    const order = this.returnOrder();
    if (!order) return;

    this.actionLoading.set(true);
    this.returnsService.updateStatus(order.id, { status }).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.modalRef.close(true);
      },
      error: () => this.actionLoading.set(false)
    });
  }

  processRefund() {
    const order = this.returnOrder();
    if (!order) return;

    this.actionLoading.set(true);
    this.returnsService.processRefund(order.id).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.modalRef.close(true);
      },
      error: () => this.actionLoading.set(false)
    });
  }

  close() {
    this.modalRef.close();
  }

  getStatusVariant(status: ReturnStatus) {
    switch (status) {
      case 'REQUESTED': return 'warning';
      case 'APPROVED': return 'info';
      case 'REFUNDED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  }

  getConditionVariant(condition: string) {
    switch (condition) {
      case 'GOOD': return 'success';
      case 'DAMAGED': return 'warning';
      case 'DEFECTIVE': return 'error';
      default: return 'default';
    }
  }
}
