import { Payment } from '../entities/payments/payment.entity';

export interface PaymentFilters {
    saleId?: string;
    status?: string;
    method?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaymentSearchResult {
    data: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class PaymentRepository {
    abstract create(tenantId: string, payment: Payment): Promise<void>;
    abstract findById(tenantId: string, id: string): Promise<Payment | null>;
    abstract findAll(tenantId: string, filters: PaymentFilters): Promise<PaymentSearchResult>;
    abstract findBySale(tenantId: string, saleId: string): Promise<Payment[]>;
    abstract update(tenantId: string, payment: Payment): Promise<void>;
}
