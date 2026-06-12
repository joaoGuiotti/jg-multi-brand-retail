import { Component, computed, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TableColumn,
  TableConfig,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiModalService,
  UiPageHeaderComponent,
  UiTableColumnDirective,
  UiTableComponent
} from '@shared/ui';
import { FinanceService, FinancialAccount, FinancialAccountStatus, FinancialAccountType } from '../../services/finance.service';
import { AccountFormComponent } from '../../components/account-form/account-form.component';

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiBadgeComponent,
    UiCardComponent,
    UiTableComponent,
    UiPageHeaderComponent,
    UiTableColumnDirective,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './account-list.component.html',
})
export class AccountListComponent implements OnInit {
  accounts = signal<FinancialAccount[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  selectedType: FinancialAccountType | '' = '';
  selectedStatus: FinancialAccountStatus | '' = '';
  
  columns: TableColumn[] = [
    { key: 'dueDate', label: 'Due Date', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount' },
    { key: 'type', label: 'Type' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: '', sortable: false },
  ];

  tableConfig = computed<TableConfig>(() => ({
    stripedRow: true,
    dragColumn: false,
    loading: this.isLoading(),
    sortable: true,
    pagination: { enabled: false },
    rowIdKey: 'id',
  }));

  constructor(
    private financeService: FinanceService,
    private modalService: UiModalService
  ) {}

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.isLoading.set(true);
    this.financeService.getAccounts({
      type: (this.selectedType as FinancialAccountType) || undefined,
      status: (this.selectedStatus as FinancialAccountStatus) || undefined
    }).subscribe({
      next: (data: FinancialAccount[]) => {
        this.accounts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message || 'Failed to load accounts');
        this.isLoading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.loadAccounts();
  }

  openAddAccount(): void {
    this.modalService.open(AccountFormComponent, {
      title: 'NEW ACCOUNT',
      minWidth: '480px'
    }).afterClosed().subscribe((res) => {
      if (res) this.loadAccounts();
    });
  }

  payAccount(account: FinancialAccount): void {
    if (confirm(`Mark ${account.description} as PAID?`)) {
      this.financeService.payAccount(account.id, { paidAt: new Date().toISOString() }).subscribe({
        next: () => this.loadAccounts(),
        error: (err) => alert(err.message || 'Failed to pay account')
      });
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  getTypeVariant(type: FinancialAccountType) {
    return type === 'RECEIVABLE' ? 'success' : 'error';
  }

  getStatusVariant(status: FinancialAccountStatus) {
    switch (status) {
      case 'PAID': return 'success';
      case 'OVERDUE': return 'error';
      case 'CANCELLED': return 'info';
      default: return 'warning';
    }
  }
}
