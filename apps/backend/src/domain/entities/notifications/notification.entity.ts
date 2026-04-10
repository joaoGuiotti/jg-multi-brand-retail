export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURN_APPROVED = 'RETURN_APPROVED',
  PROMOTION_EXPIRING = 'PROMOTION_EXPIRING',
  SALE_COMPLETED = 'SALE_COMPLETED',
  COMMISSION_CALCULATED = 'COMMISSION_CALCULATED',
  SYSTEM = 'SYSTEM',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export class NotificationEntity {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  readAt?: Date;
  createdAt: Date;

  constructor(partial: Partial<NotificationEntity>) {
    Object.assign(this, partial);
  }
}
