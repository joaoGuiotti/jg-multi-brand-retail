import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { SaleCompletedEvent } from '../../events/sales/sale-completed.event';

export type SaleStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CANCELLED';

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
  costPriceAtSale?: number;
}

export class SaleItem extends Entity<SaleItemProps> {
  private constructor(props: SaleItemProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: SaleItemProps, id?: UniqueEntityID): SaleItem {
    return new SaleItem(props, id);
  }

  get productId(): string {
    return this.props.productId;
  }
  get product(): { name: string; sku: string } | undefined | null {
    return this.props.product;
  }
  get quantity(): number {
    return this.props.quantity;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get discount(): number {
    return this.props.discount;
  }
  get total(): number {
    return this.props.total;
  }
  get costPriceAtSale(): number | undefined {
    return this.props.costPriceAtSale;
  }
}

export interface SaleProps {
  userId: string;
  customerId?: string | null;
  customerName?: string | null;
  invoiceNumber?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: SaleStatus;
  items: SaleItem[];
  createdAt?: Date;
  updatedAt?: Date;
  payments?: any[];
  returns?: any[];
}

export class Sale extends AggregateRoot<SaleProps> {
  private constructor(props: SaleProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: SaleProps, id?: UniqueEntityID): Sale {
    return new Sale(
      {
        ...props,
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
        payments: props.payments ?? [],
        returns: props.returns ?? [],
      },
      id,
    );
  }

  get userId(): string {
    return this.props.userId;
  }
  get customerId(): string | undefined | null {
    return this.props.customerId;
  }
  get customerName(): string | undefined | null {
    return this.props.customerName;
  }
  get invoiceNumber(): string | undefined | null {
    return this.props.invoiceNumber;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get discount(): number {
    return this.props.discount;
  }
  get total(): number {
    return this.props.total;
  }
  get status(): SaleStatus {
    return this.props.status;
  }
  get items(): SaleItem[] {
    return this.props.items;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }
  get payments(): any[] {
    return this.props.payments || [];
  }
  get returns(): any[] {
    return this.props.returns || [];
  }

  // ── FSM transitions ──────────────────────────────────────────

  /** PENDING → COMPLETED. Requires totalPaid >= sale total. */
  public complete(totalPaid: number, tenantId: string): void {
    if (this.props.status === 'CANCELLED') {
      throw new Error('Cannot complete a cancelled sale');
    }
    if (this.props.status === 'COMPLETED') {
      throw new Error('Sale already completed');
    }
    if (totalPaid < this.props.total) {
      throw new Error(
        `Insufficient payments. Required: ${this.props.total}, Paid: ${totalPaid}`,
      );
    }
    this.props.status = 'COMPLETED';
    this.props.updatedAt = new Date();

    if (!this.props.invoiceNumber) {
      const date = new Date();
      const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      this.props.invoiceNumber = `INV-${datePart}-${randomPart}`;
    }

    this.applyEvent(new SaleCompletedEvent(this, tenantId));
  }

  /** PENDING → CANCELLED. Completed/returning/returned sales cannot be cancelled. */
  public cancel(): void {
    if (this.props.status === 'CANCELLED') {
      throw new Error('Sale already cancelled');
    }
    if (
      this.props.status === 'COMPLETED' ||
      this.props.status === 'RETURN_REQUESTED' ||
      this.props.status === 'RETURNED'
    ) {
      throw new Error(`Cannot cancel a sale with status: ${this.props.status}`);
    }
    this.props.status = 'CANCELLED';
    this.props.updatedAt = new Date();
  }

  /** COMPLETED → RETURN_REQUESTED. Called when a return is initiated by the customer. */
  public requestReturn(): void {
    if (this.props.status !== 'COMPLETED') {
      throw new Error(
        `Can only request a return for a COMPLETED sale. Current: ${this.props.status}`,
      );
    }
    this.props.status = 'RETURN_REQUESTED';
    this.props.updatedAt = new Date();
  }

  /** RETURN_REQUESTED → RETURNED. Called when the refund is processed by an admin. */
  public completeReturn(): void {
    if (this.props.status !== 'RETURN_REQUESTED') {
      throw new Error(
        `Can only complete return for a RETURN_REQUESTED sale. Current: ${this.props.status}`,
      );
    }
    this.props.status = 'RETURNED';
    this.props.updatedAt = new Date();
  }

  /** RETURN_REQUESTED → COMPLETED. Called when a return is rejected by an admin. */
  public rejectReturn(): void {
    if (this.props.status !== 'RETURN_REQUESTED') {
      throw new Error(
        `Can only reject return for a RETURN_REQUESTED sale. Current: ${this.props.status}`,
      );
    }
    this.props.status = 'COMPLETED';
    this.props.updatedAt = new Date();
  }
}
