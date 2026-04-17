import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { NotificationCreatedEvent } from '../../events/notifications/notification-created.event';
import { NotificationReadEvent } from '../../events/notifications/notification-read.event';

export enum NotificationType {
  LOW_STOCK = 'LOW_STOCK',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  GOAL_ACHIEVED = 'GOAL_ACHIEVED',
  RETURN_PENDING = 'RETURN_PENDING',
  RETURN_APPROVED = 'RETURN_APPROVED',
  RETURN_REJECTED = 'RETURN_REJECTED',
  RETURN_REFUNDED = 'RETURN_REFUNDED',
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

export interface NotificationProps {
  tenantId: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
  readAt?: Date | null;
  createdAt?: Date;
}

export class NotificationEntity extends AggregateRoot<NotificationProps> {
  private constructor(props: NotificationProps, id?: UniqueEntityID) {
    super(props, id);
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get type(): NotificationType {
    return this.props.type;
  }
  get priority(): NotificationPriority {
    return this.props.priority;
  }
  get title(): string {
    return this.props.title;
  }
  get message(): string {
    return this.props.message;
  }
  get data(): Record<string, any> | undefined {
    return this.props.data;
  }
  get actionUrl(): string | undefined {
    return this.props.actionUrl;
  }
  get readAt(): Date | undefined | null {
    return this.props.readAt;
  }
  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  public static create(
    props: NotificationProps,
    id?: UniqueEntityID,
  ): NotificationEntity {
    const notification = new NotificationEntity(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        readAt: props.readAt ?? null,
      },
      id,
    );

    const isNew = !id;
    if (isNew) {
      notification.applyEvent(new NotificationCreatedEvent(notification));
    }

    return notification;
  }

  public markAsRead(): void {
    if (!this.props.readAt) {
      this.props.readAt = new Date();
      this.applyEvent(new NotificationReadEvent(this));
    }
  }

  public toJson() {
    return {
      id: this.id.toString(),
      tenantId: this.props.tenantId,
      userId: this.props.userId,
      type: this.props.type,
      priority: this.props.priority,
      title: this.props.title,
      message: this.props.message,
      data: this.props.data,
      actionUrl: this.props.actionUrl,
      readAt: this.props.readAt,
      createdAt: this.createdAt,
    };
  }
}
