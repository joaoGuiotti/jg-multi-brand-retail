import { MovementOutput } from '@application/use-cases/inventory/common/movement-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class MovementPresenter {
    id: string;
    tenantId: string;
    productId: string;
    userId: string;
    type: string;
    quantity: number;
    reference: string | null;

    @Transform(({ value }) => value?.toISOString())
    createdAt: Date | undefined;

    constructor(output: MovementOutput) {
        this.id = output.id;
        this.tenantId = output.tenantId;
        this.productId = output.productId;
        this.userId = output.userId;
        this.type = output.type;
        this.quantity = output.quantity;
        this.reference = output.reference ?? null;
        this.createdAt = output.createdAt;
    }
}

export class MovementCollectionPresenter extends CollectionPresenter {
    data: MovementPresenter[];

    constructor(output: PaginationOutput<MovementOutput>) {
        const paginationProps: PaginationPresenterProps = {
            page: output.meta.page,
            limit: output.meta.limit,
            totalPages: output.meta.totalPages,
            total: output.meta.total,
        };
        super(paginationProps);
        this.data = output.data.map((item) => new MovementPresenter(item));
    }
}
