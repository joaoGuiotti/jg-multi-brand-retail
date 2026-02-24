import { UseCase } from '@common/application/use-case.interface';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { PrismaService } from '@infrastructure/persistence/prisma/prisma.service';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export interface CancelPaymentInput {
    tenantId: string;
    id: string;
}

@Injectable()
export class CancelPaymentUseCase implements UseCase<CancelPaymentInput, PaymentOutput> {
    constructor(
        private paymentRepository: PaymentRepository,
        private prisma: PrismaService,
    ) { }

    async execute(input: CancelPaymentInput): Promise<PaymentOutput> {
        const { tenantId, id } = input;

        const payment = await this.paymentRepository.findById(id);

        if (!payment || payment.tenantId !== tenantId) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status === 'CANCELLED') {
            throw new BadRequestException('Payment is already cancelled');
        }

        const sale = await this.prisma.sale.findUnique({
            where: { id: payment.saleId },
        });

        if (sale?.status === 'COMPLETED') {
            throw new BadRequestException(
                'Cannot cancel payment for completed sale. Cancel the sale first.',
            );
        }

        payment.cancel();
        await this.paymentRepository.update(payment);

        return PaymentOutputMapper.toOutput(payment);
    }
}
