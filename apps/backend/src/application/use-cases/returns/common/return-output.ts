export interface ReturnItemOutput {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: string;
}

export interface ReturnOutput {
  id: string;
  tenantId: string;
  saleId: string;
  userId: string;
  customerId: string | null;
  status: string;
  refundType: string;
  reason: string | null;
  totalRefund: number;
  approvedBy: string | null;
  approvedAt: Date | null;
  processedAt: Date | null;
  createdAt: Date;
  items: ReturnItemOutput[];
}
