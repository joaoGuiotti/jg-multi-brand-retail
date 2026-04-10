import { Injectable, signal, OnDestroy } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface OperationalEvent {
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class OperationalStreamService implements OnDestroy {
  private eventSource: EventSource | null = null;
  
  // Signal to store the latest events (keeping last 50 for monitoring)
  events = signal<OperationalEvent[]>([]);
  
  // Connection status
  connected = signal<boolean>(false);

  connect() {
    if (this.eventSource) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[SSE] No access token found, cannot connect to operational stream.');
      return;
    }

    // Connect using query param for token since EventSource doesn't support headers
    const url = `${environment.apiUrl}/api/v1/notifications/stream?token=${token}`;
    
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('[SSE] Connected to operational stream');
      this.connected.set(true);
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data: OperationalEvent = JSON.parse(event.data);
        this.events.update(prev => [data, ...prev].slice(0, 50));
      } catch (e) {
        console.error('[SSE] Failed to parse event data', e);
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('[SSE] Connection error', err);
      this.connected.set(false);
      this.disconnect();
      
      // Auto-reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.connected.set(false);
    }
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
