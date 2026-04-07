import { Product } from '../entities/products/product.entity';

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductSearchResult {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export abstract class ProductRepository {
  abstract create(tenantId: string, product: Product): Promise<Product>;
  abstract findById(tenantId: string, id: string): Promise<Product | null>;
  abstract findBySku(tenantId: string, sku: string): Promise<Product | null>;
  abstract findByBarcode(
    tenantId: string,
    barcode: string,
  ): Promise<Product | null>;
  abstract findAll(
    tenantId: string,
    filters: ProductFilters,
  ): Promise<ProductSearchResult>;
  abstract update(tenantId: string, product: Product): Promise<Product>;
  abstract delete(tenantId: string, id: string): Promise<void>;
}
