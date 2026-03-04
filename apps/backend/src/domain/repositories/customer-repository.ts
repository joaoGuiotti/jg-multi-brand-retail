import { Customer } from '../entities/customers/customer.entity';

export interface CustomerFilters {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface CustomerSearchResult {
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export abstract class CustomerRepository {
    abstract create(tenantId: string, customer: Customer): Promise<Customer>;
    abstract findById(tenantId: string, id: string): Promise<Customer | null>;
    abstract findByEmail(tenantId: string, email: string): Promise<Customer | null>;
    abstract findAll(tenantId: string, filters: CustomerFilters): Promise<CustomerSearchResult>;
    abstract update(tenantId: string, customer: Customer): Promise<Customer>;
    abstract delete(tenantId: string, id: string): Promise<void>;
}
