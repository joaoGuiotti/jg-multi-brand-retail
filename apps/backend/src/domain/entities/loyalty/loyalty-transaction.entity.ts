import { Entity } from '../../../common/domain/entity';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUST';

export interface LoyaltyTransactionProps {
  tenantId: string;
  accountId: string;
  type: LoyaltyTransactionType;
  points: number;
  saleId?: string | null;
  reason?: string | null;
  createdAt?: Date;
}

export class LoyaltyTransaction extends Entity<LoyaltyTransactionProps> {
  private constructor(props: LoyaltyTransactionProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: LoyaltyTransactionProps,
    id?: UniqueEntityID,
  ): LoyaltyTransaction {
    if (props.type === 'ADJUST' && !props.reason && props.points !== 0) {
      // Justificativa obrigatória para ajustes manuais no domínio
      if (!props.reason || props.reason.trim().length < 10) {
        throw new Error(
          'A detailed reason (at least 10 chars) is required for manual adjustments',
        );
      }
    }

    return new LoyaltyTransaction(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get accountId(): string {
    return this.props.accountId;
  }
  get type(): LoyaltyTransactionType {
    return this.props.type;
  }
  get points(): number {
    return this.props.points;
  }
  get saleId(): string | undefined | null {
    return this.props.saleId;
  }
  get reason(): string | undefined | null {
    return this.props.reason;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
}
