import { Injectable } from '@nestjs/common';
import { Sale } from '../../../domain/entities/sales/sale.entity';
import { SaleFilters, SaleRepository, SaleSearchResult } from '../../../domain/repositories/sale-repository';
import { SaleMapper } from '../mappers/sale.mapper';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaSaleRepository implements SaleRepository {
    constructor(private prisma: PrismaService) { }

    async create(sale: Sale): Promise<Sale> {
        const data = SaleMapper.toPersistence(sale);
        const items = sale.items.map(item => SaleMapper.toPersistenceItem(item, sale.id.toString()));

        const created = await this.prisma.$transaction(async (tx) => {
            const newSale = await tx.sale.create({
                data: {
                    ...data,
                },
            });

            await tx.saleItem.createMany({
                data: items,
            });

            return tx.sale.findUnique({
                where: { id: newSale.id },
                include: { items: true },
            });
        });

        return SaleMapper.toDomain(created!);
    }

    async findById(tenantId: string, id: string): Promise<Sale | null> {
        const sale = await this.prisma.sale.findFirst({
            where: { id, tenantId },
            include: {
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
        const { userId, startDate, endDate, sortBy, sortOrder } = filters;

        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const skip = (page - 1) * limit;

        const where: any = {
            tenantId,
        };

        if (userId) where.userId = userId;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const orderBy = sortBy ? { [sortBy]: sortOrder || ('desc' as const) } : { createdAt: 'desc' as const };

        const [sales, total] = await Promise.all([
            this.prisma.sale.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
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

    async update(sale: Sale): Promise<Sale> {
        const data = SaleMapper.toPersistence(sale);

        const updated = await this.prisma.sale.update({
            where: { id: sale.id.toString() },
            data,
            include: { items: true },
        });

        return SaleMapper.toDomain(updated);
    }
}
