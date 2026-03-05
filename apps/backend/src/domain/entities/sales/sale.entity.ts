import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export type SaleStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface SaleItemProps {
    productId: string;
    product?: {
        name: string;
        sku: string;
    } | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

export class SaleItem extends Entity<SaleItemProps> {
    private constructor(props: SaleItemProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: SaleItemProps, id?: UniqueEntityID): SaleItem {
        return new SaleItem(props, id);
    }

    get productId(): string { return this.props.productId; }
    get product(): { name: string; sku: string } | undefined | null { return this.props.product; }
    get quantity(): number { return this.props.quantity; }
    get unitPrice(): number { return this.props.unitPrice; }
    get discount(): number { return this.props.discount; }
    get total(): number { return this.props.total; }
}

export interface SaleProps {
    userId: string;
    invoiceNumber?: string | null;
    subtotal: number;
    discount: number;
    total: number;
    status: SaleStatus;
    items: SaleItem[];
    createdAt?: Date;
    updatedAt?: Date;
}

export class Sale extends AggregateRoot<SaleProps> {
    private constructor(props: SaleProps, id?: UniqueEntityID) {
        super(props, id);
    }

    public static create(props: SaleProps, id?: UniqueEntityID): Sale {
        const sale = new Sale(
            {
                ...props,
                status: props.status ?? 'PENDING',
                createdAt: props.createdAt ?? new Date(),
                updatedAt: props.updatedAt ?? new Date(),
            },
            id,
        );

        return sale;
    }

    get userId(): string { return this.props.userId; }
    get invoiceNumber(): string | undefined | null { return this.props.invoiceNumber; }
    get subtotal(): number { return this.props.subtotal; }
    get discount(): number { return this.props.discount; }
    get total(): number { return this.props.total; }
    get status(): SaleStatus { return this.props.status; }
    get items(): SaleItem[] { return this.props.items; }
    get createdAt(): Date | undefined { return this.props.createdAt; }
    get updatedAt(): Date | undefined { return this.props.updatedAt; }

    public cancel(): void {
        if (this.props.status === 'CANCELLED') {
            throw new Error('Sale already cancelled');
        }
        if (this.props.status === 'COMPLETED') {
            throw new Error('Cannot cancel a completed sale');
        }
        this.props.status = 'CANCELLED';
        this.props.updatedAt = new Date();
    }

    public complete(totalPaid: number): void {
        if (this.props.status === 'CANCELLED') {
            throw new Error('Cannot complete a cancelled sale');
        }
        if (this.props.status === 'COMPLETED') {
            throw new Error('Sale already completed');
        }
        if (totalPaid < this.props.total) {
            throw new Error(`Insufficient payments. Required: ${this.props.total}, Paid: ${totalPaid}`);
        }
        this.props.status = 'COMPLETED';
        this.props.updatedAt = new Date();
    }
}
