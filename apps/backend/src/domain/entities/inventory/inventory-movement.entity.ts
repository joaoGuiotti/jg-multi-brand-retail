import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { InventoryMovementType } from './inventory-movement-type.vo';

export interface InventoryMovementProps {
    productId: string;
    userId: string;
    type: InventoryMovementType;
    quantity: number;
    reference?: string | null;
    createdAt?: Date;
}

export class InventoryMovement extends AggregateRoot<InventoryMovementProps> {
    private constructor(props: InventoryMovementProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: InventoryMovementProps, id?: UniqueEntityID): InventoryMovement {
        const movement = new InventoryMovement(
            {
                ...props,
                createdAt: props.createdAt ?? new Date(),
            },
            id,
        );

        return movement;
    }

    get productId(): string { return this.props.productId; }
    get userId(): string { return this.props.userId; }
    get type(): InventoryMovementType { return this.props.type; }
    get quantity(): number { return this.props.quantity; }
    get reference(): string | undefined | null { return this.props.reference; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
}
