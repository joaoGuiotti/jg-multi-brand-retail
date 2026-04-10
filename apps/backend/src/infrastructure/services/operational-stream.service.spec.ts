import { OperationalStreamService } from './operational-stream.service';
import { take } from 'rxjs/operators';

describe('OperationalStreamService', () => {
  let service: OperationalStreamService;

  beforeEach(() => {
    service = new OperationalStreamService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should push and receive events for the same tenant', (done) => {
    const tenantId = 'tenant-1';
    const eventType = 'TEST_EVENT';
    const payload = { foo: 'bar' };

    service
      .getStream(tenantId)
      .pipe(take(1))
      .subscribe((message) => {
        expect(message.data.type).toBe(eventType);
        expect(message.data.payload).toEqual(payload);
        expect(message.data.timestamp).toBeDefined();
        done();
      });

    service.pushEvent(tenantId, eventType, payload);
  });

  it('should isolate events between different tenants', (done) => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    let eventsReceivedCount = 0;

    // Tenant B should NOT receive Tenant A's event
    service.getStream(tenantB).subscribe({
      next: () => {
        eventsReceivedCount++;
      },
    });

    service.pushEvent(tenantA, 'EVENT_A', { data: 'A' });

    // Wait a bit to ensure nothing was received
    setTimeout(() => {
      expect(eventsReceivedCount).toBe(0);
      done();
    }, 100);
  });
});
