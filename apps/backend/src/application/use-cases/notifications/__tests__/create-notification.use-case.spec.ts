import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { CreateNotificationUseCase } from '../create-notification.use-case';
import { DomainEventPublisher } from '../../../../common/application/domain-event-publisher';
import { NotificationType, NotificationPriority } from '../../../../domain/entities/notifications/notification.entity';

describe('CreateNotificationUseCase', () => {
  let useCase: CreateNotificationUseCase;
  let repository: jest.Mocked<INotificationsRepository>;
  let publisher: jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
    } as any;
    publisher = {
      publishEvents: jest.fn(),
    } as any;
    useCase = new CreateNotificationUseCase(repository, publisher);
  });

  it('should create a notification and publish events', async () => {
    const tenantId = 'tenant-1';
    const dto = {
      userId: 'user-1',
      type: NotificationType.SALE_COMPLETED,
      priority: NotificationPriority.HIGH,
      title: 'New Sale',
      message: 'You made a sale!',
    };

    repository.create.mockImplementation(async (n) => n);
    publisher.publishEvents.mockResolvedValue(undefined);

    const result = await useCase.execute(tenantId, dto);

    expect(result.tenantId).toBe(tenantId);
    expect(result.userId).toBe(dto.userId);
    expect(result.title).toBe(dto.title);
    expect(repository.create).toHaveBeenCalled();
    expect(publisher.publishEvents).toHaveBeenCalled();
  });
});
