import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationCreatedEvent } from '../../../domain/events/notifications/notification-created.event';
import { NotificationReadEvent } from '../../../domain/events/notifications/notification-read.event';
import { NotificationsGateway } from '../../../infrastructure/gateways/notifications.gateway';
import { OperationalStreamService } from '../../../infrastructure/services/operational-stream.service';

@Injectable()
export class NotificationEventsHandler {
  private readonly logger = new Logger(NotificationEventsHandler.name);

  constructor(
    private readonly notificationsGateway: NotificationsGateway,
    private readonly sseService: OperationalStreamService,
  ) {}

  @OnEvent('notification.created')
  handleNotificationCreated(event: NotificationCreatedEvent) {
    const { notification } = event;
    this.logger.debug(
      `Handling notification.created for user ${notification.userId}`,
    );

    const room = `${notification.tenantId}:${notification.userId}`;
    this.notificationsGateway.server
      .to(room)
      .emit('notification_receive', notification.toJson());

    // Push to Operational SSE Stream
    this.sseService.pushEvent(notification.tenantId, notification.type, {
      notificationId: notification.id.toString(),
      userId: notification.userId,
      title: notification.title,
      priority: notification.priority,
    });
  }

  @OnEvent('notification.read')
  handleNotificationRead(event: NotificationReadEvent) {
    const { notification } = event;
    this.logger.debug(
      `Handling notification.read for notification ${notification.id.toString()}`,
    );

    // Aqui poderíamos emitir um evento via socket para atualizar o contador no frontend se necessário
  }
}
