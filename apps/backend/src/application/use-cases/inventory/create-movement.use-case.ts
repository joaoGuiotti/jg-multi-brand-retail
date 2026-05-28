import { UseCase } from '@common/application/use-case.interface';
import {
  InventoryMovementType,
  InventoryMovementTypes,
} from '@domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '@domain/entities/inventory/inventory-movement.entity';
import { InventoryRepository } from '@domain/repositories/inventory-repository';
import { ProductRepository } from '@domain/repositories/product-repository';
import { DomainEventPublisher } from '@common/application/domain-event-publisher';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DashboardEventType } from '../dashboard/dashboard-event.types';
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
export class CreateMovementUseCase implements UseCase<
  CreateMovementInput,
  MovementOutput
> {
  private readonly logger = new Logger(CreateMovementUseCase.name);

  constructor(
    private inventoryRepository: InventoryRepository,
    private productRepository: ProductRepository,
    private eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: CreateMovementInput): Promise<MovementOutput> {
    const { tenantId, userId, productId, type, quantity, reference } = input;
    const product = await this.productRepository.findById(tenantId, productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    switch (type) {
      case InventoryMovementTypes.ENTRY:
      case InventoryMovementTypes.RETURN:
        product.adjustStock(quantity, tenantId, type);
        break;
      case InventoryMovementTypes.EXIT:
        if (product.stockQuantity < quantity) {
          throw new BadRequestException(
            `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`,
          );
        }
        product.adjustStock(-quantity, tenantId, type);
        break;
      case InventoryMovementTypes.ADJUSTMENT:
        product.updateStock(quantity, tenantId);
        break;
    }

    const movement = InventoryMovement.create({
      productId,
      userId,
      type: InventoryMovementType.create(type),
      quantity,
      reference,
    });

    await this.productRepository.update(tenantId, product);
    const created = await this.inventoryRepository.create(tenantId, movement);

    await this.eventPublisher.publishEvents(product);

    return MovementOutputMapper.toOutput(created, tenantId);
  }
}
