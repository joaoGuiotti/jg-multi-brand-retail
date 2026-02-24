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
    abstract create(payment: Payment): Promise<void>;
    abstract findById(id: string): Promise<Payment | null>;
    abstract findAllByTenant(tenantId: string, filters: PaymentFilters): Promise<PaymentSearchResult>;
    abstract findBySale(saleId: string): Promise<Payment[]>;
    abstract update(payment: Payment): Promise<void>;
}
