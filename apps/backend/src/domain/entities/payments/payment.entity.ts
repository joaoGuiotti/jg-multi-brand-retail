import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export type PaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'BOLETO'
  | 'STORE_CREDIT';
export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface PaymentProps {
  saleId: string;
  method: PaymentMethod;
  amount: number;
  installments: number;
  fee: number;
  status: PaymentStatus;
  paidAt?: Date | null;
  metadata?: any;
  createdAt?: Date;
}

export class Payment extends AggregateRoot<PaymentProps> {
  private constructor(props: PaymentProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(props: PaymentProps, id?: UniqueEntityID): Payment {
    const payment = new Payment(
      {
        ...props,
        status: props.status ?? 'PAID',
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );

    return payment;
  }

  get saleId(): string {
    return this.props.saleId;
  }

  get amount(): number {
    return this.props.amount;
  }

  get status(): PaymentStatus {
    return this.props.status;
  }

  get method(): PaymentMethod {
    return this.props.method;
  }

  get installments(): number {
    return this.props.installments;
  }

  get fee(): number {
    return this.props.fee;
  }

  get paidAt(): Date | undefined | null {
    return this.props.paidAt;
  }

  get metadata(): any {
    return this.props.metadata;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  public cancel(): void {
    if (this.props.status === 'CANCELLED') {
      throw new Error('Payment already cancelled');
    }
    this.props.status = 'CANCELLED';
  }
}
