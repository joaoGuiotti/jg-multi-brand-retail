import { InventoryMovementTypes } from '../entities/inventory/inventory-movement-type.vo';
import { InventoryMovement } from '../entities/inventory/inventory-movement.entity';

export interface InventoryFilters {
  productId?: string;
  type?: InventoryMovementTypes | string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InventorySearchResult {
  data: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class InventoryRepository {
  abstract create(
    tenantId: string,
    movement: InventoryMovement,
  ): Promise<InventoryMovement>;
  abstract findById(
    tenantId: string,
    id: string,
  ): Promise<InventoryMovement | null>;
  abstract findAll(
    tenantId: string,
    filters: InventoryFilters,
  ): Promise<InventorySearchResult>;
}
