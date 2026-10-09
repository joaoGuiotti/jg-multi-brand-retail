import { Sale, SaleItem } from '../../../../domain/entities/sales/sale.entity';

export type SaleItemOutput = {
  id: string;
  productId: string;
  product?: {
    name: string;
    sku: string;
  } | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
};

export type PaymentOutput = {
  id: string;
  method: string;
  amount: number;
  status: string;
  installments?: number | null;
  createdAt?: Date;
};

export type ReturnItemSummaryOutput = {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: string;
};

export type ReturnSummaryOutput = {
  id: string;
  status: string;
  refundType?: string;
  reason?: string | null;
  total: number;
  createdAt?: Date;
  items?: ReturnItemSummaryOutput[];
};

export type SaleOutput = {
  id: string;
  tenantId: string;
  userId: string;
  customerId?: string | null;
  customerName?: string | null;
  invoiceNumber?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  items: SaleItemOutput[];
  payments: PaymentOutput[];
  returns: ReturnSummaryOutput[];
  createdAt?: Date;
  updatedAt?: Date;
};

export class SaleItemOutputMapper {
  static toOutput(item: SaleItem): SaleItemOutput {
    return {
      id: item.id.toString(),
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: item.total,
    };
  }
}

export class SaleOutputMapper {
  static toOutput(entity: Sale, tenantId: string): SaleOutput {
    return {
      id: entity.id.toString(),
      tenantId: tenantId,
      userId: entity.userId,
      customerId: entity.customerId,
      customerName: entity.customerName,
      invoiceNumber: entity.invoiceNumber,
      subtotal: entity.subtotal,
      discount: entity.discount,
      total: entity.total,
      status: entity.status,
      items: entity.items.map(SaleItemOutputMapper.toOutput),
      payments: entity.payments.map((p) => ({
        id: p.id.toString(),
        method: p.method,
        amount: Number(p.amount),
        status: p.status,
        installments: p.installments,
        createdAt: p.createdAt,
      })),
      returns: (entity.returns || []).map((r: any) => ({
        id: r.id.toString(),
        status: r.status,
        refundType: r.refundType,
        reason: r.reason ?? null,
        total: Number(r.totalRefund || r.total || 0),
        createdAt: r.createdAt,
        items: (r.items || []).map((item: any) => ({
          id: item.id.toString(),
          productId: item.productId,
          productName: item.product?.name ?? item.productName,
          sku: item.product?.sku ?? item.sku,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
          condition: item.condition,
        })),
      })),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
