import { Injectable, computed, inject, signal } from '@angular/core';
import { NotificationsService, Notification, NotificationPreference } from '../services/notifications.service';
import { NotificationsWsService } from '../services/notifications-ws.service';
import { ToastService } from '../../../shared/ui/services/toast/toast.service';

interface NotificationsState {
  items: Notification[];
  preferences: NotificationPreference[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationsStore {
  private api = inject(NotificationsService);
  private ws = inject(NotificationsWsService);
  private toastService = inject(ToastService);

  private readonly NOTIFICATION_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

  private state = signal<NotificationsState>({
    items: [],
    preferences: [],
    unreadCount: 0,
    loading: false,
    error: null,
  });

  readonly items = computed(() => this.state().items);
  readonly preferences = computed(() => this.state().preferences);
  readonly unreadCount = computed(() => this.state().unreadCount);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Computed map for O(1) reactive lookup by notification type
  readonly preferencesMap = computed(() => {
    return this.state().preferences.reduce((acc, pref) => {
      acc[pref.type] = pref;
      return acc;
    }, {} as Record<string, NotificationPreference>);
  });

  // Computed signal to determine if all sound is enabled across preferences
  readonly isGlobalSoundEnabled = computed(() => {
    const prefs = this.state().preferences;
    if (prefs.length === 0) return true;
    return prefs.every(p => p.sound);
  });

  private initialized = false;

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadInitialData();
    this.listenToRealtimeEvents();
  }

  private loadInitialData() {
    this.state.update(s => ({ ...s, loading: true }));
    
    this.api.getNotifications(1, 20).subscribe({
      next: (res) => {
        this.state.update(s => ({ 
          ...s, 
          items: res.data.data || [], 
          loading: false 
        }));
      },
      error: (err) => this.state.update(s => ({ ...s, error: err.message, loading: false }))
    });

    this.api.getUnreadCount().subscribe({
      next: (res) => this.state.update(s => ({ ...s, unreadCount: (res as any).data?.count ?? (res as any).count ?? 0 }))
    });

    this.loadPreferences();
  }

  loadPreferences() {
    this.api.getPreferences().subscribe({
      next: (res: any) => {
        // Handle standard response wrapping { data: [...] } or raw array [...]
        const preferences = Array.isArray(res) ? res : (res.data || []);
        this.state.update(s => ({ ...s, preferences }));
      },
      error: (err) => console.error('Failed to load preferences', err)
    });
  }

  updatePreference(type: string, enabled: boolean, sound: boolean) {
    // 1. Optimistic Update
    const previousPrefs = this.state().preferences;
    this.state.update(s => {
      const exists = s.preferences.some(p => p.type === type);
      const preferences = exists
        ? s.preferences.map(p => p.type === type ? { ...p, enabled, sound } : p)
        : [...s.preferences, { id: 'temp-' + type, type, enabled, sound } as any];
      return { ...s, preferences };
    });

    // 2. Real API call
    this.api.updatePreference({ type, enabled, sound }).subscribe({
      next: (res: any) => {
        const pref = res.data || res;
        this.state.update(s => ({
          ...s,
          preferences: s.preferences.map(p => p.type === type ? pref : p)
        }));
      },
      error: (err) => {
        console.error('Failed to update preference', err);
        this.state.update(s => ({ ...s, preferences: previousPrefs }));
      }
    });
  }

  toggleAllSounds(sound: boolean, types: string[]) {
    // 1. Single Atomic Optimistic Update
    const previousPrefs = this.state().preferences;
    this.state.update(s => {
      const newPreferences = [...s.preferences];
      
      types.forEach(typeKey => {
        const index = newPreferences.findIndex(p => p.type === typeKey);
        if (index > -1) {
          newPreferences[index] = { ...newPreferences[index], sound };
        } else {
          newPreferences.push({ id: 'temp-' + typeKey, type: typeKey, enabled: true, sound } as any);
        }
      });

      return { ...s, preferences: newPreferences };
    });

    // 2. Parallel API calls (Background)
    types.forEach(typeKey => {
      const pref = previousPrefs.find(p => p.type === typeKey);
      const enabled = pref ? pref.enabled : true;
      
      this.api.updatePreference({ type: typeKey, enabled, sound }).subscribe({
        error: (err) => {
          console.error(`Failed to update sound for ${typeKey}`, err);
          // Only rollback if absolutely necessary, or let subsequent syncs handle it
        }
      });
    });
  }

  private listenToRealtimeEvents() {
    this.ws.onNotificationReceive().subscribe((notification) => {
      // 1. Update State
      this.state.update(s => ({
        ...s,
        items: [notification, ...(s.items || [])],
        unreadCount: s.unreadCount + 1
      }));

      // 2. Reaction (Sound & Toast) - Respecting Preferences
      this.handleNotificationReaction(notification);
    });
  }

  private handleNotificationReaction(notification: Notification) {
    const pref = this.preferencesMap()[notification.type];
    const soundEnabledByType = pref ? pref.sound : true;
    const globalSoundEnabled = this.isGlobalSoundEnabled();

    // Play sound if enabled globally AND for this type
    if (globalSoundEnabled && soundEnabledByType) {
      this.playNotificationSound();
    }

    // Show toast for high priority
    if (notification.priority === 'HIGH' || notification.priority === 'CRITICAL') {
      this.toastService.show({
        type: notification.priority === 'CRITICAL' ? 'error' : 'warning',
        title: notification.title,
        message: notification.message,
        duration: notification.priority === 'CRITICAL' ? 0 : 7000,
      });
    }
  }

  private playNotificationSound() {
    const audio = new Audio(this.NOTIFICATION_SOUND_URL);
    audio.play().catch(err => {
      if (err.name === 'NotAllowedError') {
        console.info('[Store] Audio playback blocked until user interacts with the page.');
      } else {
        console.warn('[Store] Could not play notification sound:', err);
      }
    });
  }

  markAsRead(id: string) {
    this.state.update(s => {
      const items = s.items.map(n => n.id === id ? { ...n, readAt: new Date().toISOString() } : n);
      return {
        ...s,
        items,
        unreadCount: Math.max(0, s.unreadCount - 1)
      };
    });

    this.ws.markAsReadViaWs(id);
  }

  markAllAsRead() {
    this.state.update(s => {
      const items = s.items.map(n => ({ ...n, readAt: n.readAt || new Date().toISOString() }));
      return { ...s, items, unreadCount: 0 };
    });
    this.api.markAllAsRead().subscribe();
  }
}
