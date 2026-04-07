import { Product } from '@domain/entities/products/product.entity';
import {
  ProductFilters,
  ProductRepository,
  ProductSearchResult,
} from '@domain/repositories/product-repository';
import { Injectable } from '@nestjs/common';
import { ProductMapper } from '../mappers/product.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, product: Product): Promise<Product> {
    const data = ProductMapper.toPersistence(product);
    const created = await this.prisma.product.create({
      data: {
        ...data,
        tenantId,
      },
    });
    return ProductMapper.toDomain(created);
  }

  async findById(tenantId: string, id: string): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
    });

    if (!product) return null;

    return ProductMapper.toDomain(product);
  }

  async findBySku(tenantId: string, sku: string): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: {
        tenantId_sku: {
          tenantId,
          sku,
        },
      },
    });

    if (!product) return null;

    return ProductMapper.toDomain(product);
  }

  async findByBarcode(
    tenantId: string,
    barcode: string,
  ): Promise<Product | null> {
    const product = await this.prisma.product.findFirst({
      where: { tenantId, barcode },
    });

    if (!product) return null;

    return ProductMapper.toDomain(product);
  }

  async findAll(
    tenantId: string,
    filters: ProductFilters,
  ): Promise<ProductSearchResult> {
    const {
      search,
      categoryId,
      brandId,
      supplierId,
      active,
      sortBy,
      sortOrder,
    } = filters;

    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (brandId) where.brandId = brandId;
    if (supplierId) where.supplierId = supplierId;
    if (active !== undefined) where.active = active;

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || ('desc' as const) }
      : { createdAt: 'desc' as const };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products.map(ProductMapper.toDomain),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(tenantId: string, product: Product): Promise<Product> {
    const data = ProductMapper.toPersistence(product);
    const updated = await this.prisma.product.update({
      where: {
        id: product.id.toString(),
        tenantId,
      },
      data,
    });
    return ProductMapper.toDomain(updated);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id, tenantId },
    });
  }
}
