import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoyaltyService } from '../../services/loyalty.service';
import { LoyaltyProgram } from '../../models/loyalty.model';
import { ToastService } from '../../../../shared/ui/services/toast/toast.service';
import { UiButtonComponent, UiCardComponent, UiInputFieldComponent, UiPageHeaderComponent } from '@shared/ui';

@Component({
  selector: 'app-loyalty-config',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiCardComponent,
    UiInputFieldComponent,
    UiPageHeaderComponent
  ],
  templateUrl: './loyalty-config.component.html',
  styleUrl: './loyalty-config.component.scss'
})
export class LoyaltyConfigComponent implements OnInit {
  private fb = inject(FormBuilder);
  private loyaltyService = inject(LoyaltyService);
  private toastService = inject(ToastService);

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);

  configForm: FormGroup = this.fb.group({
    active: [false],
    pointsPerReal: [1.00, [Validators.required, Validators.min(0.01)]],
    redeemRatio: [0.01, [Validators.required, Validators.min(0.0001), Validators.max(1)]],
    minRedeemPoints: [100, [Validators.required, Validators.min(1)]],
    maxDiscountPct: [50.00, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading.set(true);
    this.loyaltyService.getConfig().subscribe({
      next: (config: LoyaltyProgram) => {
        this.configForm.patchValue({
          active: config.active,
          pointsPerReal: config.pointsPerReal,
          redeemRatio: config.redeemRatio,
          minRedeemPoints: config.minRedeemPoints,
          maxDiscountPct: config.maxDiscountPct
        });
        this.isLoading.set(false);
      },
      error: (err) => {
        this.toastService.show({
          type: 'error',
          title: 'Erro de Carregamento',
          message: 'Não foi possível carregar as configurações do programa de fidelidade.',
          duration: 5000
        });
        this.isLoading.set(false);
      }
    });
  }

  onSubmit(): void {
    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      this.toastService.show({
        type: 'warning',
        title: 'Formulário Inválido',
        message: 'Por favor, corrija os erros no formulário antes de salvar.',
        duration: 4000
      });
      return;
    }

    this.isSaving.set(true);
    const formValue = this.configForm.value;

    const payload: LoyaltyProgram = {
      pointsPerReal: Number(formValue.pointsPerReal),
      redeemRatio: Number(formValue.redeemRatio),
      minRedeemPoints: Math.floor(Number(formValue.minRedeemPoints)),
      maxDiscountPct: Number(formValue.maxDiscountPct),
      active: Boolean(formValue.active)
    };

    this.loyaltyService.saveConfig(payload).subscribe({
      next: (saved: LoyaltyProgram) => {
        this.toastService.show({
          type: 'success',
          title: 'Configurações Salvas',
          message: 'As regras do programa de fidelidade foram atualizadas com sucesso.',
          duration: 4000
        });
        this.isSaving.set(false);
      },
      error: (err) => {
        this.toastService.show({
          type: 'error',
          title: 'Erro ao Salvar',
          message: err.error?.message || 'Falha ao salvar as configurações de fidelidade.',
          duration: 5000
        });
        this.isSaving.set(false);
      }
    });
  }
}
