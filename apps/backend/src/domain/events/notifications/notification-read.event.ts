import { IDomainEvent } from '../../../common/domain/events/domain-event.interface';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { NotificationEntity } from '../../entities/notifications/notification.entity';

export class NotificationReadEvent implements IDomainEvent {
  public id: UniqueEntityID;
  public occurredAt: Date;
  public eventVersion: string = '1.0';

  constructor(public readonly notification: NotificationEntity) {
    this.id = new UniqueEntityID();
    this.occurredAt = new Date();
  }
}
