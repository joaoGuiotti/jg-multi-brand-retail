export class UpdateProductDto {
  tenantId: string;
  id: string;
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  margin?: number;
  stockQuantity?: number;
  active?: boolean;
  metadata?: Record<string, any>;
}
