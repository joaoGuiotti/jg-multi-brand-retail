import { NotificationEntity, NotificationType, NotificationPriority } from '../notification.entity';
import { UniqueEntityID } from '../../../../common/domain/unique-entity-id';
import { NotificationCreatedEvent } from '../../../events/notifications/notification-created.event';
import { NotificationReadEvent } from '../../../events/notifications/notification-read.event';

describe('NotificationEntity', () => {
  it('should create a notification and apply NotificationCreatedEvent', () => {
    const props = {
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Hi',
      message: 'Hello',
    };

    const notification = NotificationEntity.create(props);

    expect(notification.id).toBeDefined();
    expect(notification.tenantId).toBe(props.tenantId);
    expect(notification.getUncommittedEvents()).toHaveLength(1);
    expect(notification.getUncommittedEvents()[0]).toBeInstanceOf(NotificationCreatedEvent);
  });

  it('should not apply NotificationCreatedEvent if ID is provided (loading from DB)', () => {
    const props = {
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Hi',
      message: 'Hello',
    };
    const id = new UniqueEntityID();

    const notification = NotificationEntity.create(props, id);

    expect(notification.id.equals(id)).toBe(true);
    expect(notification.getUncommittedEvents()).toHaveLength(0);
  });

  it('should mark as read and apply NotificationReadEvent', () => {
    const notification = NotificationEntity.create({
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Hi',
      message: 'Hello',
    }, new UniqueEntityID());

    notification.markAsRead();

    expect(notification.readAt).toBeDefined();
    expect(notification.getUncommittedEvents()).toHaveLength(1);
    expect(notification.getUncommittedEvents()[0]).toBeInstanceOf(NotificationReadEvent);
  });

  it('should not apply NotificationReadEvent if already read', () => {
    const notification = NotificationEntity.create({
      tenantId: 't1',
      userId: 'u1',
      type: NotificationType.SYSTEM,
      priority: NotificationPriority.LOW,
      title: 'Hi',
      message: 'Hello',
      readAt: new Date(),
    }, new UniqueEntityID());

    notification.markAsRead();

    expect(notification.getUncommittedEvents()).toHaveLength(0);
  });
});
