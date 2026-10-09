import { CustomThrottlerGuard } from './custom-throttler.guard';

describe('CustomThrottlerGuard', () => {
  let guard: CustomThrottlerGuard;

  beforeEach(() => {
    // Instantiate guard with dummy options, storage, and reflector
    guard = new CustomThrottlerGuard({} as any, {} as any, {} as any);
  });

  it('should track by IP + email for /auth/login with email in body', async () => {
    const req = {
      url: '/api/v1/auth/login',
      ip: '192.168.1.50',
      body: { email: '  Admin@Store.com  ' },
    };

    // Access protected getTracker
    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('login-192.168.1.50-admin@store.com');
  });

  it('should track by tenantId + IP for authenticated tenant requests', async () => {
    const req = {
      url: '/api/v1/sales',
      ip: '10.0.0.1',
      user: { tenantId: 'tenant-abc-123' },
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('tenant-tenant-abc-123-10.0.0.1');
  });

  it('should fallback to client IP for unauthenticated generic requests', async () => {
    const req = {
      url: '/api/v1/health',
      ip: '172.16.0.5',
    };

    const tracker = await (guard as any).getTracker(req);
    expect(tracker).toBe('172.16.0.5');
  });
});
