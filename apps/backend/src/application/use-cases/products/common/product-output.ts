import { Product } from 'src/domain/entities/products/product.entity';

export type ProductOutput = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  categoryId?: string | null;
  brandId?: string | null;
  supplierId?: string | null;
  costPrice: number;
  salePrice: number;
  margin: number;
  stockQuantity: number;
  unit: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export class ProductOutputMapper {
  static toOutput(entity: Product, tenantId: string): ProductOutput {
    const props = entity.toJson();
    return {
      ...props,
      tenantId,
    };
  }
}
