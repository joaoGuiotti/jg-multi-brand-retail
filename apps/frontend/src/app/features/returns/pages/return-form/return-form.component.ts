import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UiButtonComponent, UiCardComponent, UiPageHeaderComponent, UiStepComponent, UiStepperComponent } from '@shared/ui';
import { IResponse } from '../../../../core/models/response-base';
import { RefundType, ReturnOrder } from '../../../../core/models/return.model';
import { Sale } from '../../../../core/models/sale.model';
import { ReturnsService } from '../../../../core/services/returns.service';
import { SalesService } from '../../../../core/services/sales.service';
import { ReturnItemSelectorComponent } from '../../components/return-item-selector/return-item-selector.component';
import { ReturnSummaryComponent } from '../../components/return-summary/return-summary.component';
import { ReturnsStore } from '../../store/returns.store';

@Component({
  selector: 'app-return-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ReturnItemSelectorComponent,
    ReturnSummaryComponent,
    UiButtonComponent,
    UiCardComponent,
    UiPageHeaderComponent,
    UiStepperComponent,
    UiStepComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './return-form.component.html',
})
export class ReturnFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private returnsService = inject(ReturnsService);
  protected store = inject(ReturnsStore);

  currentStep = signal<number>(1);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const saleId = this.route.snapshot.queryParamMap.get('saleId');
    if (!saleId) {
      this.router.navigate(['/sales']);
      return;
    }

    this.loadSale(saleId);
  }

  private loadSale(saleId: string): void {
    this.loading.set(true);
    this.salesService.getSale(saleId).subscribe({
      next: (response: IResponse<Sale>) => {
        if (response.data) {
          this.store.initWizard(response.data);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        this.error.set('Erro ao carregar venda. Tente novamente.');
        this.loading.set(false);
      },
    });
  }

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  onSubmit(): void {
    const dto = this.store.getSubmitDto();
    if (!dto) return;

    this.loading.set(true);
    this.returnsService.createReturn(dto).subscribe({
      next: (response: IResponse<ReturnOrder>) => {
        this.loading.set(false);
        this.router.navigate(['/returns']);
      },
      error: (err: any) => {
        this.error.set('Erro ao criar solicitação de devolução.');
        this.loading.set(false);
      },
    });
  }

  setRefundType(type: RefundType): void {
    this.store.setRefundType(type);
  }
}
