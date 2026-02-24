import { PaymentOutput } from '@application/use-cases/payments/common/payment-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class PaymentPresenter {
    id: string;
    tenantId: string;
    saleId: string;
    method: string;
    amount: number;
    installments: number;
    fee: number;
    status: string;
    paidAt: Date | null;
    metadata: any;

    @Transform(({ value }) => value?.toISOString())
    createdAt: Date | undefined;

    constructor(output: PaymentOutput) {
        this.id = output.id;
        this.tenantId = output.tenantId;
        this.saleId = output.saleId;
        this.method = output.method;
        this.amount = output.amount;
        this.installments = output.installments;
        this.fee = output.fee;
        this.status = output.status;
        this.paidAt = output.paidAt ?? null;
        this.metadata = output.metadata ?? null;
        this.createdAt = output.createdAt;
    }
}

export class PaymentCollectionPresenter extends CollectionPresenter {
    data: PaymentPresenter[];

    constructor(output: PaginationOutput<PaymentOutput>) {
        const paginationProps: PaginationPresenterProps = {
            page: output.meta.page,
            limit: output.meta.limit,
            totalPages: output.meta.totalPages,
            total: output.meta.total,
        };
        super(paginationProps);
        this.data = output.data.map((item) => new PaymentPresenter(item));
    }
}
