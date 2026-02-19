import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto, QuerySaleDto } from './dto';

@Injectable()
export class SalesService {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, userId: string, dto: CreateSaleDto) {
        // Validate that all products exist and have sufficient stock
        const productIds = dto.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                tenantId,
                active: true,
            },
        });

        if (products.length !== productIds.length) {
            throw new NotFoundException('One or more products not found');
        }

        // Check stock availability
        for (const item of dto.items) {
            const product = products.find((p) => p.id === item.productId);
            if (!product) {
                throw new NotFoundException(`Product ${item.productId} not found`);
            }
            if (product.stockQuantity < item.quantity) {
                throw new BadRequestException(
                    `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
                );
            }
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = dto.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const itemSubtotal = item.unitPrice * item.quantity;
            const itemDiscount = item.discount || 0;
            const itemTotal = itemSubtotal - itemDiscount;
            subtotal += itemTotal;

            return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: itemDiscount,
                subtotal: itemSubtotal,
                total: itemTotal,
            };
        });

        const discount = dto.discount || 0;
        const total = subtotal - discount;

        // Create sale with items in a transaction
        const sale = await this.prisma.$transaction(async (tx) => {
            // Create the sale
            const newSale = await tx.sale.create({
                data: {
                    tenantId,
                    userId,
                    subtotal,
                    discount,
                    total,
                    status: 'PENDING',
                },
            });

            // Create sale items
            await tx.saleItem.createMany({
                data: saleItems.map((item) => ({
                    saleId: newSale.id,
                    ...item,
                })),
            });

            // Update product stock
            for (const item of dto.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Fetch the complete sale with relations
            return tx.sale.findUnique({
                where: { id: newSale.id },
                include: {
                    items: {
                        include: {
                            product: true,
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
            });
        });

        return sale;
    }

    async findAll(tenantId: string, query: QuerySaleDto) {
        const { userId, startDate, endDate, sortBy, sortOrder } = query;

        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            tenantId,
        };

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

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip: skip || 0,
                take: limit || 10,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                include: {
                    items: {
                        include: {
                            product: true,
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
            this.prisma.sale.count({ where }),
        ]);

        return {
            data: sales,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(tenantId: string, id: string) {
        const sale = await this.prisma.sale.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                payments: true,
            },
        });

        if (!sale) {
            throw new NotFoundException('Sale not found');
        }

        return sale;
    }

    async cancel(tenantId: string, id: string) {
        const sale = await this.findOne(tenantId, id);

        if (sale.status === 'CANCELLED') {
            throw new BadRequestException('Sale is already cancelled');
        }

        if (sale.status === 'COMPLETED') {
            throw new BadRequestException('Cannot cancel a completed sale');
        }

        // Cancel sale and restore stock in a transaction
        return this.prisma.$transaction(async (tx) => {
            // Restore product stock
            for (const item of sale.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stockQuantity: {
                            increment: item.quantity,
                        },
                    },
                });
            }

            // Update sale status
            return tx.sale.update({
                where: { id },
                data: {
                    status: 'CANCELLED',
                },
                include: {
                    items: {
                        include: {
                            product: true,
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
            });
        });
    }

    async complete(tenantId: string, id: string) {
        const sale = await this.findOne(tenantId, id);

        if (sale.status === 'CANCELLED') {
            throw new BadRequestException('Cannot complete a cancelled sale');
        }

        if (sale.status === 'COMPLETED') {
            throw new BadRequestException('Sale is already completed');
        }

        // Check if sale is fully paid
        const totalPaid = sale.payments.reduce((sum, payment) => sum + payment.amount.toNumber(), 0);
        const saleTotal = sale.total.toNumber();

        if (totalPaid < saleTotal) {
            throw new BadRequestException(
                `Sale is not fully paid. Total: ${saleTotal}, Paid: ${totalPaid}`,
            );
        }

        return this.prisma.sale.update({
            where: { id },
            data: {
                status: 'COMPLETED',
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                payments: true,
            },
        });
    }
}
