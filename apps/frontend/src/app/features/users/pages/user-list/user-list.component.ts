import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/auth.model';
import { 
  TableColumn, 
  TableConfig, 
  UiBadgeComponent, 
  UiButtonComponent, 
  UiCardComponent, 
  UiTableColumnDirective, 
  UiTableComponent,
  UiTooltipDirective,
  UiPageHeaderComponent
} from '@shared/ui';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    UiButtonComponent, 
    UiCardComponent, 
    UiBadgeComponent, 
    UiTableComponent, 
    UiTableColumnDirective,
    UiTooltipDirective,
    UiPageHeaderComponent
  ],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss'
})
export class UserListComponent implements OnInit {
  private authService = inject(AuthService);
  
  users = signal<User[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  columns = signal<TableColumn[]>([
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'role', label: 'Cargo' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Ações', width: '100px', sortable: false }
  ]);

  tableConfig = computed<TableConfig>(() => ({
    stripedRow: true,
    loading: this.isLoading(),
    rowIdKey: 'id'
  }));

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.authService.listUsers().subscribe({
      next: (response: any) => {
        this.users.set(response.data);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Erro ao carregar funcionários');
        this.isLoading.set(false);
      }
    });
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'USER': return 'Funcionário';
      default: return role;
    }
  }
}
