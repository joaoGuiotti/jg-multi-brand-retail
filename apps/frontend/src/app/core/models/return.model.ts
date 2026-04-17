export type ReturnStatus = 'REQUESTED' | 'APPROVED' | 'REFUNDED' | 'REJECTED';
export type RefundType = 'STORE_CREDIT' | 'CASH_REFUND' | 'EXCHANGE';
export type ReturnItemCondition = 'GOOD' | 'DAMAGED' | 'DEFECTIVE';

export interface ReturnItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: ReturnItemCondition;
}

export interface ReturnOrder {
  id: string;
  tenantId: string;
  saleId: string;
  userId: string;
  customerId: string | null;
  status: ReturnStatus;
  refundType: RefundType;
  reason: string | null;
  totalRefund: number;
  approvedBy: string | null;
  approvedAt: string | null;
  processedAt: string | null;
  createdAt: string;
  items: ReturnItem[];
}

export interface CreateReturnItemDto {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  condition: ReturnItemCondition;
}

export interface CreateReturnDto {
  saleId: string;
  refundType: RefundType;
  reason?: string;
  items: CreateReturnItemDto[];
}

export interface ApproveReturnDto {
  status: ReturnStatus;
  reason?: string;
}

export interface ReturnFilter {
  status?: ReturnStatus;
  saleId?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReturnListResponse {
  data: ReturnOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
