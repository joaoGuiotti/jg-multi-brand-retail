import { Injectable, Inject } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';

@Injectable()
export class MarkAllAsReadUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(tenantId: string, userId: string): Promise<number> {
    return this.notificationsRepository.markAllAsRead(tenantId, userId);
  }
}
