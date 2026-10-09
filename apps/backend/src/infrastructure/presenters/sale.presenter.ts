import {
  SaleItemOutput,
  SaleOutput,
  PaymentOutput,
  ReturnSummaryOutput,
  ReturnItemSummaryOutput,
} from '@application/use-cases/sales/common/sale-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class SaleItemPresenter {
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

  constructor(output: SaleItemOutput) {
    this.id = output.id;
    this.productId = output.productId;
    this.product = output.product;
    this.quantity = output.quantity;
    this.unitPrice = output.unitPrice;
    this.discount = output.discount;
    this.total = output.total;
  }
}

export class PaymentPresenter {
  id: string;
  method: string;
  amount: number;
  status: string;
  installments?: number | null;

  @Transform(({ value }) => value?.toISOString())
  createdAt: Date | undefined;

  constructor(output: PaymentOutput) {
    this.id = output.id;
    this.method = output.method;
    this.amount = output.amount;
    this.status = output.status;
    this.installments = output.installments;
    this.createdAt = output.createdAt;
  }
}

export class ReturnItemSummaryPresenter {
  id: string;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: string;

  constructor(output: ReturnItemSummaryOutput) {
    this.id = output.id;
    this.productId = output.productId;
    this.productName = output.productName;
    this.sku = output.sku;
    this.quantity = output.quantity;
    this.unitPrice = output.unitPrice;
    this.total = output.total;
    this.condition = output.condition;
  }
}

export class ReturnSummaryPresenter {
  id: string;
  status: string;
  refundType?: string;
  reason?: string | null;
  total: number;
  items?: ReturnItemSummaryPresenter[];

  @Transform(({ value }) => value?.toISOString())
  createdAt: Date | undefined;

  constructor(output: ReturnSummaryOutput) {
    this.id = output.id;
    this.status = output.status;
    this.refundType = output.refundType;
    this.reason = output.reason;
    this.total = output.total;
    this.createdAt = output.createdAt;
    this.items = (output.items || []).map(
      (item) => new ReturnItemSummaryPresenter(item),
    );
  }
}

export class SalePresenter {
  id: string;
  tenantId: string;
  userId: string;
  customerId: string | null;
  customerName: string | null;
  invoiceNumber: string | null;
  subtotal: number;
  discount: number;
  total: number;
  status: string;
  items: SaleItemPresenter[];
  payments: PaymentPresenter[];
  returns: ReturnSummaryPresenter[];

  @Transform(({ value }) => value?.toISOString())
  createdAt: Date | undefined;

  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date | undefined;

  constructor(output: SaleOutput) {
    this.id = output.id;
    this.tenantId = output.tenantId;
    this.userId = output.userId;
    this.customerId = output.customerId ?? null;
    this.customerName = output.customerName ?? null;
    this.invoiceNumber = output.invoiceNumber ?? null;
    this.subtotal = output.subtotal;
    this.discount = output.discount;
    this.total = output.total;
    this.status = output.status;
    this.items = output.items.map((i) => new SaleItemPresenter(i));
    this.payments = (output.payments || []).map((p) => new PaymentPresenter(p));
    this.returns = (output.returns || []).map(
      (r) => new ReturnSummaryPresenter(r),
    );
    this.createdAt = output.createdAt;
    this.updatedAt = output.updatedAt;
  }
}

export class SaleCollectionPresenter extends CollectionPresenter {
  data: SalePresenter[];

  constructor(output: PaginationOutput<SaleOutput>) {
    const paginationProps: PaginationPresenterProps = {
      page: output.meta.page,
      limit: output.meta.limit,
      totalPages: output.meta.totalPages,
      total: output.meta.total,
    };
    super(paginationProps);
    this.data = output.data.map((item) => new SalePresenter(item));
  }
}
