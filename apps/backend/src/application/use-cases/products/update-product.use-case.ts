import { UseCase } from '@common/application/use-case.interface';
import { ProductRepository } from '@domain/repositories/product-repository';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductOutput, ProductOutputMapper } from './common/product-output';

@Injectable()
export class UpdateProductUseCase implements UseCase<
  UpdateProductInput,
  ProductOutput
> {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: UpdateProductInput): Promise<ProductOutput> {
    const { tenantId, id, ...otherProps } = input;
    const product = await this.productRepository.findById(tenantId, id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (otherProps.sku && otherProps.sku !== product.sku) {
      const productWithSku = await this.productRepository.findBySku(
        tenantId,
        otherProps.sku,
      );
      if (productWithSku) {
        throw new ConflictException('Product with this SKU already exists');
      }
    }

    const costPrice = otherProps.costPrice ?? product.costPrice;
    const salePrice = otherProps.salePrice ?? product.salePrice;

    if (
      otherProps.costPrice !== undefined ||
      otherProps.salePrice !== undefined
    ) {
      product.updatePrices(costPrice, salePrice);
    }

    if (otherProps.name) (product as any).props.name = otherProps.name;
    if (otherProps.description !== undefined)
      (product as any).props.description = otherProps.description;
    if (otherProps.sku) (product as any).props.sku = otherProps.sku;
    if (otherProps.barcode !== undefined)
      (product as any).props.barcode = otherProps.barcode;
    if (otherProps.categoryId !== undefined)
      (product as any).props.categoryId = otherProps.categoryId;
    if (otherProps.brandId !== undefined)
      (product as any).props.brandId = otherProps.brandId;
    if (otherProps.supplierId !== undefined)
      (product as any).props.supplierId = otherProps.supplierId;
    if (otherProps.unit) (product as any).props.unit = otherProps.unit;
    if (otherProps.active !== undefined)
      (product as any).props.active = otherProps.active;
    if (otherProps.metadata !== undefined)
      (product as any).props.metadata = otherProps.metadata;

    const productUpdated = await this.productRepository.update(
      tenantId,
      product,
    );

    return ProductOutputMapper.toOutput(productUpdated, tenantId);
  }
}

export type UpdateProductInput = {
  tenantId: string;
  id: string;
  name?: string;
  description?: string | null;
  sku?: string;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  margin?: number;
  stockQuantity?: number;
  active?: boolean;
  metadata?: Record<string, any> | null;
};
