import { Payment } from '@domain/entities/payments/payment.entity';

export type PaymentOutput = {
  id: string;
  tenantId: string;
  saleId: string;
  method: string;
  amount: number;
  installments: number;
  fee: number;
  status: string;
  paidAt?: Date | null;
  metadata?: any;
  createdAt?: Date;
};

export class PaymentOutputMapper {
  static toOutput(entity: Payment, tenantId: string): PaymentOutput {
    return {
      id: entity.id.toString(),
      tenantId: tenantId,
      saleId: entity.saleId,
      method: entity.method,
      amount: entity.amount,
      installments: entity.installments,
      fee: entity.fee,
      status: entity.status,
      paidAt: entity.paidAt,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
    };
  }
}
