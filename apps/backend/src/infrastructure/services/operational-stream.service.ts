import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

interface OperationalEvent {
  tenantId: string;
  type: string;
  payload: any;
  timestamp: string;
}

@Injectable()
export class OperationalStreamService {
  private readonly eventSubject = new Subject<OperationalEvent>();

  /**
   * Pushes a new operational event to the stream
   */
  pushEvent(tenantId: string, type: string, payload: any) {
    this.eventSubject.next({
      tenantId,
      type,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Returns an Observable stream filtered by tenantId
   * formatted as NestJS MessageEvent for SSE
   */
  getStream(tenantId: string): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      filter((event) => event.tenantId === tenantId),
      map((event) => ({
        data: {
          type: event.type,
          payload: event.payload,
          timestamp: event.timestamp,
        },
      } as MessageEvent))
    );
  }
}
