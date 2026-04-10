# Quickstart: Working with Notifications

If you are developing a new feature that needs to dispatch notifications (e.g., processing a new Sale or launching a Loyalty campaign), do not interact directly with Gateways or the Persistence logic. 

**Use the Dispatcher**:
Inject the `NotificationDispatcherService` into your module's use cases.

```typescript
import { NotificationDispatcherService } from '@/infrastructure/services/notification-dispatcher.service';

export class ProcessRefundUseCase {
  constructor(private readonly dispatcher: NotificationDispatcherService) {}

  async execute(input: any) {
    // ... refund logic ...

    // Fire & Forget: The dispatcher will handle saving to DB, checking the user's
    // preferences, checking Redis debounce rules, and broadcasting to WebSocket if valid.
    await this.dispatcher.dispatch(userId, {
        type: NotificationType.RETURN_APPROVED,
        priority: NotificationPriority.HIGH,
        title: 'Return Approved',
        message: 'Your return for order #123 has been accepted.',
        actionUrl: '/returns/123'
    });
  }
}
```

The dispatcher abstracts away if the notification reaches the user via WS, SSE, or if it's discarded due to their custom privacy settings.
