import { Component, inject, Output, EventEmitter, signal } from '@angular/core';

import { NotificationsStore } from '../../store/notifications.store';
import { NotificationItemComponent } from '../notification-item/notification-item.component';
import { NotificationSettingsComponent } from '../notification-settings/notification-settings.component';

type PanelView = 'LIST' | 'SETTINGS';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [NotificationItemComponent, NotificationSettingsComponent],
  template: `
    <div class="flex flex-col w-full h-full min-h-[400px]">
      <!-- List View -->
      @if (view() === 'LIST') {
        <div class="px-4 py-3 bg-surface-secondary border-b border-outline flex justify-between items-center">
          <div class="flex items-center gap-2">
            <h3 class="text-sm font-bold text-content">Notifications</h3>
            @if (store.unreadCount() > 0) {
              <span class="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded">
                {{ store.unreadCount() }}
              </span>
            }
          </div>
          <div class="flex items-center gap-2">
            @if (store.unreadCount() > 0) {
              <button
                (click)="store.markAllAsRead()"
                class="text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                >
                Mark all as read
              </button>
            }
            <button
              (click)="view.set('SETTINGS')"
              class="p-1.5 text-content-tertiary hover:text-content hover:bg-surface-hover rounded-full transition-all"
              title="Settings"
              >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
        <div class="flex-1 overflow-y-auto min-h-0">
          @if (store.loading()) {
            <div class="p-8 text-center text-sm text-content-tertiary">
              <div class="animate-pulse">Loading...</div>
            </div>
          }
          @if (!store.loading() && store.items().length === 0) {
            <div class="p-8 text-center">
              <div class="mb-3 flex justify-center text-content-tertiary/20">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4a2 2 0 012-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p class="text-sm text-content-secondary font-medium">No alerts yet</p>
              <p class="text-xs text-content-tertiary mt-1">We'll let you know when things happen.</p>
            </div>
          }
          @for (item of store.items(); track item) {
            <app-notification-item
              [notification]="item"
              (markedRead)="onItemMarkedRead(item.id)"
            ></app-notification-item>
          }
        </div>
      }
    
      <!-- Settings View -->
      @if (view() === 'SETTINGS') {
        <app-notification-settings
          (back)="view.set('LIST')"
        ></app-notification-settings>
      }
    </div>
    `
})
export class NotificationPanelComponent {
  store = inject(NotificationsStore);
  @Output() close = new EventEmitter<void>();

  view = signal<PanelView>('LIST');

  onItemMarkedRead(id: string) {
    this.store.markAsRead(id);
  }
}
