import { UseCase } from '@common/application/use-case.interface';
import { InventoryMovementType, InventoryMovementTypes } from '@domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '@domain/entities/inventory/inventory-movement.entity';
import { InventoryRepository } from '@domain/repositories/inventory-repository';
import { ProductRepository } from '@domain/repositories/product-repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MovementOutput, MovementOutputMapper } from './common/movement-output';

export type CreateMovementInput = {
    tenantId: string;
    userId: string;
    productId: string;
    type: InventoryMovementTypes;
    quantity: number;
    reference?: string;
};

@Injectable()
export class CreateMovementUseCase implements UseCase<CreateMovementInput, MovementOutput> {
    constructor(
        private inventoryRepository: InventoryRepository,
        private productRepository: ProductRepository,
    ) { }

    async execute(input: CreateMovementInput): Promise<MovementOutput> {
        const { tenantId, userId, productId, type, quantity, reference } = input;
        const product = await this.productRepository.findById(tenantId, productId);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        switch (type) {
            case InventoryMovementTypes.ENTRY:
            case InventoryMovementTypes.RETURN:
                product.adjustStock(quantity);
                break;
            case InventoryMovementTypes.EXIT:
                if (product.stockQuantity < quantity) {
                    throw new BadRequestException(
                        `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`,
                    );
                }
                product.adjustStock(-quantity);
                break;
            case InventoryMovementTypes.ADJUSTMENT:
                product.updateStock(quantity);
                break;
        }

        const movement = InventoryMovement.create({
            tenantId,
            productId,
            userId,
            type: InventoryMovementType.create(type as InventoryMovementTypes),
            quantity,
            reference,
        });

        await this.productRepository.update(product);
        const created = await this.inventoryRepository.create(movement);
        return MovementOutputMapper.toOutput(created);
    }
}
