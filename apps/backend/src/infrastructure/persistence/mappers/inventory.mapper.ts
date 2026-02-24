import { InventoryMovement as PrismaMovement } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { InventoryMovement } from '../../../domain/entities/inventory/inventory-movement.entity';

export class InventoryMapper {
    static toDomain(raw: PrismaMovement): InventoryMovement {
        return InventoryMovement.create(
            {
                tenantId: raw.tenantId,
                productId: raw.productId,
                userId: raw.userId,
                type: raw.type as any,
                quantity: raw.quantity,
                reference: raw.reference,
                createdAt: raw.createdAt,
            },
            new UniqueEntityID(raw.id)
        );
    }

    static toPersistence(movement: InventoryMovement) {
        return {
            id: movement.id.toString(),
            tenantId: movement.tenantId,
            productId: movement.productId,
            userId: movement.userId,
            type: movement.type,
            quantity: movement.quantity,
            reference: movement.reference,
            createdAt: movement.createdAt,
        };
    }
}
