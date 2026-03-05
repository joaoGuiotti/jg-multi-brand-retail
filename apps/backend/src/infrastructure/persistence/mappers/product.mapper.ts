import { Product as PrismaProduct } from '@prisma/client';
import { UniqueEntityID } from '../../../common/domain/unique-entity-id';
import { Product } from '../../../domain/entities/products/product.entity';

export class ProductMapper {
    static toDomain(raw: PrismaProduct): Product {
        return Product.create(
            {
                name: raw.name,
                description: raw.description,
                sku: raw.sku,
                barcode: raw.barcode,
                categoryId: raw.categoryId,
                brandId: raw.brandId,
                supplierId: raw.supplierId,
                costPrice: Number(raw.costPrice),
                salePrice: Number(raw.salePrice),
                margin: Number(raw.margin),
                stockQuantity: raw.stockQuantity,
                unit: raw.unit,
                active: raw.active,
                metadata: raw.metadata,
                createdAt: raw.createdAt,
                updatedAt: raw.updatedAt,
            },
            new UniqueEntityID(raw.id),
        );
    }

    static toPersistence(product: Product) {
        return {
            id: product.id.toString(),
            name: product.name,
            description: product.description,
            sku: product.sku,
            barcode: product.barcode,
            categoryId: product.categoryId,
            brandId: product.brandId,
            supplierId: product.supplierId,
            costPrice: product.costPrice,
            salePrice: product.salePrice,
            margin: product.margin,
            stockQuantity: product.stockQuantity,
            unit: product.unit,
            active: product.active,
            metadata: product.metadata,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        };
    }
}
