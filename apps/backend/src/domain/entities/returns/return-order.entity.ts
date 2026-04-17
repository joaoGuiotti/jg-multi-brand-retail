import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { ReturnItem } from './return-item.entity';

export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REFUNDED' | 'REJECTED';
export type RefundType = 'STORE_CREDIT' | 'CASH_REFUND' | 'EXCHANGE';

export interface ReturnOrderProps {
  tenantId: string;
  saleId: string;
  userId: string;
  customerId?: string | null;
  status: ReturnStatus;
  refundType: RefundType;
  reason?: string | null;
  totalRefund: number;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  processedAt?: Date | null;
  createdAt?: Date;
  items: ReturnItem[];
}

export class ReturnOrder extends AggregateRoot<ReturnOrderProps> {
  private constructor(props: ReturnOrderProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: ReturnOrderProps, id?: UniqueEntityID): ReturnOrder {
    const returnOrder = new ReturnOrder(
      {
        ...props,
        status: props.status ?? 'REQUESTED',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return returnOrder;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get saleId(): string {
    return this.props.saleId;
  }
  get userId(): string {
    return this.props.userId;
  }
  get customerId(): string | undefined | null {
    return this.props.customerId;
  }
  get status(): ReturnStatus {
    return this.props.status;
  }
  get refundType(): RefundType {
    return this.props.refundType;
  }
  get reason(): string | undefined | null {
    return this.props.reason;
  }
  get totalRefund(): number {
    return this.props.totalRefund;
  }
  get approvedBy(): string | undefined | null {
    return this.props.approvedBy;
  }
  get approvedAt(): Date | undefined | null {
    return this.props.approvedAt;
  }
  get processedAt(): Date | undefined | null {
    return this.props.processedAt;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get items(): ReturnItem[] {
    return this.props.items;
  }

  public approve(adminId: string): void {
    if (this.props.status !== 'REQUESTED') {
      throw new Error('Only requested returns can be approved');
    }
    this.props.status = 'APPROVED';
    this.props.approvedBy = adminId;
    this.props.approvedAt = new Date();
  }

  public reject(adminId: string, reason?: string): void {
    if (this.props.status !== 'REQUESTED') {
      throw new Error('Only requested returns can be rejected');
    }
    this.props.status = 'REJECTED';
    this.props.approvedBy = adminId;
    this.props.approvedAt = new Date();
    if (reason) {
      this.props.reason = reason;
    }
  }

  public processRefund(): void {
    if (this.props.status !== 'APPROVED') {
      throw new Error('Only approved returns can be processed for refund');
    }
    this.props.status = 'REFUNDED';
    this.props.processedAt = new Date();
  }
}
