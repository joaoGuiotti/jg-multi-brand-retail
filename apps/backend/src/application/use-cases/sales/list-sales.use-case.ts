import { PaginationOutput, PaginationOutputMapper } from '@common/application/pagination-output';
import { Injectable } from '@nestjs/common';
import { UseCase } from '../../../common/application/use-case.interface';
import { SaleFilters, SaleRepository, SaleSearchResult } from '../../../domain/repositories/sale-repository';
import { SaleOutput, SaleOutputMapper } from './common/sale-output';

@Injectable()
export class ListSalesUseCase implements UseCase<ListSalesInput, ListSalesOutput> {
    constructor(private saleRepository: SaleRepository) { }

    async execute(input: ListSalesInput): Promise<ListSalesOutput> {
        const result = await this.saleRepository.findAll(input.tenantId, input.filters);
        return this.toOutput(result, input.tenantId);
    }

    private toOutput(result: SaleSearchResult, tenantId: string): ListSalesOutput {
        const sales = result.data.map(s => SaleOutputMapper.toOutput(s, tenantId));
        return PaginationOutputMapper.toOutput(sales, {
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
}

export type ListSalesInput = { tenantId: string; filters: SaleFilters };
export type ListSalesOutput = PaginationOutput<SaleOutput>;
