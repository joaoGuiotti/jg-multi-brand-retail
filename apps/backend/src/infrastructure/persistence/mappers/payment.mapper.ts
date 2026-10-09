import { Payment as PrismaPayment } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Payment } from '../../../domain/entities/payments/payment.entity';

export class PaymentMapper {
  static toDomain(raw: PrismaPayment): Payment {
    return Payment.create(
      {
        saleId: raw.saleId,
        method: raw.method,
        amount: raw.amount.toNumber(),
        installments: raw.installments,
        fee: raw.fee.toNumber(),
        status: raw.status,
        paidAt: raw.paidAt,
        metadata: raw.metadata,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(payment: Payment) {
    return {
      id: payment.id.toString(),
      saleId: payment.saleId,
      method: payment.method,
      amount: payment.amount,
      installments: payment.installments,
      fee: payment.fee,
      status: payment.status,
      paidAt: payment.paidAt,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
    };
  }
}
