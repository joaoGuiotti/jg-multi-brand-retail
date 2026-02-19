import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryMovementDto, QueryInventoryMovementDto } from './dto';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async createMovement(tenantId: string, userId: string, dto: CreateInventoryMovementDto) {
        // Verify product exists and belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: {
                id: dto.productId,
                tenantId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Calculate new stock quantity based on movement type
        let newStockQuantity = product.stockQuantity;
        let previousQuantity = product.stockQuantity;

        switch (dto.type) {
            case 'ENTRY':
            case 'RETURN':
                // These increase stock
                newStockQuantity += dto.quantity;
                break;
            case 'EXIT':
                // This decreases stock
                if (product.stockQuantity < dto.quantity) {
                    throw new BadRequestException(
                        `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${dto.quantity}`,
                    );
                }
                newStockQuantity -= dto.quantity;
                break;
            case 'ADJUSTMENT':
                // For adjustment, quantity represents the new total
                newStockQuantity = dto.quantity;
                break;
        }

        // Create movement and update product stock in a transaction
        const movement = await this.prisma.$transaction(async (tx) => {
            // Create the movement record
            const newMovement = await tx.inventoryMovement.create({
                data: {
                    tenantId,
                    productId: dto.productId,
                    userId,
                    type: dto.type,
                    quantity: dto.quantity,
                    reference: dto.reference,
                },
                include: {
                    product: true,
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            // Update product stock
            await tx.product.update({
                where: { id: dto.productId },
                data: {
                    stockQuantity: newStockQuantity,
                },
            });

            return newMovement;
        });

        return movement;
    }

    async findAll(tenantId: string, query: QueryInventoryMovementDto) {
        const { productId, type, userId, startDate, endDate, sortBy, sortOrder } = query;

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            tenantId,
        };

        if (productId) {
            where.productId = productId;
        }

        if (type) {
            where.type = type;
        }

        if (userId) {
            where.userId = userId;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }

        const [movements, total] = await Promise.all([
            this.prisma.inventoryMovement.findMany({
                where,
                skip: skip || 0,
                take: limit || 10,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            barcode: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            this.prisma.inventoryMovement.count({ where }),
        ]);

        return {
            data: movements,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(tenantId: string, id: string) {
        const movement = await this.prisma.inventoryMovement.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                product: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        if (!movement) {
            throw new NotFoundException('Inventory movement not found');
        }

        return movement;
    }

    async findByProduct(tenantId: string, productId: string) {
        // Verify product belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: {
                id: productId,
                tenantId,
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const movements = await this.prisma.inventoryMovement.findMany({
            where: {
                productId,
                tenantId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            take: 50, // Limit to last 50 movements
        });

        return {
            product: {
                id: product.id,
                name: product.name,
                sku: product.sku,
                currentStock: product.stockQuantity,
            },
            movements,
        };
    }

    async getStockSummary(tenantId: string) {
        // Get products with low stock or out of stock
        const [lowStock, outOfStock, totalProducts] = await Promise.all([
            this.prisma.product.count({
                where: {
                    tenantId,
                    stockQuantity: {
                        gt: 0,
                        lte: 10, // Low stock threshold
                    },
                },
            }),
            this.prisma.product.count({
                where: {
                    tenantId,
                    stockQuantity: 0,
                },
            }),
            this.prisma.product.count({
                where: {
                    tenantId,
                },
            }),
        ]);

        // Get recent movements count by type
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMovements = await this.prisma.inventoryMovement.groupBy({
            by: ['type'],
            where: {
                tenantId,
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: {
                type: true,
            },
        });

        const movementsByType = recentMovements.reduce((acc, curr) => {
            acc[curr.type] = curr._count.type;
            return acc;
        }, {} as Record<string, number>);

        return {
            stock: {
                total: totalProducts,
                lowStock,
                outOfStock,
            },
            recentMovements: movementsByType,
        };
    }
}
