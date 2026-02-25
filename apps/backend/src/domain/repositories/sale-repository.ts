import { Sale } from '../entities/sales/sale.entity';

export interface SaleFilters {
    userId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface SaleSearchResult {
    data: Sale[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class SaleRepository {
    abstract create(sale: Sale): Promise<Sale>;
    abstract findById(tenantId: string, id: string): Promise<Sale | null>;
    abstract findAll(tenantId: string, filters: SaleFilters): Promise<SaleSearchResult>;
    abstract update(sale: Sale): Promise<Sale>;
}
