import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { NotificationEntity } from '../../../domain/entities/notifications/notification.entity';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    notificationId: string,
  ): Promise<NotificationEntity> {
    const updated = await this.notificationsRepository.markAsRead(
      notificationId,
      tenantId,
      userId,
    );
    if (!updated) {
      throw new NotFoundException('Notification not found or already read');
    }
    return updated;
  }
}
