export interface LoyaltyProgram {
  id?: string;
  tenantId?: string;
  name?: string;
  pointsPerReal: number;
  redeemRatio: number;
  minRedeemPoints: number;
  maxDiscountPct: number;
  active: boolean;
  expirationDays?: number | null;
}
