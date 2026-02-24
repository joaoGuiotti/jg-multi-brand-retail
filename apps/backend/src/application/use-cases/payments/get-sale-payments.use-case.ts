import { UseCase } from '@common/application/use-case.interface';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { Injectable } from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export type GetSalePaymentsInput = { saleId: string };

@Injectable()
export class GetSalePaymentsUseCase implements UseCase<GetSalePaymentsInput, PaymentOutput[]> {
    constructor(private paymentRepository: PaymentRepository) { }

    async execute(input: GetSalePaymentsInput): Promise<PaymentOutput[]> {
        const payments = await this.paymentRepository.findBySale(input.saleId);
        return payments.map(PaymentOutputMapper.toOutput);
    }
}
