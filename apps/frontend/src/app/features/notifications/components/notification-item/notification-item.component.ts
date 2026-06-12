import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Notification } from '../../services/notifications.service';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div
      class="p-4 border-b border-outline hover:bg-surface-hover flex items-start cursor-pointer transition-colors duration-200"
      [ngClass]="{'bg-primary/5': !notification?.readAt, 'bg-surface': $safeNavigationMigration(notification?.readAt)}"
      (click)="onClick()"
      >
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start mb-1 gap-2">
          <span class="text-sm font-semibold text-content truncate">{{ notification?.title }}</span>
          <span class="text-[10px] text-content-tertiary whitespace-nowrap pt-0.5">{{ $safeNavigationMigration(notification?.createdAt) | date:'shortTime' }}</span>
        </div>
        <p class="text-sm text-content-secondary line-clamp-2 leading-snug">{{ notification?.message }}</p>
      </div>
      @if (!notification?.readAt) {
        <div class="w-2 h-2 ml-3 mt-1.5 flex-shrink-0 bg-primary rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
      }
    </div>
    `
})
export class NotificationItemComponent {
  @Input({ required: true }) notification: Notification | undefined;
  @Output() markedRead = new EventEmitter<void>();

  onClick() {
    if (this.notification && !this.notification.readAt) {
      this.markedRead.emit();
    }
  }
}
