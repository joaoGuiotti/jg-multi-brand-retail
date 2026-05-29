import { CommonModule } from '@angular/common';
import { Component, computed, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TableColumn,
  TableConfig,
  UiCardComponent,
  UiPageHeaderComponent,
  UiTableColumnDirective,
  UiTableComponent
} from '@shared/ui';
import { CashFlowStatement, FinanceService } from '../../services/finance.service';

@Component({
  selector: 'app-cash-flow',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiCardComponent,
    UiTableComponent,
    UiPageHeaderComponent,
    UiTableColumnDirective,
  ],
  templateUrl: './cash-flow.component.html',
})
export class CashFlowComponent implements OnInit {
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();

  data = signal<CashFlowStatement | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  columns: TableColumn[] = [
    { key: 'date', label: 'Date' },
    { key: 'inflows', label: 'Inflows (+)' },
    { key: 'outflows', label: 'Outflows (-)' },
    { key: 'balance', label: 'Daily Balance' },
  ];

  tableConfig = computed<TableConfig>(() => ({
    stripedRow: true,
    dragColumn: false,
    loading: this.isLoading(),
    sortable: false,
    pagination: { enabled: false },
    rowIdKey: 'date',
  }));

  constructor(private financeService: FinanceService) { }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.financeService.getCashFlow(this.month, this.year).subscribe({
      next: (res: CashFlowStatement) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.message);
        this.isLoading.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  }

  onFilterChange() {
    this.loadData();
  }
}
