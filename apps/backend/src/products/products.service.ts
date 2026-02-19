import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, QueryProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, dto: CreateProductDto) {
        // Check if SKU already exists for this tenant
        const existingProduct = await this.prisma.product.findUnique({
            where: {
                tenantId_sku: {
                    tenantId,
                    sku: dto.sku,
                },
            },
        });

        if (existingProduct) {
            throw new ConflictException('Product with this SKU already exists');
        }

        // Calculate margin if not provided
        const margin = dto.margin ?? this.calculateMargin(dto.costPrice, dto.salePrice);

        return this.prisma.product.create({
            data: {
                ...dto,
                tenantId,
                margin,
                stockQuantity: dto.stockQuantity ?? 0,
                unit: dto.unit ?? 'UN',
                active: dto.active ?? true,
            },
            include: {
                category: true,
                brand: true,
                supplier: true,
            },
        });
    }

    async findAll(tenantId: string, query: QueryProductDto) {
        const { search, categoryId, brandId, supplierId, active, sortBy, sortOrder } = query;

        // Ensure page and limit are valid numbers
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
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

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (brandId) {
            where.brandId = brandId;
        }

        if (supplierId) {
            where.supplierId = supplierId;
        }

        if (active !== undefined) {
            where.active = active;
        }

        const validSortFields = ['name', 'sku', 'salePrice', 'costPrice', 'stockQuantity', 'createdAt', 'updatedAt'];
        const orderBy = sortBy && validSortFields.includes(sortBy)
            ? { [sortBy]: sortOrder }
            : { createdAt: 'desc' as const };

        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip: skip || 0,
                take: limit || 10,
                orderBy: {
                    createdAt: 'desc',
                },
                include: {
                    category: true,
                    brand: true,
                    supplier: true,
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(tenantId: string, id: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                category: true,
                brand: true,
                supplier: true,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async findBySku(tenantId: string, sku: string) {
        const product = await this.prisma.product.findUnique({
            where: {
                tenantId_sku: {
                    tenantId,
                    sku,
                },
            },
            include: {
                category: true,
                brand: true,
                supplier: true,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async findByBarcode(tenantId: string, barcode: string) {
        const product = await this.prisma.product.findFirst({
            where: {
                tenantId,
                barcode,
            },
            include: {
                category: true,
                brand: true,
                supplier: true,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return product;
    }

    async update(tenantId: string, id: string, dto: UpdateProductDto) {
        // Check if product exists and belongs to tenant
        const existingProduct = await this.findOne(tenantId, id);

        // If SKU is being updated, check for conflicts
        if (dto.sku) {
            const productWithSku = await this.prisma.product.findUnique({
                where: {
                    tenantId_sku: {
                        tenantId,
                        sku: dto.sku,
                    },
                },
            });

            if (productWithSku && productWithSku.id !== id) {
                throw new ConflictException('Product with this SKU already exists');
            }
        }

        // Recalculate margin if prices are updated
        const updateData: any = { ...dto };

        if ((dto.costPrice !== undefined || dto.salePrice !== undefined) && dto.margin === undefined) {
            // Convert Prisma Decimal to number safely
            const costPrice = dto.costPrice ?? Number(existingProduct.costPrice);
            const salePrice = dto.salePrice ?? Number(existingProduct.salePrice);
            updateData.margin = this.calculateMargin(costPrice, salePrice);
        }

        return this.prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                brand: true,
                supplier: true,
            },
        });
    }

    async remove(tenantId: string, id: string) {
        // Check if product exists and belongs to tenant
        await this.findOne(tenantId, id);

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async updateStock(tenantId: string, id: string, quantity: number) {
        await this.findOne(tenantId, id);

        return this.prisma.product.update({
            where: { id },
            data: {
                stockQuantity: quantity,
            },
        });
    }

    async adjustStock(tenantId: string, id: string, adjustment: number) {
        const product = await this.findOne(tenantId, id);

        return this.prisma.product.update({
            where: { id },
            data: {
                stockQuantity: product.stockQuantity + adjustment,
            },
        });
    }

    private calculateMargin(costPrice: number, salePrice: number): number {
        if (costPrice === 0) return 0;
        return ((salePrice - costPrice) / costPrice) * 100;
    }
}
