import {
  Component,
  inject,
  input,
  OnInit,
  signal,
  computed,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoyaltyService, LoyaltyAccountResponse } from '../../services/loyalty.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService, UiButtonComponent, UiInputFieldComponent } from '@shared/ui';

@Component({
  selector: 'app-loyalty-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, UiButtonComponent, UiInputFieldComponent],
  templateUrl: './loyalty-history.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './loyalty-history.component.scss',
})
export class LoyaltyHistoryComponent implements OnInit {
  private loyaltyService = inject(LoyaltyService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  customerId = input.required<string>();

  account = signal<LoyaltyAccountResponse | null>(null);
  isLoading = signal<boolean>(false);
  isAdjusting = signal<boolean>(false);
  showAdjustForm = signal<boolean>(false);

  adjustForm!: FormGroup;

  // Checks if active user has permission to make direct manual adjustments
  isAdmin = computed(() => {
    const role = this.authService.user()?.role;
    return role === 'ADMIN' || role === 'SUPER_ADMIN';
  });

  constructor() {
    // Re-load account automatically if customerId changes
    effect(() => {
      const id = this.customerId();
      if (id) {
        this.loadAccount(id);
      }
    });
  }

  ngOnInit(): void {
    this.adjustForm = this.fb.group({
      points: ['', [Validators.required, Validators.pattern(/^-?[1-9]\d*$/)]],
      reason: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  loadAccount(id: string): void {
    this.isLoading.set(true);
    this.loyaltyService.getCustomerAccount(id).subscribe({
      next: (res) => {
        this.account.set(res);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.show({
          type: 'error',
          title: 'Erro de Carregamento',
          message: 'Não foi possível carregar o histórico de fidelidade do cliente.',
          duration: 4000,
        });
        this.isLoading.set(false);
      },
    });
  }

  toggleAdjustForm(): void {
    this.showAdjustForm.update((val) => !val);
    this.adjustForm.reset();
  }

  submitAdjustment(): void {
    if (this.adjustForm.invalid) {
      this.adjustForm.markAllAsTouched();
      return;
    }

    const formVal = this.adjustForm.value;
    const points = Number(formVal.points);

    if (points === 0) {
      this.toastService.show({
        type: 'warning',
        title: 'Ajuste Inválido',
        message: 'A quantidade de pontos para ajuste não pode ser zero.',
        duration: 4000,
      });
      return;
    }

    // Se for um débito, valida localmente para evitar erro de servidor desnecessário
    if (points < 0 && (this.account()?.balance || 0) < Math.abs(points)) {
      this.toastService.show({
        type: 'error',
        title: 'Saldo Insuficiente',
        message: `O cliente não possui pontos suficientes para o débito de ${Math.abs(points)} pts.`,
        duration: 5000,
      });
      return;
    }

    this.isAdjusting.set(true);
    this.loyaltyService
      .adjustPoints({
        customerId: this.customerId(),
        points,
        reason: formVal.reason,
      })
      .subscribe({
        next: () => {
          this.toastService.show({
            type: 'success',
            title: 'Ajuste Realizado',
            message: `Saldo de pontos ajustado com sucesso em ${points > 0 ? '+' : ''}${points} pts.`,
            duration: 4000,
          });
          this.isAdjusting.set(false);
          this.showAdjustForm.set(false);
          this.adjustForm.reset();
          this.loadAccount(this.customerId()); // Recarrega extrato atualizado
        },
        error: (err) => {
          this.toastService.show({
            type: 'error',
            title: 'Falha no Ajuste',
            message: err.error?.message || 'Não foi possível salvar o ajuste de pontos.',
            duration: 5000,
          });
          this.isAdjusting.set(false);
        },
      });
  }
}
