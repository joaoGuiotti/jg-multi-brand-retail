import { Injectable, Inject } from '@nestjs/common';
import { INOTIFICATIONS_REPOSITORY_TOKEN } from '../../../domain/repositories/notifications/notifications.repository.interface';
import type { INotificationsRepository } from '../../../domain/repositories/notifications/notifications.repository.interface';
import { NotificationPreferenceEntity } from '../../../domain/entities/notifications/notification-preference.entity';
import { UpdatePreferenceDto } from '../../../infrastructure/dtos/notifications/update-preference.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UpdatePreferenceUseCase {
  constructor(
    @Inject(INOTIFICATIONS_REPOSITORY_TOKEN)
    private readonly notificationsRepository: INotificationsRepository,
  ) {}

  async execute(tenantId: string, userId: string, dto: UpdatePreferenceDto): Promise<NotificationPreferenceEntity> {
    const preference = new NotificationPreferenceEntity({
      id: uuidv4(),
      tenantId,
      userId,
      type: dto.type,
      enabled: dto.enabled,
      sound: dto.sound,
    });

    return this.notificationsRepository.updatePreference(preference);
  }
}
