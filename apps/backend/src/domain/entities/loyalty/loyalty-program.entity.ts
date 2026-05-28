import { AggregateRoot } from '../../../common/domain/aggregate-root';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';

export interface LoyaltyProgramProps {
  tenantId: string;
  name: string;
  pointsPerReal: number;
  redeemRatio: number;
  minRedeemPoints: number;
  maxDiscountPct: number;
  expirationDays?: number | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class LoyaltyProgram extends AggregateRoot<LoyaltyProgramProps> {
  private constructor(props: LoyaltyProgramProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static create(
    props: LoyaltyProgramProps,
    id?: UniqueEntityID,
  ): LoyaltyProgram {
    return new LoyaltyProgram(
      {
        ...props,
        name: props.name ?? 'Programa de Fidelidade',
        pointsPerReal: props.pointsPerReal ?? 1.0,
        redeemRatio: props.redeemRatio ?? 0.01,
        minRedeemPoints: props.minRedeemPoints ?? 100,
        maxDiscountPct: props.maxDiscountPct ?? 50.0,
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId(): string {
    return this.props.tenantId;
  }
  get name(): string {
    return this.props.name;
  }
  get pointsPerReal(): number {
    return this.props.pointsPerReal;
  }
  get redeemRatio(): number {
    return this.props.redeemRatio;
  }
  get minRedeemPoints(): number {
    return this.props.minRedeemPoints;
  }
  get maxDiscountPct(): number {
    return this.props.maxDiscountPct;
  }
  get expirationDays(): number | undefined | null {
    return this.props.expirationDays;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }
  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  public update(
    props: Partial<Omit<LoyaltyProgramProps, 'tenantId' | 'createdAt'>>,
  ): void {
    if (props.pointsPerReal !== undefined && props.pointsPerReal <= 0) {
      throw new Error('Points per real must be greater than zero');
    }
    if (props.redeemRatio !== undefined && props.redeemRatio <= 0) {
      throw new Error('Redeem ratio must be greater than zero');
    }
    if (props.minRedeemPoints !== undefined && props.minRedeemPoints < 1) {
      throw new Error('Minimum redeem points must be at least 1');
    }
    if (
      props.maxDiscountPct !== undefined &&
      (props.maxDiscountPct < 0.1 || props.maxDiscountPct > 100)
    ) {
      throw new Error('Max discount percentage must be between 0.1 and 100');
    }

    Object.assign(this.props, {
      ...props,
      updatedAt: new Date(),
    });
  }
}
