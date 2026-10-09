import { IResponse } from './response-base';

export interface Sale {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'RETURN_REQUESTED' | 'RETURNED' | 'CANCELLED';
  items: SaleItem[];
  payments: Payment[];
  returns?: ReturnSummary[];
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

export interface ReturnItemSummary {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition?: 'GOOD' | 'DAMAGED' | 'DEFECTIVE' | string;
}

export interface ReturnSummary {
  id: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  refundType?: 'STORE_CREDIT' | 'CASH_REFUND' | 'EXCHANGE' | string;
  reason?: string | null;
  total: number;
  createdAt: string;
  items?: ReturnItemSummary[];
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

export interface SaleListResponse extends IResponse<Sale[]> {}

export interface SaleFilter {
  status?: 'PENDING' | 'COMPLETED' | 'RETURN_REQUESTED' | 'RETURNED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
