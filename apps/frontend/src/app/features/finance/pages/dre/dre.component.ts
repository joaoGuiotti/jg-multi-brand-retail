import { Component, computed, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiButtonComponent, UiBadgeComponent, UiCardComponent, UiPageHeaderComponent } from '@shared/ui';
import { FinanceService, DREStatement } from '../../services/finance.service';

@Component({
  selector: 'app-dre',
  standalone: true,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiBadgeComponent, UiCardComponent, UiPageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './dre.component.html',
})
export class DREComponent implements OnInit {
  month = new Date().getMonth() + 1;
  year = new Date().getFullYear();

  data = signal<DREStatement | null>(null);
  isLoading = signal(false);
  isDownloading = signal(false);

  readonly months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  grossMargin = computed(() => {
    const d = this.data();
    if (!d || d.grossRevenue === 0) return 0;
    return (d.grossProfit / d.grossRevenue) * 100;
  });

  netMargin = computed(() => {
    const d = this.data();
    if (!d || d.grossRevenue === 0) return 0;
    return (d.netProfit / d.grossRevenue) * 100;
  });

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.financeService.getDRE(this.month, this.year).subscribe({
      next: (res: DREStatement) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  onFilterChange() {
    this.loadData();
  }

  downloadPDF() {
    this.isDownloading.set(true);
    this.financeService.downloadDREPdf(this.month, this.year).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `DRE-${this.month}-${this.year}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.isDownloading.set(false);
      },
      error: () => {
        alert('Failed to download PDF');
        this.isDownloading.set(false);
      }
    });
  }
}
