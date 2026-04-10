import { NotificationPresenter, NotificationCollectionPresenter } from '../notification.presenter';
import { NotificationType, NotificationPriority } from '@domain/entities/notifications/notification.entity';

describe('NotificationPresenter', () => {
  const mockNotification = {
    id: '1',
    tenantId: 't1',
    userId: 'u1',
    title: 'Test',
    message: 'Message',
    type: NotificationType.SYSTEM,
    priority: NotificationPriority.LOW,
    read: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('should format a single notification', () => {
    const presenter = new NotificationPresenter(mockNotification as any);
    
    expect(presenter.id).toBe('1');
    expect(presenter.title).toBe('Test');
    expect(presenter.message).toBe('Message');
  });

  it('should format a collection of notifications', () => {
    const collection = {
      data: [mockNotification],
      meta: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    const presenter = new NotificationCollectionPresenter(collection as any);
    
    expect(presenter.data).toHaveLength(1);
    expect(presenter.meta.total).toBe(1);
  });
});
