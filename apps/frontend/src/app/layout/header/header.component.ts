import { Component, EventEmitter, inject, Output, ChangeDetectionStrategy } from '@angular/core';

import { ThemeToggleComponent, UiOverlayComponent } from '@shared/ui';
import { AuthService } from '../../core/services/auth.service';
import { NotificationBellComponent } from '../../features/notifications/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [ThemeToggleComponent, UiOverlayComponent, NotificationBellComponent],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();
  private authService = inject(AuthService);
  user = this.authService.user;

  constructor() { }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
