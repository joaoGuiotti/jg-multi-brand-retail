import { SaleItemOutput, SaleOutput } from '@application/use-cases/sales/common/sale-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class SaleItemPresenter {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    total: number;

    constructor(output: SaleItemOutput) {
        this.id = output.id;
        this.productId = output.productId;
        this.quantity = output.quantity;
        this.unitPrice = output.unitPrice;
        this.discount = output.discount;
        this.total = output.total;
    }
}

export class SalePresenter {
    id: string;
    tenantId: string;
    userId: string;
    invoiceNumber: string | null;
    subtotal: number;
    discount: number;
    total: number;
    status: string;
    items: SaleItemPresenter[];

    @Transform(({ value }) => value?.toISOString())
    createdAt: Date | undefined;

    @Transform(({ value }) => value?.toISOString())
    updatedAt: Date | undefined;

    constructor(output: SaleOutput) {
        this.id = output.id;
        this.tenantId = output.tenantId;
        this.userId = output.userId;
        this.invoiceNumber = output.invoiceNumber ?? null;
        this.subtotal = output.subtotal;
        this.discount = output.discount;
        this.total = output.total;
        this.status = output.status;
        this.items = output.items.map((i) => new SaleItemPresenter(i));
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
