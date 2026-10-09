import {
  ReturnOrder,
  ReturnStatus,
} from '../../entities/returns/return-order.entity';

export interface ReturnFilters {
  status?: ReturnStatus;
  saleId?: string;
  userId?: string;
  customerId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface ReturnSearchResult {
  data: ReturnOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class ReturnsRepository {
  abstract save(returnOrder: ReturnOrder, tx?: any): Promise<void>;
  abstract findById(tenantId: string, id: string): Promise<ReturnOrder | null>;
  abstract findAll(
    tenantId: string,
    filters: ReturnFilters,
  ): Promise<ReturnSearchResult>;
  abstract findBySaleId(
    tenantId: string,
    saleId: string,
  ): Promise<ReturnOrder[]>;
}
