import { UseCase } from '@common/application/use-case.interface';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export type GetPaymentInput = { tenantId: string; id: string };

@Injectable()
export class GetPaymentUseCase implements UseCase<GetPaymentInput, PaymentOutput> {
    constructor(private paymentRepository: PaymentRepository) { }

    async execute(input: GetPaymentInput): Promise<PaymentOutput> {
        const payment = await this.paymentRepository.findById(input.id);

        if (!payment || payment.tenantId !== input.tenantId) {
            throw new NotFoundException('Payment not found');
        }

        return PaymentOutputMapper.toOutput(payment);
    }
}
