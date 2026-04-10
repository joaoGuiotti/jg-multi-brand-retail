import { NotificationType } from './notification.entity';

export class NotificationPreferenceEntity {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
  sound: boolean;

  constructor(partial: Partial<NotificationPreferenceEntity>) {
    Object.assign(this, partial);
  }
}
