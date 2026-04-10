import { Inject, Injectable } from '@nestjs/common';
import { DomainEventPublisher } from '../../../common/application/domain-event-publisher';
import {
  NotificationEntity,
  NotificationPriority,
} from '../../../domain/entities/notifications/notification.entity';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { CreateNotificationDto } from '../../../infrastructure/dtos/notifications/create-notification.dto';

@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
    private readonly eventPublisher: DomainEventPublisher,
  ) { }

  async execute(
    tenantId: string,
    dto: CreateNotificationDto,
  ): Promise<NotificationEntity> {
    const notification = NotificationEntity.create({
      tenantId,
      userId: dto.userId,
      type: dto.type,
      priority: dto.priority ?? NotificationPriority.MEDIUM,
      title: dto.title,
      message: dto.message,
      data: dto.data,
      actionUrl: dto.actionUrl,
    });

    const created = await this.notificationsRepository.create(notification);

    // Publish events collected in the entity
    await this.eventPublisher.publishEvents(notification);

    return created;
  }
}
