import { Injectable, Inject } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { NotificationPreferenceEntity } from '../../../domain/entities/notifications/notification-preference.entity';

@Injectable()
export class GetUserPreferencesUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(
    tenantId: string,
    userId: string,
  ): Promise<NotificationPreferenceEntity[]> {
    return this.notificationsRepository.getUserPreferences(tenantId, userId);
  }
}
