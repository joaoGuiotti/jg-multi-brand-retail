import { NotificationEventsHandler } from '../notification-events.handler';
import { NotificationCreatedEvent } from '../../../../domain/events/notifications/notification-created.event';
import { NotificationReadEvent } from '../../../../domain/events/notifications/notification-read.event';
import { NotificationsGateway } from '../../../../infrastructure/gateways/notifications.gateway';
import { OperationalStreamService } from '../../../../infrastructure/services/operational-stream.service';
import { NotificationEntity, NotificationType, NotificationPriority } from '../../../../domain/entities/notifications/notification.entity';
import { UniqueEntityID } from '../../../../common/domain/unique-entity-id';

describe('NotificationEventsHandler', () => {
  let handler: NotificationEventsHandler;
  let gateway: jest.Mocked<NotificationsGateway>;
  let sseService: jest.Mocked<OperationalStreamService>;

  beforeEach(() => {
    gateway = {
      server: {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
      },
    } as any;
    sseService = {
      pushEvent: jest.fn(),
    } as any;
    handler = new NotificationEventsHandler(gateway, sseService);
  });

  it('should handle NotificationCreatedEvent', () => {
    const notification = NotificationEntity.create({
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SALE_COMPLETED,
      priority: NotificationPriority.HIGH,
      title: 'Sale',
      message: 'Sold!',
    }, new UniqueEntityID());

    const event = new NotificationCreatedEvent(notification);

    handler.handleNotificationCreated(event);

    expect(gateway.server.to).toHaveBeenCalledWith('t1:u1');
    expect(gateway.server.emit).toHaveBeenCalledWith('notification_receive', expect.any(Object));
    expect(sseService.pushEvent).toHaveBeenCalledWith('t1', NotificationType.SALE_COMPLETED, expect.objectContaining({
      userId: 'u1',
      title: 'Sale',
    }));
  });

  it('should handle NotificationReadEvent', () => {
    const notification = NotificationEntity.create({
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SALE_COMPLETED,
      priority: NotificationPriority.HIGH,
      title: 'Sale',
      message: 'Sold!',
    }, new UniqueEntityID());

    const event = new NotificationReadEvent(notification);

    // Should not throw or do anything critical for now
    expect(() => handler.handleNotificationRead(event)).not.toThrow();
  });
});
