import { ProductOutput } from '@application/use-cases/products/common/product-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { Transform } from 'class-transformer';

export class ProductPresenter {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    sku: string;
    barcode: string | null;
    categoryId: string | null;
    brandId: string | null;
    supplierId: string | null;
    costPrice: number;
    salePrice: number;
    margin: number;
    stockQuantity: number;
    unit: string;
    active: boolean;
    metadata: any | null;

    @Transform(({ value }) => value?.toISOString())
    createdAt: Date;

    @Transform(({ value }) => value?.toISOString())
    updatedAt: Date;

    constructor(output: ProductOutput) {
        this.id = output.id;
        this.tenantId = output.tenantId;
        this.name = output.name;
        this.description = output.description ?? null;
        this.sku = output.sku;
        this.barcode = output.barcode ?? null;
        this.categoryId = output.categoryId ?? null;
        this.brandId = output.brandId ?? null;
        this.supplierId = output.supplierId ?? null;
        this.costPrice = output.costPrice;
        this.salePrice = output.salePrice;
        this.margin = output.margin;
        this.stockQuantity = output.stockQuantity;
        this.unit = output.unit;
        this.active = output.active;
        this.metadata = (output as any).metadata ?? null;
        this.createdAt = output.createdAt!;
        this.updatedAt = output.updatedAt!;
    }
}

export class ProductCollectionPresenter extends CollectionPresenter {
    data: ProductPresenter[];

    constructor(output: PaginationOutput<ProductOutput>) {
        const paginationProps: PaginationPresenterProps = {
            page: output.meta.page,
            limit: output.meta.limit,
            totalPages: output.meta.totalPages,
            total: output.meta.total,
        };
        super(paginationProps);
        this.data = output.data.map((item) => new ProductPresenter(item));
    }
}
