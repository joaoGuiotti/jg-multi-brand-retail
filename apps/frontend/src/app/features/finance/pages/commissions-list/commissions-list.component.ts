import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  TableColumn,
  TableConfig,
  UiAutocompleteComponent,
  UiBadgeComponent,
  UiButtonComponent,
  UiCardComponent,
  UiModalService,
  UiNumberPipe,
  UiPageHeaderComponent,
  UiTableColumnDirective,
  UiTableComponent,
} from '@shared/ui';
import { User } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { CommissionsService, CommissionTransactionItem, CommissionMetrics } from '../../../../core/services/commissions.service';
import { CommissionConfigModalComponent } from '../../components/commission-config-modal/commission-config-modal.component';

@Component({
  selector: 'app-commissions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UiPageHeaderComponent,
    UiCardComponent,
    UiButtonComponent,
    UiBadgeComponent,
    UiNumberPipe,
    UiAutocompleteComponent,
    UiTableComponent,
    UiTableColumnDirective,
  ],
  template: `
    <div class="mx-auto">
      <ui-page-header
        title="Comissões por Funcionário"
        subtitle="Consulte todas as transações de comissão geradas por vendas concluídas.">
        <ng-template #actions>
          <ui-button variant="primary" (clicked)="openConfigModal()">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurar Taxa / Meta
          </ui-button>
        </ng-template>
      </ui-page-header>

      <!-- Filtros -->
      <ui-card [shadow]="true" padding="sm" class="mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">

          <!-- Filtro por Vendedor -->
          <div>
            <label class="label">Funcionário</label>
            <div *ngIf="!selectedUser()">
              <ui-autocomplete
                [suggestions]="userSearchResults()"
                (completeMethod)="searchUsers($event)"
                (onSelect)="selectUser($event)"
                placeholder="Todos os funcionários"
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
            <div *ngIf="selectedUser()" class="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-xl mt-1">
              <div class="flex items-center gap-2 overflow-hidden">
                <div class="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 uppercase">
                  {{ selectedUser()?.name?.substring(0, 2) }}
                </div>
                <span class="text-sm font-semibold text-content truncate">{{ selectedUser()?.name }}</span>
              </div>
              <ui-button (click)="clearUser()" variant="ghost" size="sm">✕</ui-button>
            </div>
          </div>

          <!-- Mês -->
          <div>
            <label class="label">Mês</label>
            <select [(ngModel)]="filterMonth" class="input-field">
              <option [value]="0">Todos os meses</option>
              <option [value]="1">Janeiro</option>
              <option [value]="2">Fevereiro</option>
              <option [value]="3">Março</option>
              <option [value]="4">Abril</option>
              <option [value]="5">Maio</option>
              <option [value]="6">Junho</option>
              <option [value]="7">Julho</option>
              <option [value]="8">Agosto</option>
              <option [value]="9">Setembro</option>
              <option [value]="10">Outubro</option>
              <option [value]="11">Novembro</option>
              <option [value]="12">Dezembro</option>
            </select>
          </div>

          <!-- Ano -->
          <div>
            <label class="label">Ano</label>
            <input type="number" [(ngModel)]="filterYear" class="input-field" min="2020" max="2099" />
          </div>

          <!-- Ações de filtro -->
          <div class="flex gap-2">
            <ui-button variant="primary" [fullWidth]="true" [loading]="isLoading()" (clicked)="loadCommissions()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Buscar
            </ui-button>
            <ui-button variant="ghost" [outline]="true" (clicked)="clearFilters()">
              Limpar
            </ui-button>
          </div>
        </div>
      </ui-card>

      <!-- Sumário Global / Usuário -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        
        <!-- Meta Configurável (Aparece se usuário selecionado) -->
        <ui-card *ngIf="selectedUserMetrics()" [shadow]="true" padding="sm" class="relative overflow-hidden">
          <div class="flex flex-col">
            <p class="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-2">Meta Mensal do Vendedor</p>
            <div class="flex items-end justify-between">
              <span class="text-2xl font-bold text-content">
                {{ selectedUserMetrics()!.targetAmount | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
              </span>
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            <div class="mt-4 h-2 w-full bg-border rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-500 ease-out" 
                   [style.width.%]="selectedUserMetrics()!.progressPercentage > 100 ? 100 : selectedUserMetrics()!.progressPercentage"></div>
            </div>
            <p class="text-xs text-content-secondary mt-2 text-right">
              {{ selectedUserMetrics()!.progressPercentage }}% concluído
            </p>
          </div>
        </ui-card>

        <!-- Total de Transações (Se nenhum usuário ou como card menor) -->
        <ui-card *ngIf="!selectedUserMetrics()" [shadow]="true" padding="sm">
          <p class="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">Total de Transações</p>
          <p class="text-2xl font-bold text-content">{{ totalItems() }}</p>
        </ui-card>

        <ui-card [shadow]="true" padding="sm">
          <p class="text-xs font-semibold text-content-secondary uppercase tracking-wider mb-1">Total Vendido</p>
          <p class="text-2xl font-bold text-content">
            {{ (selectedUserMetrics() ? selectedUserMetrics()!.totalSold : totalBaseAmount()) | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
          </p>
        </ui-card>

        <ui-card [shadow]="true" padding="sm" class="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <p class="text-xs font-semibold text-success uppercase tracking-wider mb-1">Total em Comissões</p>
          <p class="text-2xl font-bold text-success">
            {{ (selectedUserMetrics() ? selectedUserMetrics()!.commissionEarned : totalCommission()) | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
          </p>
        </ui-card>
      </div>

      <!-- Tabela -->
      <ui-table
        [columns]="columns"
        [dataSource]="commissions()"
        [config]="tableConfig()"
        (pageChange)="onPageChange($event)">

        <div *uiTableColumn="'userName'; let row">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold uppercase shrink-0">
              {{ row.userName?.substring(0, 2) }}
            </div>
            <span class="text-sm font-semibold text-content">{{ row.userName }}</span>
          </div>
        </div>

        <div *uiTableColumn="'createdAt'; let row">
          <span class="text-xs text-content-secondary">{{ row.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
        </div>

        <div *uiTableColumn="'saleId'; let row">
          <span class="text-xs font-mono text-content-tertiary">{{ row.saleId | slice:0:8 }}...</span>
        </div>

        <div *uiTableColumn="'baseAmount'; let row">
          <span class="text-sm text-content font-medium">
            {{ row.baseAmount | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
          </span>
        </div>

        <div *uiTableColumn="'percentageApplied'; let row">
          <span class="text-sm text-content-secondary">{{ row.percentageApplied }}%</span>
        </div>

        <div *uiTableColumn="'commissionAmount'; let row">
          <span class="text-sm font-bold text-success">
            {{ row.commissionAmount | uiNumber: { decimalPlaces: 2, prefix: 'R$ ' } }}
          </span>
        </div>

        <div *uiTableColumn="'status'; let row">
          <ui-badge [variant]="row.status === 'PAID' ? 'success' : row.status === 'REVERSED' ? 'error' : 'warning'" [dot]="true">
            {{ row.status === 'PAID' ? 'Pago' : row.status === 'REVERSED' ? 'Estornado' : 'Pendente' }}
          </ui-badge>
        </div>

      </ui-table>
    </div>
  `
})
export class CommissionsListComponent implements OnInit {
  private commissionsService = inject(CommissionsService);
  private authService = inject(AuthService);
  private modalService = inject(UiModalService);

