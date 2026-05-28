import { IDomainEvent } from '../../../common/domain/events/domain-event.interface';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Sale } from '../../entities/sales/sale.entity';

export class SaleCompletedEvent implements IDomainEvent {
  public id: UniqueEntityID;
  public occurredAt: Date;
  public eventVersion: string = '1.0';

  constructor(
    public readonly sale: Sale,
    public readonly tenantId: string,
  ) {
    this.id = new UniqueEntityID();
    this.occurredAt = new Date();
  }
}
