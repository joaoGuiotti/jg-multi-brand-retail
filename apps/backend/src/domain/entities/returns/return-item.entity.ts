import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export type ReturnItemCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE';

export interface ReturnItemProps {
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: ReturnItemCondition;
}

export class ReturnItem extends Entity<ReturnItemProps> {
  private constructor(props: ReturnItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ReturnItemProps, id?: UniqueEntityID): ReturnItem {
    return new ReturnItem(
      {
        ...props,
        condition: props.condition ?? 'GOOD',
      },
      id,
    );
  }

  get productId(): string {
    return this.props.productId;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get total(): number {
    return this.props.total;
  }
  get condition(): ReturnItemCondition {
    return this.props.condition;
  }
}
