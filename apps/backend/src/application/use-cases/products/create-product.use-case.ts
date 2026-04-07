import { UseCase } from '@common/application/use-case.interface';
import { Product } from '@domain/entities/products/product.entity';
import { ProductRepository } from '@domain/repositories/product-repository';
import { ConflictException, Injectable } from '@nestjs/common';
import { ProductOutput, ProductOutputMapper } from './common/product-output';

@Injectable()
export class CreateProductUseCase implements UseCase<
  CreateProductInput,
  ProductOutput
> {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<ProductOutput> {
    const { tenantId, ...otherProps } = input;
    const existingProduct = await this.productRepository.findBySku(
      tenantId,
      otherProps.sku,
    );

    if (existingProduct) {
      throw new ConflictException('Product with this SKU already exists');
    }

    const margin =
      otherProps.margin ??
      this.calculateMargin(otherProps.costPrice, otherProps.salePrice);

    const product = Product.create({
      ...otherProps,
      margin,
      stockQuantity: otherProps.stockQuantity ?? 0,
      unit: otherProps.unit ?? 'UN',
      active: otherProps.active ?? true,
    });

    const createdProduct = await this.productRepository.create(
      tenantId,
      product,
    );
    return ProductOutputMapper.toOutput(createdProduct, tenantId);
  }

  private calculateMargin(costPrice: number, salePrice: number): number {
    if (costPrice === 0) return 0;
    return ((salePrice - costPrice) / costPrice) * 100;
  }
}

export type CreateProductInput = {
  tenantId: string;
  name: string;
  sku: string;
  costPrice: number;
  salePrice: number;
  description?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  unit?: string;
  margin?: number;
  stockQuantity?: number;
  active?: boolean;
  metadata?: Record<string, any>;
};
