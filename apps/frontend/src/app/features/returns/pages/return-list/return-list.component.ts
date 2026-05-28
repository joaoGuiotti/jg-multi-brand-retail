import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiModalService,
  UiNumberPipe,
  UiPageHeaderComponent,
  UiTableColumnDirective,
  UiTableComponent
} from '@shared/ui';
import {
  ReturnFilter,
  ReturnOrder,
  ReturnStatus
} from '../../../../core/models/return.model';
import {
  ReturnsService
} from '../../../../core/services/returns.service';
import { ReturnDetailsComponent } from '../../components/return-details/return-details.component';

@Component({
  selector: 'app-return-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiTableComponent,
    UiTableColumnDirective,
    UiCardComponent,
    UiButtonComponent,
    UiBadgeComponent,
    UiNumberPipe,
    UiPageHeaderComponent
  ],
  template: `
    <div class="mx-auto">
      <ui-page-header 
        title="Devoluções" 
        subtitle="Gerencie devoluções, reembolsos e trocas de forma eficiente.">
      </ui-page-header>

      <!-- Filters -->
      <ui-card [shadow]="true" padding="sm" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div class="space-y-1">
            <label class="label text-xs uppercase tracking-wider font-semibold opacity-70">Status</label>
            <select 
              [ngModel]="statusFilter()" 
              (ngModelChange)="onStatusChange($event)"
              class="input-field">
              <option value="">Todos os Status</option>
              <option value="REQUESTED">Solicitado (Pendente)</option>
              <option value="APPROVED">Aprovado</option>
              <option value="REFUNDED">Reembolsado</option>
              <option value="REJECTED">Reprovado</option>
            </select>
          </div>
          
          <div class="md:col-span-2"></div>

          <div class="flex justify-end px-2">
            <span class="text-xs text-content-secondary font-medium">
              Mostrando {{ returns().length }} de {{ totalItems() }} registros
            </span>
          </div>
        </div>
      </ui-card>

      <!-- Table -->
      <div class="min-h-[500px]">
        <ui-table 
          [columns]="columns" 
          [dataSource]="returns()" 
          [config]="tableConfig()"
          (pageChange)="onPageChange($event)">

          <!-- ID Column -->
          <div *uiTableColumn="'id'; let row">
            <span class="text-xs font-mono text-content-secondary">#{{ row.id.substring(0, 8) }}</span>
          </div>

          <!-- Sale Column -->
          <div *uiTableColumn="'saleId'; let row">
            <span class="text-sm font-medium">Venda {{ row.saleId.substring(0, 8) }}</span>
          </div>

          <!-- Date -->
          <div *uiTableColumn="'createdAt'; let row">
            <span class="text-xs text-content-secondary">
              {{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}
            </span>
          </div>

          <!-- Total -->
          <div *uiTableColumn="'totalRefund'; let row">
            <span class="text-sm font-bold text-primary">
              {{ row.totalRefund | uiNumber: { prefix: 'R$ ' } }}
            </span>
          </div>

          <!-- Status -->
          <div *uiTableColumn="'status'; let row">
            <ui-badge [variant]="getStatusVariant(row.status)" [dot]="true">
              {{ row.status }}
            </ui-badge>
          </div>

          <!-- Actions -->
          <div *uiTableColumn="'actions'; let row">
            <div class="flex justify-end">
              <ui-button variant="ghost" size="sm" (clicked)="viewDetails(row.id)">
                Gerenciar
                <svg class="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </ui-button>
            </div>
          </div>

        </ui-table>
      </div>
    </div>
  `
})
export class ReturnListComponent implements OnInit {
  private returnsService = inject(ReturnsService);
  private modalService = inject(UiModalService);

  returns = signal<ReturnOrder[]>([]);
  totalItems = signal(0);
  loading = signal(false);

  currentPage = signal(1);
  pageSize = signal(10);
  statusFilter = signal<ReturnStatus | ''>('');

  columns = [
    { key: 'id', label: 'ID' },
    { key: 'saleId', label: 'Venda' },
    { key: 'createdAt', label: 'Data Solicitação' },
    { key: 'refundType', label: 'Tipo' },
    { key: 'totalRefund', label: 'Valor' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', sortable: false }
  ];

  tableConfig = computed(() => ({
    loading: this.loading(),
    pagination: {
      enabled: true,
      pageSize: this.pageSize(),
      totalItems: this.totalItems(),
      currentPage: this.currentPage()
    },
    stripedRow: true
  }));

  ngOnInit() {
    this.loadReturns();
  }

  loadReturns() {
    this.loading.set(true);
    const filter: ReturnFilter = {};
    if (this.statusFilter()) {
      filter.status = this.statusFilter() as ReturnStatus;
    }

    this.returnsService.getReturns(
      this.currentPage(),
      this.pageSize(),
      filter
    ).subscribe({
      next: (res) => {
        this.returns.set(res.data);
        this.totalItems.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onStatusChange(status: ReturnStatus | '') {
    this.statusFilter.set(status);
    this.currentPage.set(1);
    this.loadReturns();
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadReturns();
  }

  viewDetails(id: string) {
    const ref = this.modalService.open(ReturnDetailsComponent, {
      data: { id },
      title: 'Detalhes da Devolução',
      maxWidth: '700px'
    });

    ref.afterClosed().subscribe(result => {
      if (result) {
        this.loadReturns();
      }
    });
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
}
