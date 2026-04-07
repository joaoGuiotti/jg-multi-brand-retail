import { ProductOutput } from '@application/use-cases/products/common/product-output';
import { PaginationOutput } from '@common/application/pagination-output';
import { CollectionPresenter } from '@common/presenters/collection.presenter';
import { PaginationPresenterProps } from '@common/presenters/pagination.presenter';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ProductPresenter {
  @ApiProperty({ example: '' })
  id: string;

  @ApiProperty({ example: 'uuid-tenant' })
  tenantId: string;

  @ApiProperty({ example: 'Camiseta Básica' })
  name: string;

  @ApiPropertyOptional({ example: 'Camiseta 100% algodão', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'CAM-001' })
  sku: string;

  @ApiPropertyOptional({ example: '7891234567890', nullable: true })
  barcode: string | null;

  @ApiPropertyOptional({ nullable: true })
  categoryId: string | null;

  @ApiPropertyOptional({ nullable: true })
  brandId: string | null;

  @ApiPropertyOptional({ nullable: true })
  supplierId: string | null;

  @ApiProperty({ example: 29.9 })
  costPrice: number;

  @ApiProperty({ example: 59.9 })
  salePrice: number;

  @ApiProperty({ example: 50 })
  margin: number;

  @ApiProperty({ example: 100 })
  stockQuantity: number;

  @ApiProperty({ example: 'un' })
  unit: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiPropertyOptional({ nullable: true })
  metadata: any | null;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Transform(({ value }) => value?.toISOString())
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
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
