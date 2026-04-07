import { UseCase } from '@common/application/use-case.interface';
import {
  Payment,
  PaymentMethod,
} from '@domain/entities/payments/payment.entity';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export interface CreatePaymentInput {
  tenantId: string;
  saleId: string;
  method: PaymentMethod;
  amount: number;
  installments: number;
  fee: number;
}

@Injectable()
export class CreatePaymentUseCase implements UseCase<
  CreatePaymentInput,
  PaymentOutput
> {
  constructor(
    private paymentRepository: PaymentRepository,
    private prisma: PrismaService,
  ) {}

  async execute(input: CreatePaymentInput): Promise<PaymentOutput> {
    const { tenantId, saleId, method, amount } = input;

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { payments: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add payment to cancelled sale');
    }

    const totalPaid = sale.payments.reduce(
      (sum, p) => sum + p.amount.toNumber(),
      0,
    );
    const saleTotal = sale.total.toNumber();
    const remaining = saleTotal - totalPaid;

    if (amount > remaining) {
      throw new BadRequestException(
        `Payment amount (${amount}) exceeds remaining balance (${remaining})`,
      );
    }

    const payment = Payment.create({
      saleId,
      method,
      amount,
      installments: input.installments || 1,
      fee: input.fee || 0,
      status: 'PAID',
    });

    await this.paymentRepository.create(tenantId, payment);

    const newTotalPaid = totalPaid + amount;
    if (newTotalPaid >= saleTotal && sale.status === 'PENDING') {
      await this.prisma.sale.update({
        where: { id: saleId },
        data: { status: 'COMPLETED' },
      });
    }

    return PaymentOutputMapper.toOutput(payment, tenantId);
  }
}
