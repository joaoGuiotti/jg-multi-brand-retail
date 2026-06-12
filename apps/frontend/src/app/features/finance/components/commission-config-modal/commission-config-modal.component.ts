
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MODAL_REF, ModalRef, UiAutocompleteComponent, UiButtonComponent, ToastService } from '@shared/ui';
import { CommissionsService } from '../../../../core/services/commissions.service';
import { AuthService } from '../../../../core/services/auth.service';
import { User } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-commission-config-modal',
  standalone: true,
  imports: [FormsModule, UiButtonComponent, UiAutocompleteComponent],
  template: `
    <div class="space-y-6 p-1">
    
      <!-- ── Seção 1: Taxa Padrão ─────────────────────────────── -->
      <div class="pb-5 border-b border-outline">
        <h4 class="text-sm font-bold text-content mb-1">Taxa de Comissão Padrão</h4>
        <p class="text-xs text-content-secondary mb-4">Percentual aplicado a todas as vendas concluídas da loja.</p>
    
        <div class="flex gap-3 items-end">
          <div class="flex-1">
            <label class="label">Taxa (%)</label>
            <input type="number" [(ngModel)]="commissionRate" class="input-field" placeholder="Ex: 10" min="0" max="100" step="0.1" />
          </div>
          <ui-button variant="primary" [loading]="isSavingRate()" (clicked)="saveRate()">
            Salvar Taxa
          </ui-button>
        </div>
      </div>
    
      <!-- ── Seção 2: Meta do Vendedor ────────────────────────── -->
      <div>
        <h4 class="text-sm font-bold text-content mb-1">Meta Mensal do Vendedor</h4>
        <p class="text-xs text-content-secondary mb-4">Defina a meta de vendas (R$) para um vendedor no período.</p>
    
        <div class="space-y-4">
          <!-- Autocomplete Vendedor -->
          <div>
            <label class="label">Vendedor</label>
            @if (!selectedUser()) {
              <div>
                <ui-autocomplete
                  [suggestions]="userSearchResults()"
                  (completeMethod)="searchUsers($event)"
                  (onSelect)="selectUser($event)"
                  placeholder="Buscar por nome ou email..."
                  field="name"
                  [dropdown]="true">
                  <ng-template #itemTemplate let-user>
                    <div class="flex items-center gap-3 w-full">
                      <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 uppercase">
                        {{ user.name?.substring(0, 2) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-content text-sm truncate">{{ user.name }}</p>
                        <p class="text-content-secondary text-xs truncate">{{ user.email }}</p>
                      </div>
                    </div>
                  </ng-template>
                </ui-autocomplete>
              </div>
            }
    
            <!-- Selecionado -->
            @if (selectedUser()) {
              <div class="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                <div class="flex items-center gap-2 overflow-hidden">
                  <div class="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0 uppercase">
                    {{ selectedUser()?.name?.substring(0, 2) }}
                  </div>
                  <div>
                    <p class="text-sm font-bold text-content truncate">{{ selectedUser()?.name }}</p>
                    <p class="text-xs text-content-tertiary truncate">{{ selectedUser()?.email }}</p>
                  </div>
                </div>
                <ui-button (click)="clearUser()" variant="ghost" size="sm" [outline]="true">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </ui-button>
              </div>
            }
          </div>
    
          <!-- Mês / Ano / Meta -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Mês (1–12)</label>
              <input type="number" [(ngModel)]="targetMonth" class="input-field" min="1" max="12" />
            </div>
            <div>
              <label class="label">Ano</label>
              <input type="number" [(ngModel)]="targetYear" class="input-field" />
            </div>
          </div>
          <div>
            <label class="label">Meta de Vendas (R$)</label>
            <input type="number" [(ngModel)]="targetAmount" class="input-field" placeholder="Ex: 15000" min="0" />
          </div>
        </div>
      </div>
    
      <!-- Actions -->
      <div class="flex justify-end gap-3 pt-2 border-t border-outline">
        <ui-button variant="ghost" [outline]="true" (clicked)="cancel()">Cancelar</ui-button>
        <ui-button variant="primary" [loading]="isSavingTarget()" (clicked)="saveTarget()">
          Salvar Meta
        </ui-button>
      </div>
    </div>
    `
})
export class CommissionConfigModalComponent implements OnInit {
  private commissionsService = inject(CommissionsService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  public modalRef = inject(MODAL_REF) as ModalRef<boolean>;

  // ── Taxa ──────────────────────────────────────────
  commissionRate: number = 0;
  isSavingRate = signal(false);

  // ── Meta ──────────────────────────────────────────
  allUsers = signal<User[]>([]);
  userSearchResults = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  targetUserId = '';
  targetMonth: number = new Date().getMonth() + 1;
  targetYear: number = new Date().getFullYear();
  targetAmount: number = 0;
  isSavingTarget = signal(false);

  constructor() {
    this.authService.listUsers().subscribe({
      next: (res) => this.allUsers.set(res.data),
    });
  }

  ngOnInit() {
    this.commissionsService.getCommissionRate().subscribe({
      next: (res) => {
        if (res.data?.commissionRate) {
          this.commissionRate = res.data.commissionRate;
        }
      }
    });
  }

  searchUsers(event: { query: string }) {
    const q = event.query.toLowerCase();
    this.userSearchResults.set(
      this.allUsers().filter(u =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      )
    );
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.targetUserId = user.id;
  }

  clearUser() {
    this.selectedUser.set(null);
    this.targetUserId = '';
  }

  saveRate() {
    if (!this.commissionRate) {
      this.toastService.warning('Atenção', 'Informe a taxa de comissão.');
      return;
    }
    this.isSavingRate.set(true);
    this.commissionsService.updateCommissionRate(this.commissionRate).subscribe({
      next: () => {
        this.toastService.success('Sucesso', `Taxa de ${this.commissionRate}% salva!`);
        this.isSavingRate.set(false);
      },
      error: () => {
        this.toastService.error('Erro', 'Falha ao salvar a taxa.');
        this.isSavingRate.set(false);
      }
    });
  }

  saveTarget() {
    if (!this.targetUserId) {
      this.toastService.warning('Atenção', 'Selecione o vendedor.');
      return;
    }
    this.isSavingTarget.set(true);
    this.commissionsService.setSalesTarget(
      this.targetUserId, this.targetMonth, this.targetYear, this.targetAmount
    ).subscribe({
      next: () => {
        this.toastService.success('Sucesso', 'Meta definida com sucesso!');
        this.clearUser();
        this.targetAmount = 0;
        this.isSavingTarget.set(false);
        this.modalRef.close(true);
      },
      error: () => {
        this.toastService.error('Erro', 'Falha ao definir meta.');
        this.isSavingTarget.set(false);
      }
    });
  }

  cancel() {
    this.modalRef.close(false);
  }
}
