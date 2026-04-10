import { PaginationOutput } from '@common/application/pagination-output';
import { NotificationEntity } from '@domain/entities/notifications/notification.entity';
import type { INotificationsRepository } from '@domain/repositories/notifications/notifications.repository.interface';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '@domain/repositories/notifications/notifications.repository.interface';
import { NotificationFiltersDto } from '@infrastructure/dtos/notifications/notification-filters.dto';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetUserNotificationsUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
    filters: NotificationFiltersDto,
  ): Promise<PaginationOutput<NotificationEntity>> {
    return this.notificationsRepository.getUserNotifications(
      tenantId,
      userId,
      filters.page ?? 1,
      filters.limit ?? 20,
    );
  }
}
