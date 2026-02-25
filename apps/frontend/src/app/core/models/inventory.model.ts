import { IResponse } from './response-base';

export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryMovement {
    id: string;
    tenantId: string;
    productId: string;
    userId: string;
    type: MovementType;
    quantity: number;
    reference: string | null;
    createdAt: string;
}

export interface StockSummary {
    stock: {
        total: number;
        lowStock: number;
        outOfStock: number;
    };
    recentMovements: Partial<Record<MovementType, number>>;
}

export interface InventoryFilter {
    productId?: string;
    type?: MovementType;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CreateMovementDto {
    productId: string;
    type: MovementType;
    quantity: number;
    reference?: string;
}

export interface InventoryListResponse extends IResponse<InventoryMovement[]> { }
