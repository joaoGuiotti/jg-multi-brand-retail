import { Module } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../domain/repositories/notifications/notifications.repository.interface';
import { PrismaNotificationsRepository } from '../persistence/notifications/prisma-notifications.repository';
import { CreateNotificationUseCase } from '../../application/use-cases/notifications/create-notification.use-case';
import { GetUserNotificationsUseCase } from '../../application/use-cases/notifications/get-user-notifications.use-case';
import { MarkAsReadUseCase } from '../../application/use-cases/notifications/mark-as-read.use-case';
import { MarkAllAsReadUseCase } from '../../application/use-cases/notifications/mark-all-as-read.use-case';
import { GetUserPreferencesUseCase } from '../../application/use-cases/notifications/get-user-preferences.use-case';
import { UpdatePreferenceUseCase } from '../../application/use-cases/notifications/update-preference.use-case';
import { NotificationsGateway } from '../gateways/notifications.gateway';
import { NotificationDispatcherService } from '../services/notification-dispatcher.service';
import { NotificationsController } from '../controllers/notifications.controller';
import { NotificationsSseController } from '../controllers/notifications-sse.controller';
import { OperationalStreamService } from '../services/operational-stream.service';

@Module({
  controllers: [NotificationsController, NotificationsSseController],
  providers: [
    PrismaService,
    {
      provide: INOTIFICATIONS_REPOSITORY_TOKEN,
      useClass: PrismaNotificationsRepository,
    },
    CreateNotificationUseCase,
    GetUserNotificationsUseCase,
    MarkAsReadUseCase,
    MarkAllAsReadUseCase,
    GetUserPreferencesUseCase,
    UpdatePreferenceUseCase,
    NotificationsGateway,
    NotificationDispatcherService,
    OperationalStreamService,
  ],
  exports: [
    INOTIFICATIONS_REPOSITORY_TOKEN,
    NotificationDispatcherService,
    OperationalStreamService,
  ],
})
export class NotificationsModule {}