  isLoading = signal(false);
  commissions = signal<CommissionTransactionItem[]>([]);
  totalItems = signal(0);
  totalPages = signal(0);
  currentPage = signal(1);

  totalBaseAmount = () => this.commissions().reduce((acc, c) => acc + c.baseAmount, 0);
  totalCommission = () => this.commissions().reduce((acc, c) => acc + c.commissionAmount, 0);

  // Filters
  filterMonth: number = new Date().getMonth() + 1;
  filterYear: number = new Date().getFullYear();
  allUsers = signal<User[]>([]);
  userSearchResults = signal<User[]>([]);
  selectedUser = signal<User | null>(null);
  filterUserId = signal<string | undefined>(undefined);

  selectedUserMetrics = signal<CommissionMetrics | null>(null);

  columns: TableColumn[] = [
    { key: 'userName', label: 'Funcionário' },
    { key: 'createdAt', label: 'Data', sortable: true },
    { key: 'saleId', label: 'Venda' },
    { key: 'baseAmount', label: 'Valor da Venda' },
    { key: 'percentageApplied', label: 'Taxa (%)' },
    { key: 'commissionAmount', label: 'Comissão' },
    { key: 'status', label: 'Status' },
  ];

  tableConfig = () => ({
    stripedRow: true,
    loading: this.isLoading(),
    pagination: { page: this.currentPage(), totalPages: this.totalPages(), total: this.totalItems(), limit: 20 },
  } as TableConfig);

  ngOnInit() {
    this.authService.listUsers().subscribe({
      next: (res) => this.allUsers.set(res.data),
    });
    this.loadCommissions();
  }

  openConfigModal() {
    this.modalService.open(CommissionConfigModalComponent, {
      title: '⚙️ Configurações de Comissionamento',
      closable: true,
      maxWidth: '560px',
    }).afterClosed().subscribe((saved) => {
      if (saved) this.loadCommissions();
    });
  }

  searchUsers(event: { query: string }) {
    const q = event.query.toLowerCase();
    this.userSearchResults.set(
      this.allUsers().filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );
  }

  selectUser(user: User) {
    this.selectedUser.set(user);
    this.filterUserId.set(user.id);
  }

  clearUser() {
    this.selectedUser.set(null);
    this.filterUserId.set(undefined);
  }

  clearFilters() {
    this.clearUser();
    this.filterMonth = 0;
    this.filterYear = new Date().getFullYear();
    this.currentPage.set(1);
    this.loadCommissions();
  }

  loadCommissions() {
    this.isLoading.set(true);

    if (this.filterUserId() && this.filterMonth && this.filterYear) {
      this.commissionsService.getDashboardMetrics(this.filterMonth, this.filterYear, this.filterUserId()).subscribe({
        next: (res) => this.selectedUserMetrics.set(res.data),
        error: () => this.selectedUserMetrics.set(null)
      });
    } else {
      this.selectedUserMetrics.set(null);
    }

    this.commissionsService.listCommissions({
      userId: this.filterUserId(),
      month: this.filterMonth || undefined,
      year: this.filterYear,
      page: this.currentPage(),
      limit: 20,
    }).subscribe({
      next: (res: any) => {
        let items = [];
        let meta = null;

        if (res.meta) {
          items = res.data;
          meta = res.meta;
        } else if (res.data && res.data.meta) {
          items = res.data.data;
          meta = res.data.meta;
        } else {
          items = res.data || [];
        }

        this.commissions.set(items ?? []);
        this.totalItems.set(meta?.total ?? 0);
        this.totalPages.set(meta?.totalPages ?? 0);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
    this.loadCommissions();
  }
}
