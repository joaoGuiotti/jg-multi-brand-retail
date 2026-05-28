import { Injectable, computed, inject, signal } from '@angular/core';
import { LoyaltyService, LoyaltyAccountResponse } from '../services/loyalty.service';
import { LoyaltyProgram } from '../models/loyalty.model';
import { tap } from 'rxjs';

export interface LoyaltyState {
  config: LoyaltyProgram | null;
  account: LoyaltyAccountResponse | null;
  pointsToRedeem: number;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class LoyaltyStore {
  private loyaltyService = inject(LoyaltyService);

  private state = signal<LoyaltyState>({
    config: null,
    account: null,
    pointsToRedeem: 0,
    loading: false,
    error: null,
  });

  // Read-only signals
  config = computed(() => this.state().config);
  account = computed(() => this.state().account);
  pointsToRedeem = computed(() => this.state().pointsToRedeem);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  // Computed values
  currentBalance = computed(() => this.state().account?.balance ?? 0);
  isProgramActive = computed(() => this.state().config?.active ?? false);
  
  // Calculate discount based on pointsToRedeem and redeemRatio
  discountApplied = computed(() => {
    const ratio = this.state().config?.redeemRatio ?? 0;
    return this.state().pointsToRedeem * ratio;
  });

  // Calculate maximum points customer could possibly redeem based on balance and minRedeemPoints
  canRedeem = computed(() => {
    const balance = this.currentBalance();
    const minPoints = this.state().config?.minRedeemPoints ?? 0;
    const active = this.isProgramActive();
    return active && balance >= minPoints;
  });

  // Actions
  loadConfig(): void {
    this.loyaltyService.getConfig().subscribe({
      next: (config) => {
        this.state.update((s) => ({ ...s, config }));
      },
      error: (err) => {
        this.state.update((s) => ({ ...s, error: 'Erro ao carregar configurações de fidelidade' }));
      }
    });
  }

  loadCustomerAccount(customerId: string): void {
    if (!customerId) {
      this.clearCustomer();
      return;
    }

    this.state.update((s) => ({ ...s, loading: true, error: null }));
    this.loyaltyService.getCustomerAccount(customerId).subscribe({
      next: (account) => {
        this.state.update((s) => ({ ...s, account, pointsToRedeem: 0, loading: false }));
      },
      error: (err) => {
        this.state.update((s) => ({
          ...s,
          account: null,
          pointsToRedeem: 0,
          loading: false,
          error: 'Erro ao carregar conta de fidelidade do cliente',
        }));
      }
    });
  }

  setPointsToRedeem(points: number): void {
    const balance = this.currentBalance();
    const minPoints = this.state().config?.minRedeemPoints ?? 0;
    
    let sanitizedPoints = Math.max(0, Math.floor(points));
    if (sanitizedPoints > balance) {
      sanitizedPoints = balance;
    }

    this.state.update((s) => ({
      ...s,
      pointsToRedeem: sanitizedPoints,
    }));
  }

  clearRedemption(): void {
    this.state.update((s) => ({
      ...s,
      pointsToRedeem: 0,
    }));
  }

  clearCustomer(): void {
    this.state.update((s) => ({
      ...s,
      account: null,
      pointsToRedeem: 0,
    }));
  }

  redeemActivePoints(saleId: string, onSuccess?: (res: any) => void, onError?: (err: any) => void): void {
    const points = this.pointsToRedeem();
    const account = this.state().account;
    
    if (!account || points <= 0 || !saleId) return;

    this.state.update((s) => ({ ...s, loading: true }));
    
    this.loyaltyService.redeemPoints({
      customerId: account.customerId,
      pointsToRedeem: points,
      saleId,
    }).subscribe({
      next: (res) => {
        // Atualiza a conta local com o novo saldo retornado pelo backend
        this.state.update((s) => {
          const updatedAccount = s.account ? { ...s.account, balance: res.newBalance } : null;
          return {
            ...s,
            account: updatedAccount,
            pointsToRedeem: 0,
            loading: false,
          };
        });
        if (onSuccess) onSuccess(res);
      },
      error: (err) => {
        this.state.update((s) => ({ ...s, loading: false, error: err.error?.message }));
        if (onError) onError(err);
      }
    });
  }
}
