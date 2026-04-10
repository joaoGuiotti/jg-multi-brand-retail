import { NotificationEntity, NotificationType } from '../../entities/notifications/notification.entity';
import { NotificationPreferenceEntity } from '../../entities/notifications/notification-preference.entity';
import { PaginationOutput } from '@common/application/pagination-output';

export interface INotificationsRepository {
  create(notification: NotificationEntity): Promise<NotificationEntity>;
  markAsRead(id: string, tenantId: string, userId: string): Promise<NotificationEntity | null>;
  markAllAsRead(tenantId: string, userId: string): Promise<number>;
  getUserNotifications(tenantId: string, userId: string, page: number, limit: number): Promise<PaginationOutput<NotificationEntity>>;
  getUnreadCount(tenantId: string, userId: string): Promise<number>;
  
  getUserPreferences(tenantId: string, userId: string): Promise<NotificationPreferenceEntity[]>;
  updatePreference(preference: NotificationPreferenceEntity): Promise<NotificationPreferenceEntity>;
  getPreferenceByType(tenantId: string, userId: string, type: NotificationType): Promise<NotificationPreferenceEntity | null>;
}

export const INOTIFICATIONS_REPOSITORY_TOKEN = Symbol('INotificationsRepository');
