import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { NotificationEntity } from '../../../domain/entities/notifications/notification.entity';
import { DomainEventPublisher } from '../../../common/application/domain-event-publisher';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<NotificationEntity> {
    const notification = await this.notificationsRepository.findById(
      notificationId,
      tenantId,
      userId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.markAsRead();

    // Persist changes
    const updated = await this.notificationsRepository.markAsRead(
      notificationId,
      tenantId,
      userId,
    );

    // Publish events (NotificationReadEvent)
    await this.eventPublisher.publishEvents(notification);

    return updated || notification;
  }
}
