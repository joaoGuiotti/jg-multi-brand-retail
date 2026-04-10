import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { NotificationsStore } from '../../store/notifications.store';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col w-full h-full min-h-[400px] bg-surface">
      <div class="px-4 py-3 bg-surface-secondary border-b border-outline flex items-center gap-3">
        <button (click)="back.emit()" class="p-1 hover:bg-surface-hover rounded-full transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 class="text-sm font-bold text-content">Notification Settings</h3>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-6">
        <section>
          <h4 class="text-[10px] font-bold text-content-tertiary uppercase tracking-wider mb-2">General</h4>
          <div class="flex items-center justify-between py-2">
            <div>
              <p class="text-sm font-medium text-content">Audio Alerts</p>
              <p class="text-xs text-content-tertiary">Quickly toggle all notification sounds</p>
            </div>
            
            <button 
              (click)="toggleGlobalSound()"
              class="h-10 w-10 rounded-full transition-all border border-outline hover:bg-surface-hover flex items-center justify-center"
              [ngClass]="store.isGlobalSoundEnabled() ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-surface-secondary text-content-tertiary'"
              [title]="store.isGlobalSoundEnabled() ? 'Mute all' : 'Unmute all'"
            >
              <!-- Icon: Sound On (Speaker Wave) -->
              <svg *ngIf="store.isGlobalSoundEnabled()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
              
              <!-- Icon: Sound Off (Speaker X Mark) -->
              <svg *ngIf="!store.isGlobalSoundEnabled()" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            </button>
          </div>
        </section>

        <section>
          <h4 class="text-[10px] font-bold text-content-tertiary uppercase tracking-wider mb-2">Categories</h4>
          <div class="space-y-4">
            <div *ngFor="let type of notificationTypes" class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-content">{{ type.label }}</p>
                <p class="text-xs text-content-tertiary">{{ type.description }}</p>
              </div>
              <button 
                (click)="toggleType(type.key)"
                class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                [ngClass]="(store.preferencesMap()[type.key]?.enabled !== false) ? 'bg-primary' : 'bg-outline'"
              >
                <span 
                  class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                  [ngClass]="(store.preferencesMap()[type.key]?.enabled !== false) ? 'translate-x-4' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `
})
export class NotificationSettingsComponent {
  store = inject(NotificationsStore);
  @Output() back = new EventEmitter<void>();

  notificationTypes = [
    { key: 'SYSTEM', label: 'System Alerts', description: 'Critical platform updates' },
    { key: 'LOW_STOCK', label: 'Low Stock', description: 'Inventory alerts for products' },
    { key: 'OUT_OF_STOCK', label: 'Out of Stock', description: 'Critical stock depletion' },
    { key: 'SALE_COMPLETED', label: 'Sales', description: 'New order confirmations' },
    { key: 'RETURN_PENDING', label: 'Returns', description: 'New return requests' },
  ];

  isTypeEnabled(typeKey: string): boolean {
    const pref = this.store.preferences().find(p => p.type === typeKey);
    return pref ? pref.enabled : true;
  }

  toggleType(typeKey: string) {
    const pref = this.store.preferences().find(p => p.type === typeKey);
    const currentlyEnabled = pref ? pref.enabled : true;
    const currentlySound = pref ? pref.sound : true;

    this.store.updatePreference(typeKey, !currentlyEnabled, currentlySound);
  }

  toggleGlobalSound() {
    const willBeEnabled = !this.store.isGlobalSoundEnabled();
    const typeKeys = this.notificationTypes.map(t => t.key);
    this.store.toggleAllSounds(willBeEnabled, typeKeys);
  }
}
