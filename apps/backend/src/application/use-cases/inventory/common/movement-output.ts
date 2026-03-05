import { InventoryMovement } from '@domain/entities/inventory/inventory-movement.entity';

export type MovementOutput = {
    id: string;
    tenantId: string;
    productId: string;
    userId: string;
    type: string;
    quantity: number;
    reference?: string | null;
    createdAt?: Date;
};

export type StockSummaryOutput = {
    stock: {
        total: number;
        lowStock: number;
        outOfStock: number;
    };
    recentMovements: Record<string, number>;
};

export class MovementOutputMapper {
    static toOutput(entity: InventoryMovement, tenantId: string): MovementOutput {
        return {
            id: entity.id.toString(),
            tenantId: tenantId,
            productId: entity.productId,
            userId: entity.userId,
            type: entity.type.value,
            quantity: entity.quantity,
            reference: entity.reference,
            createdAt: entity.createdAt,
        };
    }
}
