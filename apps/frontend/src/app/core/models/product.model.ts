export interface Product {
    id: string;
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    costPrice: number;
    salePrice: number;
    margin?: number;
    stockQuantity: number;
    categoryId?: string;
    brandId?: string;
    category?: {
        id: string;
        name: string;
    };
    brand?: {
        id: string;
        name: string;
    };
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductCreateDto {
    name: string;
    description?: string;
    sku: string;
    barcode?: string;
    costPrice: number;
    salePrice: number;
    stockQuantity: number;
    categoryId?: string;
    brandId?: string;
    active?: boolean;
}

export interface ProductUpdateDto extends Partial<ProductCreateDto> { }

export interface ProductFilter {
    search?: string;
    categoryId?: string;
    brandId?: string;
    isActive?: boolean;
    lowStock?: boolean;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
