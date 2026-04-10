import { UseCase } from '@common/application/use-case.interface';
import { PaymentRepository } from '@domain/repositories/payment-repository';
import { Injectable } from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export type GetSalePaymentsInput = { tenantId: string; saleId: string };

@Injectable()
export class GetSalePaymentsUseCase implements UseCase<
  GetSalePaymentsInput,
  PaymentOutput[]
> {
  constructor(private paymentRepository: PaymentRepository) {}

  async execute(input: GetSalePaymentsInput): Promise<PaymentOutput[]> {
    const payments = await this.paymentRepository.findBySale(
      input.tenantId,
      input.saleId,
    );
    return payments.map((p) => PaymentOutputMapper.toOutput(p, input.tenantId));
  }
}
