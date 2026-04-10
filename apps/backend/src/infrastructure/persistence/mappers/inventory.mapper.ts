import { InventoryMovement as PrismaMovement } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import {
  InventoryMovementType,
  InventoryMovementTypes,
} from '../../../domain/entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '../../../domain/entities/inventory/inventory-movement.entity';

export class InventoryMapper {
  static toDomain(raw: PrismaMovement): InventoryMovement {
    return InventoryMovement.create(
      {
        productId: raw.productId,
        userId: raw.userId,
        type: InventoryMovementType.create(raw.type as InventoryMovementTypes),
        quantity: raw.quantity,
        reference: raw.reference,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPersistence(movement: InventoryMovement) {
    return {
      id: movement.id.toString(),
      productId: movement.productId,
      userId: movement.userId,
      type: movement.type.value,
      quantity: movement.quantity,
      reference: movement.reference,
      createdAt: movement.createdAt,
    };
  }
}
