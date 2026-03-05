import { IResponse } from "./response-base";

export interface Sale {
    id: string;
    invoiceNumber: string;
    subtotal: number;
    discount: number;
    total: number;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    items: SaleItem[];
    payments: Payment[];
    userId: string;
    tenantId: string;
    customerId?: string;
    customerName?: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaleItem {
    id: string;
    productId: string;
    product?: {
        id: string;
        name: string;
        sku: string;
    };
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;
}

export interface Payment {
    id: string;
    saleId: string;
    method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'OTHER';
    amount: number;
    installments?: number;
    fee?: number;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    metadata?: Record<string, any>;
    createdAt: string;
}

export interface CreateSaleDto {
    customerId?: string;
    items: CreateSaleItemDto[];
    discount?: number;
    payments: CreatePaymentDto[];
}

export interface CreateSaleItemDto {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
}

export interface CreatePaymentDto {
    method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'OTHER';
    amount: number;
    installments?: number;
    fee?: number;
    metadata?: Record<string, any>;
}

export interface SaleListResponse extends IResponse<Sale[]> {
}

export interface SaleFilter {
    status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
