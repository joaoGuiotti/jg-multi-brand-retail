import { INotificationsRepository } from '../../../../domain/repositories/notifications/notifications.repository.interface';
import { MarkAsReadUseCase } from '../mark-as-read.use-case';
import { DomainEventPublisher } from '../../../../common/application/domain-event-publisher';
import {
  NotificationEntity,
  NotificationType,
  NotificationPriority,
} from '../../../../domain/entities/notifications/notification.entity';
import { UniqueEntityID } from '../../../../common/domain/unique-entity-id';
import { NotFoundException } from '@nestjs/common';

describe('MarkAsReadUseCase', () => {
  let useCase: MarkAsReadUseCase;
  let repository: jest.Mocked<INotificationsRepository>;
  let publisher: jest.Mocked<DomainEventPublisher>;

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      markAsRead: jest.fn(),
    } as any;
    publisher = {
      publishEvents: jest.fn(),
    } as any;
    useCase = new MarkAsReadUseCase(repository, publisher);
  });

  it('should call repository and publisher to mark as read', async () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const id = new UniqueEntityID().toString();

    const notification = NotificationEntity.create(
      {
        tenantId,
        userId,
        type: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        title: 'Title',
        message: 'Message',
      },
      new UniqueEntityID(id),
    );

    repository.findById.mockResolvedValue(notification);
    repository.markAsRead.mockResolvedValue(notification);
    publisher.publishEvents.mockResolvedValue(undefined);

    const result = await useCase.execute(tenantId, userId, id);

    expect(result.readAt).toBeDefined();
    expect(repository.findById).toHaveBeenCalledWith(id, tenantId, userId);
    expect(repository.markAsRead).toHaveBeenCalledWith(id, tenantId, userId);
    expect(publisher.publishEvents).toHaveBeenCalledWith(notification);
  });

  it('should throw NotFoundException if notification does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(useCase.execute('t1', 'u1', 'id-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
