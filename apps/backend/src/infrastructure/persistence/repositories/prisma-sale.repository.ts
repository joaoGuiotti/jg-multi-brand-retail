import { Injectable } from '@nestjs/common';
import { Sale } from '../../../domain/entities/sales/sale.entity';
import { SaleFilters, SaleRepository, SaleSearchResult } from '../../../domain/repositories/sale-repository';
import { SaleMapper } from '../mappers/sale.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSaleRepository implements SaleRepository {
    constructor(private prisma: PrismaService) { }

    async create(tenantId: string, sale: Sale): Promise<Sale> {
        const data = SaleMapper.toPersistence(sale);
        const items = sale.items.map(item => SaleMapper.toPersistenceItem(item, sale.id.toString()));

        const created = await this.prisma.$transaction(async (tx) => {
            const newSale = await tx.sale.create({
                data: {
                    ...data,
                    tenantId,
                },
            });

            await tx.saleItem.createMany({
                data: items,
            });

            return tx.sale.findUnique({
                where: { id: newSale.id, tenantId },
                include: {
                    items: true,
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    }
                },
            });
        });

        return SaleMapper.toDomain(created!);
    }

    async findById(tenantId: string, id: string): Promise<Sale | null> {
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
            include: {
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                sku: true,
                            }
                        }
                    }
                }
            },
        });

        if (!sale) return null;

        return SaleMapper.toDomain(sale);
    }

    async findAll(tenantId: string, filters: SaleFilters): Promise<SaleSearchResult> {
        const { userId, customerId, status, startDate, endDate, sortBy, sortOrder } = filters;

        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            tenantId,
        };

        if (userId) where.userId = userId;
        if (customerId) where.customerId = customerId;
        if (status) where.status = status;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        const orderBy = sortBy ? { [sortBy]: sortOrder || ('desc' as const) } : { createdAt: 'desc' as const };

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    customer: {
                        select: {
                            firstName: true,
                            lastName: true,
                        }
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    name: true,
                                    sku: true,
                                }
                            }
                        }
                    }
                },
            }),
            this.prisma.sale.count({ where }),
        ]);

        return {
            data: sales.map(SaleMapper.toDomain),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getDailyRevenue(tenantId: string, days: number): Promise<{ date: string; revenue: number }[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        const sales = await this.prisma.sale.findMany({
            where: {
                tenantId,
                status: 'COMPLETED',
                createdAt: {
                    gte: startDate,
                },
            },
            select: {
                total: true,
                createdAt: true,
            },
        });

        const revenueMap: Record<string, number> = {};

        // Initialize map with zeros for all days in range
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            revenueMap[dateStr] = 0;
        }

        // Aggregate
        sales.forEach(sale => {
            const dateStr = sale.createdAt.toISOString().split('T')[0];
            if (revenueMap[dateStr] !== undefined) {
                revenueMap[dateStr] += Number(sale.total);
            }
        });

        // Convert to array and sort by date
        return Object.entries(revenueMap)
            .map(([date, revenue]) => ({
                date,
                revenue: Number(revenue.toFixed(2)),
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }

    async update(tenantId: string, sale: Sale): Promise<Sale> {
        const data = SaleMapper.toPersistence(sale);

        const updated = await this.prisma.sale.update({
            where: {
                id: sale.id.toString(),
                tenantId,
            },
            data,
            include: {
                customer: {
                    select: {
                        firstName: true,
                        lastName: true,
                    }
                },
                items: true,
            },
        });

        return SaleMapper.toDomain(updated);
    }
}
