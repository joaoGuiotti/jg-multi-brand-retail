import { Injectable, Logger, Inject } from '@nestjs/common';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { CreateNotificationUseCase } from '../../application/use-cases/notifications/create-notification.use-case';
import { CreateNotificationDto } from '../dtos/notifications/create-notification.dto';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../domain/repositories/notifications/notifications.repository.interface';
import { OperationalStreamService } from './operational-stream.service';

@Injectable()
export class NotificationDispatcherService {
  private readonly logger = new Logger(NotificationDispatcherService.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
    private readonly sseService: OperationalStreamService,
  ) {}

  async dispatch(tenantId: string, dto: CreateNotificationDto): Promise<void> {
    try {
      // Check user preferences before dispatching
      const preference = await this.notificationsRepository.getPreferenceByType(
        tenantId,
        dto.userId,
        dto.type,
      );

      // If preference exists and is disabled, we skip the notification
      if (preference && !preference.enabled) {
        this.logger.debug(
          `Notification suppressed for user ${dto.userId} due to preference: ${dto.type}`,
        );
        return;
      }

      const notification = await this.createNotificationUseCase.execute(
        tenantId,
        dto,
      );

      const room = `${tenantId}:${dto.userId}`;
      this.notificationsGateway.server
        .to(room)
        .emit('notification_receive', notification);

      // Push to Operational SSE Stream
      this.sseService.pushEvent(tenantId, dto.type, {
        notificationId: notification.id,
        userId: dto.userId,
        title: dto.title,
        priority: dto.priority,
      });

      this.logger.debug(
        `Dispatched notification ${notification.id} to room ${room}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to dispatch notification to user ${dto.userId}:`,
        error.stack,
      );
    }
  }
}
