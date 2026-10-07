import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { Notification } from './notifications.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class NotificationsWsService {
  private socket!: Socket;
  private notificationSubject = new Subject<Notification>();

  connect(token: string, tenantId: string, userId: string) {
    if (this.socket?.connected) {
      return;
    }

    const wsBaseUrl =
      (environment as { wsUrl?: string }).wsUrl ||
      (environment.apiUrl.startsWith('http')
        ? environment.apiUrl
        : typeof window !== 'undefined'
          ? window.location.origin
          : '');

    this.socket = io(`${wsBaseUrl}/notifications`, {
      auth: { token },
      query: { tenantId, userId },
      transports: ['websocket'],
    });

    console.log(`[WS] Attempting to connect to ${wsBaseUrl}/notifications for user ${userId}`);

    this.socket.on('connect', () => {
      console.log('[WS] Connected successfully to notifications WS');
    });

    this.socket.on('notification_receive', (notification: Notification) => {
      console.log('[WS] Received notification event:', notification);
      this.notificationSubject.next(notification);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WS] Disconnected:', reason);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  onNotificationReceive(): Observable<Notification> {
    return this.notificationSubject.asObservable();
  }

  markAsReadViaWs(notificationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark_as_read', { notificationId });
    }
  }
}
