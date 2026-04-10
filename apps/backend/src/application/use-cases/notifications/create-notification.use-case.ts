import { Injectable, Inject } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { CreateNotificationDto } from '../../../infrastructure/dtos/notifications/create-notification.dto';
import { NotificationEntity, NotificationPriority } from '../../../domain/entities/notifications/notification.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(tenantId: string, dto: CreateNotificationDto): Promise<NotificationEntity> {
    const notification = new NotificationEntity({
      id: uuid(),
      tenantId,
      userId: dto.userId,
      type: dto.type,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      actionUrl: dto.actionUrl,
      createdAt: new Date(),
    });

    return this.notificationsRepository.create(notification);
  }
}
