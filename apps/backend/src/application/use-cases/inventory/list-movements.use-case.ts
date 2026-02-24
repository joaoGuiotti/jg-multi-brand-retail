import { PaginationOutput, PaginationOutputMapper } from '@common/application/pagination-output';
import { UseCase } from '@common/application/use-case.interface';
import { InventoryFilters, InventoryRepository, InventorySearchResult } from '@domain/repositories/inventory-repository';
import { Injectable } from '@nestjs/common';
import { MovementOutput, MovementOutputMapper } from './common/movement-output';

export type ListMovementsInput = { tenantId: string; filters: InventoryFilters };
export type ListMovementsOutput = PaginationOutput<MovementOutput>;

@Injectable()
export class ListMovementsUseCase implements UseCase<ListMovementsInput, ListMovementsOutput> {
    constructor(private inventoryRepository: InventoryRepository) { }

    async execute(input: ListMovementsInput): Promise<ListMovementsOutput> {
        const result = await this.inventoryRepository.findAll(input.tenantId, input.filters);
        return this.toOutput(result);
    }

    private toOutput(result: InventorySearchResult): ListMovementsOutput {
        const movements = result.data.map(MovementOutputMapper.toOutput);
        return PaginationOutputMapper.toOutput(movements, {
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    }
}
