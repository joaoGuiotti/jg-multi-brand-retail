import { IDomainEvent } from '../../../common/domain/events/domain-event.interface';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Product } from '../../entities/products/product.entity';

export class StockChangedEvent implements IDomainEvent {
  public id: UniqueEntityID;
  public occurredAt: Date;
  public eventVersion: string = '1.0';

  constructor(
    public readonly product: Product,
    public readonly adjustment: number,
    public readonly movementType: string,
    public readonly tenantId: string,
  ) {
    this.id = new UniqueEntityID();
    this.occurredAt = new Date();
  }
}
