import { PaginationOutput, PaginationOutputMapper } from '@common/application/pagination-output';
import { UseCase } from '@common/application/use-case.interface';
import { PaymentFilters, PaymentRepository, PaymentSearchResult } from '@domain/repositories/payment-repository';
import { Injectable } from '@nestjs/common';
import { PaymentOutput, PaymentOutputMapper } from './common/payment-output';

export type ListPaymentsInput = { tenantId: string; filters: PaymentFilters };
export type ListPaymentsOutput = PaginationOutput<PaymentOutput>;

@Injectable()
export class ListPaymentsUseCase implements UseCase<ListPaymentsInput, ListPaymentsOutput> {
    constructor(private paymentRepository: PaymentRepository) { }

    async execute(input: ListPaymentsInput): Promise<ListPaymentsOutput> {
        const result = await this.paymentRepository.findAll(input.tenantId, input.filters);
        return this.toOutput(result, input.tenantId);
    }

    private toOutput(result: PaymentSearchResult, tenantId: string): ListPaymentsOutput {
        const payments = result.data.map(p => PaymentOutputMapper.toOutput(p, tenantId));
        return PaginationOutputMapper.toOutput(payments, {
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
}
