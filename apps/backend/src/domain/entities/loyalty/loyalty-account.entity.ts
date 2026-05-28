import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface LoyaltyAccountProps {
  tenantId: string;
  customerId: string;
  loyaltyProgramId: string;
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  createdAt?: Date;
}

export class LoyaltyAccount extends AggregateRoot<LoyaltyAccountProps> {
  private constructor(props: LoyaltyAccountProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: LoyaltyAccountProps,
    id?: UniqueEntityID,
  ): LoyaltyAccount {
    return new LoyaltyAccount(
      {
        ...props,
        balance: props.balance ?? 0,
        totalEarned: props.totalEarned ?? 0,
        totalRedeemed: props.totalRedeemed ?? 0,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get customerId(): string {
    return this.props.customerId;
  }
  get loyaltyProgramId(): string {
    return this.props.loyaltyProgramId;
  }
  get balance(): number {
    return this.props.balance;
  }
  get totalEarned(): number {
    return this.props.totalEarned;
  }
  get totalRedeemed(): number {
    return this.props.totalRedeemed;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  /**
   * Acumula pontos baseados em uma compra
   */
  public earnPoints(points: number): void {
    if (points <= 0) {
      throw new Error('Points to earn must be greater than zero');
    }
    this.props.balance += points;
    this.props.totalEarned += points;
  }

  /**
   * Resgata pontos como desconto no PDV
   */
  public redeemPoints(points: number, minPoints: number): void {
    if (points <= 0) {
      throw new Error('Points to redeem must be greater than zero');
    }
    if (this.props.balance < minPoints) {
      throw new Error(`Customer needs at least ${minPoints} points to redeem`);
    }
    if (this.props.balance < points) {
      throw new Error('Insufficient points balance');
    }
    this.props.balance -= points;
    this.props.totalRedeemed += points;
  }

  /**
   * Ajusta o saldo manualmente (crédito ou débito) administrado por ADMIN.
   * Permite diminuir pontos (points negativo).
   */
  public adjustPoints(points: number): void {
    if (points === 0) {
      throw new Error('Points to adjust cannot be zero');
    }
    this.props.balance += points;
    if (points > 0) {
      this.props.totalEarned += points;
    } else {
      this.props.totalRedeemed += Math.abs(points);
    }
  }

  /**
   * Reverte pontos em caso de devolução/estorno de venda (RMA).
   * Pode deixar o saldo negativo se o cliente já tiver resgatado os pontos.
   */
  public reversePoints(points: number): void {
    if (points <= 0) {
      throw new Error('Points to reverse must be greater than zero');
    }
    this.props.balance -= points;
    // Ajusta o totalEarned histórico para refletir o estorno da compra
    this.props.totalEarned = Math.max(0, this.props.totalEarned - points);
  }
}
