import { UseCase } from '@common/application/use-case.interface';
import { InventoryRepository } from '@domain/repositories/inventory-repository';
import { ProductRepository } from '@domain/repositories/product-repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { MovementOutput, MovementOutputMapper } from './common/movement-output';

export type GetProductMovementsInput = { tenantId: string; productId: string };

export type GetProductMovementsOutput = {
    product: {
        id: string;
        name: string;
        sku: string;
        currentStock: number;
    };
    movements: MovementOutput[];
};

@Injectable()
export class GetProductMovementsUseCase implements UseCase<GetProductMovementsInput, GetProductMovementsOutput> {
    constructor(
        private inventoryRepository: InventoryRepository,
        private productRepository: ProductRepository,
    ) { }

    async execute(input: GetProductMovementsInput): Promise<GetProductMovementsOutput> {
        const { tenantId, productId } = input;
        const product = await this.productRepository.findById(tenantId, productId);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const result = await this.inventoryRepository.findAll(tenantId, {
            productId,
            limit: 50,
            sortBy: 'createdAt',
            sortOrder: 'desc',
        });

        return {
            product: {
                id: product.id.toString(),
                name: product.name,
                sku: product.sku,
                currentStock: product.stockQuantity,
            },
            movements: result.data.map(MovementOutputMapper.toOutput),
        };
    }
}
