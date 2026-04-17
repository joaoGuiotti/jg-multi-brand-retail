import {
  ReturnItemOutput,
  ReturnOutput,
} from '@application/use-cases/returns/common/return-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class ReturnItemPresenter {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  condition: string;

  constructor(output: ReturnItemOutput) {
    this.id = output.id;
    this.productId = output.productId;
    this.quantity = output.quantity;
    this.unitPrice = output.unitPrice;
    this.total = output.total;
    this.condition = output.condition;
  }
}

export class ReturnPresenter {
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

  @Transform(({ value }) => value?.toISOString())
  approvedAt: Date | null;

  @Transform(({ value }) => value?.toISOString())
  processedAt: Date | null;

  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  items: ReturnItemPresenter[];

  constructor(output: ReturnOutput) {
    this.id = output.id;
    this.tenantId = output.tenantId;
    this.saleId = output.saleId;
    this.userId = output.userId;
    this.customerId = output.customerId;
    this.status = output.status;
    this.refundType = output.refundType;
    this.reason = output.reason;
    this.totalRefund = output.totalRefund;
    this.approvedBy = output.approvedBy;
    this.approvedAt = output.approvedAt;
    this.processedAt = output.processedAt;
    this.createdAt = output.createdAt;
    this.items = output.items.map((item) => new ReturnItemPresenter(item));
  }
}

export class ReturnCollectionPresenter extends CollectionPresenter {
  data: ReturnPresenter[];

  constructor(output: PaginationOutput<ReturnOutput>) {
    const paginationProps: PaginationPresenterProps = {
      page: output.meta.page,
      limit: output.meta.limit,
      totalPages: output.meta.totalPages,
      total: output.meta.total,
    };
    super(paginationProps);
    this.data = output.data.map((item) => new ReturnPresenter(item));
  }
}
