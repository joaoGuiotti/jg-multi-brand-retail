import { PaginationOutput, PaginationOutputMapper } from '@common/application/pagination-output';
import { UseCase } from '@common/application/use-case.interface';
import { ProductFilters, ProductRepository, ProductSearchResult } from '@domain/repositories/product-repository';
import { Injectable } from '@nestjs/common';
import { ProductOutput, ProductOutputMapper } from './common/product-output';

@Injectable()
export class ListProductsUseCase implements UseCase<ListProductsInput, ListProductsOutput> {
    constructor(private productRepository: ProductRepository) { }

    async execute(input: ListProductsInput): Promise<ListProductsOutput> {
        const result = await this.productRepository.findAll(input.tenantId, input.filters);
        return this.toOutput(result, input.tenantId);
    }

    private toOutput(result: ProductSearchResult, tenantId: string): ListProductsOutput {
        const products = result.data.map(p => ProductOutputMapper.toOutput(p, tenantId));
        return PaginationOutputMapper.toOutput(products, {
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
}


export type ListProductsInput = { tenantId: string; filters: ProductFilters; };
export type ListProductsOutput = PaginationOutput<ProductOutput>;
