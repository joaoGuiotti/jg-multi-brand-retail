import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MODAL_DATA, MODAL_REF, ModalRef, UiButtonComponent, UiInputFieldComponent } from '@shared/ui';
import { LoyaltyStore } from '../../store/loyalty.store';

export interface RedeemDialogData {
  cartSubtotal: number;
  customerId: string;
}

@Component({
  selector: 'app-redeem-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    UiButtonComponent,
    UiInputFieldComponent
  ],
  templateUrl: './redeem-dialog.component.html',
  styleUrl: './redeem-dialog.component.scss'
})
export class RedeemDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  protected store = inject(LoyaltyStore);
  private modalRef = inject(MODAL_REF) as ModalRef<number>;
  readonly modalData = inject(MODAL_DATA) as RedeemDialogData;

  redeemForm!: FormGroup;

  ngOnInit(): void {
    const config = this.store.config();
    const balance = this.store.currentBalance();

    // 1. Calcula o teto máximo de desconto em reais e o limite de pontos correspondente
    const maxDiscountAllowed = this.modalData.cartSubtotal * ((config?.maxDiscountPct || 50) / 100);
    const maxPointsAllowedByCeiling = Math.floor(maxDiscountAllowed / (config?.redeemRatio || 0.01));
    
    // O limite real é o menor entre o saldo do cliente e o teto da venda
    const absoluteMaxPoints = Math.min(balance, maxPointsAllowedByCeiling);

    this.redeemForm = this.fb.group({
      points: [
        absoluteMaxPoints, 
        [
          Validators.required, 
          Validators.min(config?.minRedeemPoints || 100), 
          Validators.max(balance)
        ]
      ]
    });
  }

  // Helper getters
  get pointsControl() {
    return this.redeemForm.get('points');
  }

  // Real-time values
  currentPoints = computed(() => {
    return Number(this.pointsControl?.value || 0);
  });

  equivalentDiscount = computed(() => {
    const ratio = this.store.config()?.redeemRatio || 0.01;
    return this.currentPoints() * ratio;
  });

  maxDiscount = computed(() => {
    const config = this.store.config();
    return this.modalData.cartSubtotal * ((config?.maxDiscountPct || 50) / 100);
  });

  isExceedingCeiling = computed(() => {
    return this.equivalentDiscount() > this.maxDiscount();
  });

  // Actions
  applyPreset(amountInReais: number): void {
    const config = this.store.config();
    const pointsNeeded = Math.floor(amountInReais / (config?.redeemRatio || 0.01));
    this.pointsControl?.setValue(pointsNeeded);
  }

  applyMaxPossible(): void {
    const config = this.store.config();
    const balance = this.store.currentBalance();
    
    // Teto de desconto em reais
    const maxDiscountAllowed = this.modalData.cartSubtotal * ((config?.maxDiscountPct || 50) / 100);
    // Pontos correspondentes a esse desconto
    const maxPointsByCeiling = Math.floor(maxDiscountAllowed / (config?.redeemRatio || 0.01));
    
    // O resgate máximo é o menor entre o saldo disponível e o teto de segurança
    const maxPoints = Math.min(balance, maxPointsByCeiling);
    this.pointsControl?.setValue(maxPoints);
  }

  onCancel(): void {
    this.modalRef.close(undefined);
  }

  onSubmit(): void {
    if (this.redeemForm.invalid) {
      this.pointsControl?.markAsTouched();
      return;
    }

    let points = Number(this.pointsControl?.value);
    
    // Se o desconto exceder o teto, aplica o cap automaticamente
    const config = this.store.config();
    const discount = points * (config?.redeemRatio || 0.01);
    const maxAllowed = this.maxDiscount();

    if (discount > maxAllowed) {
      points = Math.ceil(maxAllowed / (config?.redeemRatio || 0.01));
    }

    this.modalRef.close(points);
  }
}
